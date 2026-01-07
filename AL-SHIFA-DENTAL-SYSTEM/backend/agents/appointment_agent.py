from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

# --- PROJECT IMPORTS ---
from database import SessionLocal
from models import Appointment, Doctor
from agents.base_agent import BaseAgent

# --- SERVICE IMPORTS ---
try:
    from services.doctor_schedule_ai import SchedulerService
except ImportError:
    SchedulerService = None

# ==========================================================
# 1. INPUT SCHEMA
# ==========================================================
class AgentInput(BaseModel):
    user_query: Optional[str] = None
    role: str = "patient"
    doctor_id: Optional[str] = None
    patient_id: Optional[str] = None
    slot_id: Optional[str] = None # Format: "DOCTORUUID_HHMM"
    date: Optional[str] = None    # YYYY-MM-DD
    intent: Optional[str] = None  # "view_slots" | "book"

# ==========================================================
# 2. THE AGENT CLASS
# ==========================================================
class AppointmentAgent(BaseAgent):
    """
    ELITE APPOINTMENT AGENT
    -----------------------
    The "Front Desk" logic.
    - Connects User Intents -> Scheduler Engine -> Database.
    - Handles 'View Slots' and 'Book Slot' transactions.
    """

    def __init__(self):
        super().__init__("appointment")
        # Initialize DB Session
        self.db = SessionLocal()
        
        # Initialize Calculation Engine
        if SchedulerService:
            self.scheduler = SchedulerService(self.db)
        else:
            print("⚠️ WARNING: SchedulerService not found. Agent will fail.")

    async def process(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Execution Logic.
        Overrides BaseAgent.process().
        """
        # 1. Input Validation
        try:
            # Handle both dict and Pydantic input
            if isinstance(payload, dict):
                # Filter out keys that aren't in AgentInput to avoid Pydantic errors
                valid_keys = AgentInput.model_fields.keys()
                filtered_payload = {k: v for k, v in payload.items() if k in valid_keys}
                data = AgentInput(**filtered_payload)
            else:
                data = payload
        except Exception as e:
            return {"response_text": f"Request format error: {str(e)}", "action_taken": "error"}

        # 2. Intent Detection (Logic Layer)
        intent = data.intent
        if not intent:
            query = (data.user_query or "").lower()
            if any(x in query for x in ["book", "confirm", "reserve", "take that", "yes"]):
                intent = "book"
            else:
                intent = "view_slots"

        # 3. Routing
        if intent == "view_slots":
            return await self._handle_view_slots(data)
        elif intent == "book":
            return await self._handle_booking(data)
        else:
            return {"response_text": "I can help you view slots or book an appointment. Which would you prefer?", "action_taken": "clarify"}

    # ------------------------------------------------------
    # 🕵️ HANDLER: VIEW SLOTS
    # ------------------------------------------------------
    async def _handle_view_slots(self, data: AgentInput) -> Dict[str, Any]:
        target_date = data.date or datetime.now().strftime("%Y-%m-%d")
        doctor_id = data.doctor_id

        # LOGIC: Auto-select Doctor (MVP Rule: Default to first doctor if unspecified)
        if not doctor_id:
            first_doc = self.db.query(Doctor).first()
            if not first_doc:
                return {"response_text": "No doctors are currently registered.", "action_taken": "error"}
            doctor_id = str(first_doc.id)
            doctor_name = "Dr. " + (first_doc.specialization or "Dentist")
        else:
            doc = self.db.query(Doctor).filter(Doctor.id == doctor_id).first()
            doctor_name = ("Dr. " + doc.specialization) if doc else "the doctor"

        # CALL SERVICE: Get Slots
        try:
            slots = self.scheduler.get_available_slots(doctor_id, target_date)
        except Exception as e:
            return {"response_text": "I'm having trouble accessing the calendar.", "action_taken": "error", "debug": str(e)}

        if not slots:
            return {
                "response_text": f"I checked schedule for {target_date}, but I don't see any openings.",
                "action_taken": "suggest_alternate"
            }

        # SUCCESS RESPONSE
        return {
            "response_text": f"I found {len(slots)} available openings for {target_date}. Please select a slot:",
            "action_taken": "show_slots",
            "available_slots": slots, # Frontend uses this to render buttons
            "context": {"doctor_id": doctor_id, "date": target_date}
        }

    # ------------------------------------------------------
    # 📝 HANDLER: BOOKING
    # ------------------------------------------------------
    async def _handle_booking(self, data: AgentInput) -> Dict[str, Any]:
        if not data.slot_id:
            return {"response_text": "Please select a specific time slot above first.", "action_taken": "ask_slot"}
        
        patient_id = data.patient_id
        if not patient_id:
             return {"response_text": "I need you to log in as a patient to confirm this booking.", "action_taken": "ask_auth"}

        # 1. Parse Slot ID (Expected Format: "DOC-UUID_HHMM")
        try:
            # Safety split - handle UUIDs containing dashes
            parts = data.slot_id.rsplit('_', 1)
            if len(parts) != 2: raise ValueError("Invalid Slot ID format")
            
            doc_id_part, time_part = parts
            target_date = data.date or datetime.now().strftime("%Y-%m-%d")
            
            # Construct Datetimes
            start_dt = datetime.strptime(f"{target_date} {time_part}", "%Y-%m-%d %H%M")
            
            doctor = self.db.query(Doctor).filter(Doctor.id == doc_id_part).first()
            if not doctor: raise ValueError("Doctor not found")
            
            # Calculate End Time
            end_dt = start_dt + timedelta(minutes=doctor.slot_duration)

        except Exception:
            return {"response_text": "That time slot seems invalid. Please try selecting again.", "action_taken": "retry_slot"}

        # 2. Race Condition Check
        existing = self.db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id,
            Appointment.start_time == start_dt,
            Appointment.status != "cancelled"
        ).first()

        if existing:
            return {"response_text": "Just missed it! That slot was taken a second ago.", "action_taken": "retry_slot"}

        # 3. Commit Booking
        try:
            new_appt = Appointment(
                patient_id=patient_id,
                doctor_id=doctor.id,
                hospital_id=doctor.hospital_id,
                start_time=start_dt,
                end_time=end_dt,
                status="confirmed",
                reason=data.user_query or "AI Booking",
                ai_notes="Booked via Dental Co-Pilot"
            )
            self.db.add(new_appt)
            self.db.commit()
            
            # 4. Success Output
            formatted_time = start_dt.strftime('%A, %b %d at %I:%M %p')
            return {
                "response_text": f"✅ **Confirmed!**\n\nYour appointment is set for:\n📅 {formatted_time}",
                "action_taken": "booking_confirmed",
                "data": {"appointment_id": str(new_appt.id)}
            }
            
        except Exception as e:
            self.db.rollback()
            return {"response_text": "A technical error stopped the booking. Please contact support.", "action_taken": "error"}