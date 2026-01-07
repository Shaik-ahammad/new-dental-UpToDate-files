from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

# --- PROJECT IMPORTS ---
from database import SessionLocal
from models import Appointment, Doctor, Hospital
from agents.base_agent import BaseAgent

# ==========================================================
# 1. INPUT SCHEMA
# ==========================================================
class RevenueInput(BaseModel):
    user_query: Optional[str] = None
    role: str = "doctor"          # admin | organization | doctor
    organization_id: Optional[str] = None
    doctor_id: Optional[str] = None # The requesting doctor
    intent: Optional[str] = None  # "summary" | "breakdown" | "forecast"
    period: str = "monthly"       # daily | weekly | monthly

# ==========================================================
# 2. INTELLIGENCE ENGINE (Financial Logic)
# ==========================================================
class RevenueIntelligence:
    """
    Encapsulates financial rules.
    Decoupled from DB for "Clean Code" adherence.
    """
    STANDARD_FEE = 1500.00  # Default fee per appointment (MVP)

    @staticmethod
    def calculate_total(appt_count: int) -> float:
        return appt_count * RevenueIntelligence.STANDARD_FEE

    @staticmethod
    def generate_forecast(current_revenue: float) -> float:
        # Simple algorithm: Project 10% growth based on current run rate
        return current_revenue * 1.10

    @staticmethod
    def generate_insights(breakdown: List[dict]) -> List[str]:
        if not breakdown: return ["No data available for insights."]
        
        # Sort by revenue
        sorted_data = sorted(breakdown, key=lambda x: x['revenue'], reverse=True)
        top = sorted_data[0]
        
        insights = [f"🏆 **Top Performer:** {top['doctor_name']} ({top['count']} appts)."]
        
        if len(sorted_data) > 1:
            bottom = sorted_data[-1]
            insights.append(f"📉 **Needs Attention:** {bottom['doctor_name']} has low volume.")
            
        return insights

# ==========================================================
# 3. THE AGENT CLASS
# ==========================================================
class RevenueAgent(BaseAgent):
    """
    ELITE REVENUE AGENT
    -------------------
    - Performs Real-Time Aggregation of Appointment Data.
    - Enforces strict Role-Based Access Control (RBAC).
    - Generates financial reports on the fly.
    """

    def __init__(self):
        super().__init__("revenue")
        self.db = SessionLocal()

    async def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Execution Logic.
        Overrides BaseAgent.process().
        """
        # 1. Validate Input
        try:
            if isinstance(payload, dict):
                # Filter valid keys
                valid_keys = RevenueInput.model_fields.keys()
                filtered = {k: v for k, v in payload.items() if k in valid_keys}
                data = RevenueInput(**filtered)
            else:
                data = payload
        except Exception as e:
            return {"response_text": f"Input error: {str(e)}", "action_taken": "error"}

        # 2. RBAC & Context Resolution
        # If user is a Doctor, force the doctor_id constraint
        if data.role == "doctor":
            if not data.doctor_id:
                # Try to resolve from User ID if passed in payload (not shown here, assuming payload has doctor_id)
                return {"response_text": "Access Denied: Doctor ID missing.", "action_taken": "block_access"}
            # Doctor can ONLY view their own summary/forecast, not breakdown of others
            if data.intent == "breakdown":
                data.intent = "summary" # Downgrade intent for security

        # If user is Org/Admin, ensure Organization ID
        if data.role in ["organization", "admin"] and not data.organization_id:
             # Fallback logic for MVP: Fetch first hospital
             first_org = self.db.query(Hospital).first()
             if first_org: data.organization_id = str(first_org.id)

        # 3. Detect Intent (Keyword fallback)
        if not data.intent:
            q = (data.user_query or "").lower()
            if "forecast" in q or "predict" in q: data.intent = "forecast"
            elif "breakdown" in q or "list" in q: data.intent = "breakdown"
            else: data.intent = "summary"

        # 4. Execute
        if data.intent == "summary":
            return self._get_summary(data)
        elif data.intent == "breakdown":
            return self._get_breakdown(data)
        elif data.intent == "forecast":
            return self._get_forecast(data)

        return {"response_text": "I couldn't process that financial request.", "action_taken": "none"}

    # ------------------------------------------------------
    # 📊 HANDLER: SUMMARY
    # ------------------------------------------------------
    def _get_summary(self, data: RevenueInput) -> Dict[str, Any]:
        # Base Query
        query = self.db.query(Appointment).filter(Appointment.status == "confirmed")
        
        # Apply Filters
        if data.role == "doctor":
            query = query.filter(Appointment.doctor_id == data.doctor_id)
        elif data.organization_id:
            query = query.filter(Appointment.hospital_id == data.organization_id)

        # Execute Count
        count = query.count()
        total_revenue = RevenueIntelligence.calculate_total(count)

        return {
            "response_text": f"💰 **Revenue Summary ({data.period.title()})**\n\n"
                             f"• **Appointments:** {count}\n"
                             f"• **Total Revenue:** ${total_revenue:,.2f}",
            "action_taken": "show_summary",
            "data": {"revenue": total_revenue, "count": count}
        }

    # ------------------------------------------------------
    # 📋 HANDLER: DOCTOR BREAKDOWN (Admin/Org Only)
    # ------------------------------------------------------
    def _get_breakdown(self, data: RevenueInput) -> Dict[str, Any]:
        if data.role == "doctor":
            return {"response_text": "Doctors cannot view peer revenue data.", "action_taken": "denied"}

        # Aggregation Query: Group by Doctor Name
        results = self.db.query(
            Doctor.full_name, 
            func.count(Appointment.id)
        ).join(Appointment).filter(
            Appointment.hospital_id == data.organization_id,
            Appointment.status == "confirmed"
        ).group_by(Doctor.full_name).all()

        breakdown_data = []
        for name, count in results:
            breakdown_data.append({
                "doctor_name": f"Dr. {name}",
                "count": count,
                "revenue": RevenueIntelligence.calculate_total(count)
            })

        insights = RevenueIntelligence.generate_insights(breakdown_data)
        
        # Text Formatting
        report = "📊 **Revenue Breakdown:**\n"
        for item in breakdown_data:
            report += f"- **{item['doctor_name']}**: ${item['revenue']:,.0f} ({item['count']})\n"
        
        report += "\n💡 **Insight:** " + insights[0]

        return {
            "response_text": report,
            "action_taken": "show_breakdown",
            "data": breakdown_data
        }

    # ------------------------------------------------------
    # 📈 HANDLER: FORECAST
    # ------------------------------------------------------
    def _get_forecast(self, data: RevenueInput) -> Dict[str, Any]:
        # Get current stats first
        summary = self._get_summary(data)["data"]
        current_rev = summary["revenue"]
        
        # Calculate Forecast
        predicted = RevenueIntelligence.generate_forecast(current_rev)
        growth = predicted - current_rev

        return {
            "response_text": f"🔮 **Revenue Forecast (Next Period)**\n\n"
                             f"Based on current volume, we project:\n"
                             f"• **Target:** ${predicted:,.2f}\n"
                             f"• **Growth:** +${growth:,.2f} (+10%)",
            "action_taken": "show_forecast",
            "data": {"current": current_rev, "predicted": predicted}
        }