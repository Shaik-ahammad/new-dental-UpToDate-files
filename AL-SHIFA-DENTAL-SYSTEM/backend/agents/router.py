from typing import Dict, Any
import logging

# --- IMPORT SPECIALIST AGENTS ---
# Note: These files will be created in subsequent steps.
# We import them now to establish the architecture.
# If running immediately, ensure dummy files exist or comment these out temporarily.
from .appointment_agent import AppointmentAgent
from .inventory_agent import InventoryAgent
from .revenue_agent import RevenueAgent
from .case_agent import CaseAgent
from .medical_agent import MedicalAgent 

logger = logging.getLogger("AgentRouter")

class AgentRouter:
    """
    ELITE INTELLIGENCE ROUTER
    -------------------------
    The 'Brain' that decides which agent handles the request.
    Integrates Intent Detection (Ver A) and Safety Triage (Ver B).
    """

    def __init__(self):
        # Initialize Specialist Agents
        self.agents = {
            "appointment": AppointmentAgent(),
            "inventory": InventoryAgent(),
            "revenue": RevenueAgent(),
            "case_tracking": CaseAgent(),
            "medical": MedicalAgent(), # General/Triage Agent
        }

    async def route(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for all AI requests.
        Payload: { "user_query": str, "user_id": str, "role": str, ... }
        """
        user_query = payload.get("user_query", "").lower()
        agent_type = payload.get("agent_type")
        user_role = payload.get("role", "patient")

        # --- PHASE 1: PRE-EMPTIVE SAFETY CHECK (From Ver B) ---
        # Immediate triage before complex logic
        emergency_keywords = ["bleeding", "severe pain", "swelling", "difficulty breathing", "trauma"]
        if any(keyword in user_query for keyword in emergency_keywords):
            return {
                "response_text": "🚨 EMERGENCY ALERT: Please go to the nearest ER immediately or call emergency services. I have notified the doctor.",
                "action_taken": "escalate_emergency",
                "ui_component": "emergency_banner",
                "status": "escalated"
            }

        # --- PHASE 2: TARGET RESOLUTION ---
        target_agent_key = agent_type

        # If no explicit agent is requested, use Intent Detection
        if not target_agent_key:
            target_agent_key = self._detect_intent(user_query, user_role)

        # --- PHASE 3: DISPATCH ---
        agent = self.agents.get(target_agent_key)
        
        if not agent:
            # Fallback to Medical/General if specific agent fails
            agent = self.agents["medical"]
            target_agent_key = "medical"

        try:
            # Execute the agent using the standardized BaseAgent method
            response = await agent.execute(payload)
            
            # Append Routing Metadata
            response["routed_to"] = target_agent_key
            return self._format_response("success", data=response, agent=target_agent_key)

        except Exception as e:
            logger.error(f"Router Dispatch Error: {e}")
            return self._format_response(
                status="error",
                message="Internal Router Error",
                data={"response_text": "I'm having trouble connecting to the neural network."}
            )

    def _detect_intent(self, query: str, role: str) -> str:
        """
        NLP Logic to classify user intent into an agent key.
        Combines Version A (Admin roles) and Version B (Simple keywords).
        """
        # 1. Appointment Intents
        booking_keywords = ["book", "appointment", "schedule", "slot", "visit", "reschedule", "cancel"]
        if any(w in query for w in booking_keywords):
            return "appointment"

        # 2. Admin Intents (Doctor/Admin ONLY)
        if role in ["doctor", "admin"]:
            # Inventory
            if any(w in query for w in ["stock", "inventory", "supply", "order", "quantity"]):
                return "inventory"
            
            # Revenue/Finance
            if any(w in query for w in ["revenue", "sales", "income", "profit", "finance", "report"]):
                return "revenue"
            
            # Case Tracking
            if any(w in query for w in ["lab", "status", "case", "delivery", "technician"]):
                return "case_tracking"

        # 3. Medical/General Intents (Default Fallback)
        # Includes: "pain", "symptom", "advice", "care", "eat"
        return "medical"

    def _format_response(self, status: str, data: Dict = None, agent: str = "system", message: str = "") -> Dict:
        """
        Standardized Response Envelope
        """
        if not data: data = {}
        return {
            "status": status,
            "agent_used": agent,
            "system_message": message,
            "response_text": data.get("response_text", ""),
            "action_taken": data.get("action_taken", "none"),
            "data": data # Full raw data access
        }