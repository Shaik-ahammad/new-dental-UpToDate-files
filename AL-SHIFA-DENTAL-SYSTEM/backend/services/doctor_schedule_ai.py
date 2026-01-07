from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_
import models 

# Import the Google Calendar Tool (Stub for now)
try:
    from mcp.google_calendar import calendar_tool
except ImportError:
    calendar_tool = None

class SchedulerService:
    """
    ELITE SCHEDULING ENGINE
    -----------------------
    Handles both the configuration of doctor schedules (AI-driven)
    and the calculation of available slots (Runtime).
    """

    def __init__(self, db: Session):
        self.db = db

    # ==========================================================
    # PART 1: CONFIGURATION (From Version A)
    # ==========================================================
    def update_doctor_schedule_config(
        self, 
        doctor_user_id: str, 
        consultation_style: str = "normal", 
        wants_breaks: bool = False,
        work_start: str = "09:00",
        work_end: str = "17:00"
    ):
        """
        Updates the Doctor's profile with concrete time settings.
        """
        # 1. Map Style to Duration (AI Logic)
        style_map = {
            "fast": 15,      # High volume
            "normal": 30,    # Standard checkup
            "detailed": 45,  # Comprehensive
            "surgery": 60    # Procedures
        }
        slot_duration = style_map.get(consultation_style, 30)

        # 2. Configure Breaks
        break_duration = 10 if wants_breaks else 0
        slot_mode = "interleaved" if wants_breaks else "continuous"

        # 3. Update DB
        doctor = self.db.query(models.Doctor).filter(models.Doctor.user_id == doctor_user_id).first()
        if not doctor:
            raise ValueError("Doctor profile not found")

        doctor.slot_duration = slot_duration
        doctor.break_duration = break_duration
        doctor.slot_mode = slot_mode # From Ver B
        doctor.work_start_time = work_start
        doctor.work_end_time = work_end
        
        self.db.commit()
        self.db.refresh(doctor)
        
        return {
            "status": "success",
            "message": f"Schedule updated: {slot_duration}min slots ({slot_mode})."
        }

    # ==========================================================
    # PART 2: RUNTIME CALCULATION (Merged Logic)
    # ==========================================================
    def get_available_slots(self, doctor_id: str, date_str: str = None) -> List[Dict]:
        """
        Generates actionable slots.
        Combines DB Availability + Config Rules + (Optional) Google Calendar.
        """
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        # 1. Fetch Doctor Config
        doctor = self.db.query(models.Doctor).filter(
            (models.Doctor.id == doctor_id) | (models.Doctor.user_id == doctor_id)
        ).first()
        
        if not doctor:
            return []

        # 2. Parse Working Hours
        try:
            work_start = datetime.strptime(f"{date_str} {doctor.work_start_time}", "%Y-%m-%d %H:%M")
            work_end = datetime.strptime(f"{date_str} {doctor.work_end_time}", "%Y-%m-%d %H:%M")
            
            # Use Configured Duration or Default
            slot_duration = doctor.slot_duration or 30
            break_duration = doctor.break_duration or 0
        except ValueError:
            # Fallback
            work_start = datetime.strptime(f"{date_str} 09:00", "%Y-%m-%d %H:%M")
            work_end = datetime.strptime(f"{date_str} 17:00", "%Y-%m-%d %H:%M")
            slot_duration = 30
            break_duration = 0

        # 3. Fetch Existing DB Conflicts
        existing_appts = self.db.query(models.Appointment).filter(
            models.Appointment.doctor_id == doctor.id,
            models.Appointment.start_time >= work_start,
            models.Appointment.start_time < work_end + timedelta(days=1),
            models.Appointment.status != "cancelled"
        ).all()

        busy_intervals = []
        for appt in existing_appts:
            busy_intervals.append((appt.start_time, appt.end_time))

        # 4. (Optional) Fetch Google Calendar Conflicts
        # In a real sync call, we would add those ranges here.
        # if calendar_tool: ...

        # 5. Generate Slots
        available_slots = []
        current_time = work_start
        slot_delta = timedelta(minutes=slot_duration)
        break_delta = timedelta(minutes=break_duration)

        while current_time + slot_delta <= work_end:
            slot_end = current_time + slot_delta
            
            # Conflict Check
            is_conflict = False
            for busy_start, busy_end in busy_intervals:
                # Overlap Formula: (StartA < EndB) and (EndA > StartB)
                if current_time < busy_end and slot_end > busy_start:
                    is_conflict = True
                    break
            
            if not is_conflict:
                # Format for Frontend
                available_slots.append({
                    "slot_id": f"{doctor.id}_{current_time.strftime('%H%M')}",
                    "time": current_time.strftime("%I:%M %p"), # "10:00 AM" (Friendly)
                    "start": current_time.strftime("%H:%M"),   # "10:00" (ISO-ish)
                    "end": slot_end.strftime("%H:%M"),
                    "doctor_id": str(doctor.id)
                })

            # Increment logic based on mode
            current_time = slot_end + break_delta

        return available_slots