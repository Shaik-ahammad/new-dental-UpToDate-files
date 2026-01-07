from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

# --- PROJECT IMPORTS ---
from database import SessionLocal
from models import Patient, Appointment, Doctor
from agents.base_agent import BaseAgent
from vectordb.client import vector_db

# --- INFRASTRUCTURE (Mocked for MVP completeness if files missing) ---
try:
    from infra.whatsapp import whatsapp_service
except ImportError:
    whatsapp_service = None

# ==========================================================
# 1. INPUT SCHEMA
# ==========================================================
class CaseInput(BaseModel):
    user_query: str
    patient_id: Optional[str] = None
    role: str = "patient" # patient | doctor
    intent: Optional[str] = None # status | history | xray | advice

# ==========================================================
# 2. MEDICAL KNOWLEDGE ENGINE
# ==========================================================
class ClinicalEngine:
    """
    Manages medical logic, risk detection, and lab statuses.
    """
    HIGH_RISK_KEYWORDS = [
        "bleeding", "severe pain", "swelling", "infection", "fever", 
        "pus", "uncontrolled", "difficulty breathing", "numbness"
    ]

    LAB_STATUS_MOCK = {
        "CASE_501": "Shipped (Exp. Tomorrow)",
        "CASE_502": "Processing (3D Printing)",
        "CASE_503": "Quality Check Failed - Retrying"
    }

    @staticmethod
    def detect_risk(query: str) -> bool:
        query = query.lower()
        return any(k in query for k in ClinicalEngine.HIGH_RISK_KEYWORDS)

    @staticmethod
    def get_lab_status(case_id: str) -> str:
        return ClinicalEngine.LAB_STATUS_MOCK.get(case_id, "In Queue")

# ==========================================================
# 3. THE AGENT CLASS
# ==========================================================
class CaseAgent(BaseAgent):
    """
    ELITE CASE TRACKING AGENT (Clinical Assistant)
    ----------------------------------------------
    Uses RAG (Retrieval-Augmented Generation) to answer medical questions.
    - Context: Merges DB History + Vector Knowledge.
    - Safety: Escalates emergencies.
    """

    def __init__(self):
        super().__init__("clinical") # 'clinical' matches Router key
        self.db = SessionLocal()

    async def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Execution Logic.
        Overrides BaseAgent.process().
        """
        # 1. Validate Input
        try:
            if isinstance(payload, dict):
                valid_keys = CaseInput.model_fields.keys()
                filtered = {k: v for k, v in payload.items() if k in valid_keys}
                data = CaseInput(**filtered)
            else:
                data = payload
        except Exception as e:
            return {"response_text": f"Input error: {str(e)}", "action_taken": "error"}

        # 2. 🛡️ SAFETY CHECK (Specific to Clinical)
        if ClinicalEngine.detect_risk(data.user_query):
            await self._escalate_emergency(data)
            return {
                "response_text": "🚨 **Alert:** Your symptoms require immediate professional attention. I have notified the doctor. Please call the clinic or visit the ER if urgent.",
                "action_taken": "emergency_escalation",
                "ui_component": "emergency_banner"
            }

        # 3. Resolve Context (Patient)
        patient = None
        if data.patient_id:
            patient = self.db.query(Patient).filter(Patient.id == data.patient_id).first()
        elif data.role == "patient":
            # Try to resolve from User ID (omitted for brevity, MVP assumption)
            pass

        # 4. Routing
        query = data.user_query.lower()
        if "xray" in query or "scan" in query:
            return self._handle_xray(data)
        elif "status" in query or "lab" in query:
            return self._check_case_status(data, patient)
        else:
            # Default: RAG-based Advice
            return self._provide_clinical_advice(data, patient)

    # ------------------------------------------------------
    # 🧠 HANDLER: CLINICAL ADVICE (RAG)
    # ------------------------------------------------------
    def _provide_clinical_advice(self, data: CaseInput, patient: Optional[Patient]) -> Dict[str, Any]:
        # A. Retrieve Patient Context (Relational DB)
        history_text = ""
        if patient:
            history_text = f"Patient: {patient.full_name}, Age: {patient.age}. History: {patient.medical_history_summary}. "
            # Get last 3 appointments
            last_appts = self.db.query(Appointment).filter(
                Appointment.patient_id == patient.id
            ).order_by(Appointment.start_time.desc()).limit(3).all()
            
            for appt in last_appts:
                history_text += f"Visit {appt.start_time.date()}: {appt.ai_notes or appt.reason}. "

        # B. Retrieve Knowledge (Vector DB)
        # We query the clinical guidelines collection
        documents = vector_db.query("clinical_guidelines", data.user_query, n_results=2)
        knowledge_context = " ".join(documents) if documents else "Standard dental care applies."

        # C. Synthesis (Simulated LLM)
        # In a real system, we'd send `history_text + knowledge_context + user_query` to GPT-4.
        # For MVP, we construct a structured response.
        
        response = (
            f"Based on your history ({patient.medical_history_summary if patient else 'General'}), here is some guidance:\n\n"
            f"ℹ️ **Relevant Protocol:** {knowledge_context[:200]}...\n\n"
            "**Note:** This is AI advice. Please confirm with Dr. Ali."
        )

        return {
            "response_text": response,
            "action_taken": "rag_advice",
            "data": {"sources": ["clinical_guidelines", "patient_history"]}
        }

    # ------------------------------------------------------
    # 🦷 HANDLER: CASE / LAB STATUS
    # ------------------------------------------------------
    def _check_case_status(self, data: CaseInput, patient: Optional[Patient]) -> Dict[str, Any]:
        # Mock logic to link patient to a "Case"
        # In production, we'd have a 'Cases' table.
        # Here we simulate finding an active case.
        
        active_case_id = "CASE_501" # Mock
        status = ClinicalEngine.get_lab_status(active_case_id)
        
        return {
            "response_text": f"🔎 **Case Status Update**\n\n"
                             f"**Case ID:** {active_case_id}\n"
                             f"**Stage:** Lab Fabrication\n"
                             f"**Status:** {status}",
            "action_taken": "show_status"
        }

    # ------------------------------------------------------
    # 📸 HANDLER: X-RAY ANALYSIS (Mock Tool)
    # ------------------------------------------------------
    def _handle_xray(self, data: CaseInput) -> Dict[str, Any]:
        return {
            "response_text": "Please upload the X-Ray image for analysis.",
            "action_taken": "request_upload",
            "ui_component": "upload_button" # Frontend handles this
        }

    # ------------------------------------------------------
    # 🚨 HELPER: EMERGENCY NOTIFICATION
    # ------------------------------------------------------
    async def _escalate_emergency(self, data: CaseInput):
        print(f"!!! ESCALATING EMERGENCY: {data.user_query} !!!")
        if whatsapp_service:
            # Notify Doctor
            await whatsapp_service.send_message(
                "555-0199", # Doctor's number
                f"🚨 URGENT: Patient reporting '{data.user_query}'. Please review."
            )