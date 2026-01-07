from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# --- PROJECT IMPORTS ---
from database import SessionLocal
from models import Inventory, Hospital
from agents.base_agent import BaseAgent

# ==========================================================
# 1. INPUT SCHEMA
# ==========================================================
class InventoryInput(BaseModel):
    user_query: Optional[str] = None
    role: str = "doctor"          # admin | organization | doctor
    organization_id: Optional[str] = None # Mapped to hospital_id
    intent: Optional[str] = None  # "view" | "consume" | "restock" | "alerts"
    item_name: Optional[str] = None
    quantity: Optional[int] = None

# ==========================================================
# 2. INTELLIGENCE ENGINE (Business Logic Layer)
# ==========================================================
class InventoryIntelligence:
    """
    Pure logic for stock analysis. 
    Decoupled from DB for easier testing.
    """
    @staticmethod
    def calculate_status(quantity: int, min_threshold: int = 50) -> str:
        if quantity <= 0: return "Critical"
        if quantity <= min_threshold: return "Low"
        return "Good"

    @staticmethod
    def generate_alerts(items: List[Inventory]) -> List[str]:
        alerts = []
        for item in items:
            # Logic: If status is explicitly Low/Critical OR quantity < 10 (Default safety)
            if item.status in ["Low", "Critical"] or item.quantity < 10:
                alerts.append(
                    f"⚠️ **Low Stock:** {item.item_name} (Qty: {item.quantity}). Please restock."
                )
        return alerts

# ==========================================================
# 3. THE AGENT CLASS
# ==========================================================
class InventoryAgent(BaseAgent):
    """
    ELITE INVENTORY AGENT
    ---------------------
    Manages hospital resources.
    - Connects User Intents -> DB (Inventory Table).
    - Capabilities: View Stock, Consume, Restock, Predict Shortages.
    """

    def __init__(self):
        super().__init__("inventory")
        self.db = SessionLocal()

    async def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Execution Logic.
        Overrides BaseAgent.process().
        """
        # 1. Validate Input
        try:
            if isinstance(payload, dict):
                # Filter valid keys for Pydantic
                valid_keys = InventoryInput.model_fields.keys()
                filtered = {k: v for k, v in payload.items() if k in valid_keys}
                data = InventoryInput(**filtered)
            else:
                data = payload
        except Exception as e:
            return {"response_text": f"Input error: {str(e)}", "action_taken": "error"}

        # 2. Resolve Context (Hospital ID)
        # In a real app, we extract this from the User's session/token.
        # For MVP, if not provided, we try to find the first hospital or fail.
        if not data.organization_id:
            # Attempt to resolve from user context if available (skipped for brevity)
            # Fallback:
            first_hosp = self.db.query(Hospital).first()
            if first_hosp:
                data.organization_id = str(first_hosp.id)
            else:
                return {"response_text": "No hospital found in system.", "action_taken": "error"}

        # 3. Detect Intent (If not explicit)
        if not data.intent:
            query = (data.user_query or "").lower()
            if any(w in query for w in ["add", "buy", "restock", "supply"]):
                data.intent = "restock"
            elif any(w in query for w in ["use", "consume", "take", "minus"]):
                data.intent = "consume"
            elif "alert" in query or "warning" in query:
                data.intent = "alerts"
            else:
                data.intent = "view"

        # 4. Route to Handler
        if data.intent == "view":
            return self._view_inventory(data.organization_id)
        elif data.intent == "consume":
            return self._update_stock(data, operation="consume")
        elif data.intent == "restock":
            return self._update_stock(data, operation="restock")
        elif data.intent == "alerts":
            return self._check_alerts(data.organization_id)
        
        return {"response_text": "I didn't understand that inventory request.", "action_taken": "none"}

    # ------------------------------------------------------
    # 🔍 HANDLER: VIEW
    # ------------------------------------------------------
    def _view_inventory(self, hospital_id: str) -> Dict[str, Any]:
        items = self.db.query(Inventory).filter(Inventory.hospital_id == hospital_id).all()
        
        if not items:
            return {
                "response_text": "The inventory is currently empty.",
                "action_taken": "view_empty",
                "data": []
            }

        # Format as a nice list
        report = "📦 **Current Inventory:**\n"
        item_list = []
        for item in items:
            status_icon = "🟢" if item.status == "Good" else "🔴"
            report += f"{status_icon} **{item.item_name}**: {item.quantity} {item.unit}\n"
            item_list.append({
                "id": str(item.id),
                "name": item.item_name,
                "qty": item.quantity,
                "status": item.status
            })

        return {
            "response_text": report,
            "action_taken": "view_inventory",
            "data": item_list
        }

    # ------------------------------------------------------
    # 📉📈 HANDLER: CONSUME / RESTOCK
    # ------------------------------------------------------
    def _update_stock(self, data: InventoryInput, operation: str) -> Dict[str, Any]:
        if not data.item_name or not data.quantity:
            return {"response_text": f"I need the item name and quantity to {operation}.", "action_taken": "ask_details"}

        # Find Item (Case Insensitive Search)
        item = self.db.query(Inventory).filter(
            Inventory.hospital_id == data.organization_id,
            Inventory.item_name.ilike(data.item_name) # Postgres case-insensitive match
        ).first()

        # Handle "New Item" scenario for Restock
        if not item:
            if operation == "consume":
                return {"response_text": f"Error: '{data.item_name}' not found in inventory.", "action_taken": "error"}
            else:
                # Create new item
                item = Inventory(
                    hospital_id=data.organization_id,
                    item_name=data.item_name,
                    quantity=0,
                    status="Good"
                )
                self.db.add(item)

        # Update Logic
        if operation == "consume":
            if item.quantity < data.quantity:
                return {"response_text": f"Not enough stock! Only {item.quantity} available.", "action_taken": "error"}
            item.quantity -= data.quantity
        else: # restock
            item.quantity += data.quantity

        # Auto-Update Status
        item.status = InventoryIntelligence.calculate_status(item.quantity)
        
        try:
            self.db.commit()
            action_verb = "removed from" if operation == "consume" else "added to"
            return {
                "response_text": f"✅ Successfully {action_verb} stock.\n**{item.item_name}**: {item.quantity} (Status: {item.status})",
                "action_taken": f"{operation}_success",
                "data": {"item_id": str(item.id), "new_qty": item.quantity}
            }
        except Exception as e:
            self.db.rollback()
            return {"response_text": "Database error while updating stock.", "action_taken": "error"}

    # ------------------------------------------------------
    # ⚠️ HANDLER: ALERTS
    # ------------------------------------------------------
    def _check_alerts(self, hospital_id: str) -> Dict[str, Any]:
        items = self.db.query(Inventory).filter(Inventory.hospital_id == hospital_id).all()
        alerts = InventoryIntelligence.generate_alerts(items)

        if not alerts:
            return {"response_text": "✅ All stock levels look good!", "action_taken": "no_alerts"}

        return {
            "response_text": "⚠️ **Inventory Alerts:**\n" + "\n".join(alerts),
            "action_taken": "show_alerts",
            "data": alerts
        }