from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, time, timedelta
from typing import List, Optional, Union, Dict
from pydantic import BaseModel, Field
import uuid 
from uuid import UUID

# --- PROJECT IMPORTS ---
from database import get_db
from models import User, Doctor, Appointment, Patient, Inventory
from core.config import settings
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

# Re-declare to be safe
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_doctor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "doctor":
            raise HTTPException(status_code=403, detail="Doctor access required")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

router = APIRouter(prefix="/doctor", tags=["Doctor Dashboard"])

# 🟢 HELPER: Safe Time Formatter
def safe_time_str(t: Union[str, time, None]) -> Optional[str]:
    """
    Safely converts a database time field (which might be a string or a time object) 
    into a standardized "HH:MM" string.
    """
    if not t:
        return None
    if isinstance(t, str):
        # If DB returns "09:00:00", return "09:00"
        return t[:5]
    if hasattr(t, 'strftime'):
        return t.strftime("%H:%M")
    return str(t)

# ==========================================================
# 📊 1. DASHBOARD STATS (THE COCKPIT)
# ==========================================================
@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db), user: User = Depends(get_current_doctor)):
    """
    Aggregates all critical data for the Doctor's Home Screen.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    today = datetime.now().date()

    # 2. Today's Appointments
    today_appts = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        func.date(Appointment.start_time) == today,
        Appointment.status != "cancelled"
    ).order_by(Appointment.start_time.asc()).all()

    # 3. Next Appointment
    now = datetime.now()
    next_appt = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.start_time > now,
        Appointment.status != "cancelled"
    ).order_by(Appointment.start_time.asc()).first()

    # 4. Total Patients
    total_patients = db.query(func.count(func.distinct(Appointment.patient_id)))\
        .filter(Appointment.doctor_id == doctor.id).scalar()

    # 5. Revenue (Mock: 150 per confirmed appt this month)
    start_of_month = today.replace(day=1)
    monthly_appts = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.start_time >= start_of_month,
        Appointment.status == "confirmed"
    ).count()
    revenue = monthly_appts * 150

    # 6. Inventory Alerts
    low_stock = []
    if doctor.hospital_id:
        low_stock_items = db.query(Inventory).filter(
            Inventory.hospital_id == doctor.hospital_id,
            Inventory.quantity < 20
        ).limit(3).all()
        low_stock = [{"name": i.item_name, "qty": i.quantity} for i in low_stock_items]

    # 7. Format Schedule
    schedule = []
    for appt in today_appts:
        pat = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        pat_name = "Unknown"
        if pat:
            pat_user = db.query(User).filter(User.id == pat.user_id).first()
            if pat_user: pat_name = pat_user.full_name

        schedule.append({
            "id": str(appt.id),
            "time": appt.start_time.strftime("%I:%M %p"),
            "patient_name": pat_name,
            "type": appt.reason or "General Visit",
            "status": appt.status
        })

    return {
        "doctor_name": user.full_name,
        "today_count": len(today_appts),
        "next_appointment": next_appt.start_time.strftime("%I:%M %p") if next_appt else "Done for today",
        "total_patients": total_patients or 0,
        "monthly_revenue": revenue,
        "schedule": schedule,
        "inventory_alerts": low_stock
    }

# ==========================================================
# 📅 2. CALENDAR & APPOINTMENTS
# ==========================================================

# 🟢 Manual Booking Model
class ManualAppointment(BaseModel):
    patient_id: str
    date: str # YYYY-MM-DD
    time: str # HH:MM
    reason: str

@router.get("/appointments")
def get_appointments(
    date_str: str = Query(..., alias="date"), 
    view: str = "day", 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_doctor)
):
    """
    Fetches appointments for a specific date or week.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Invalid date format")

    # Define Range
    start_range = target_date
    if view == "week":
        start_range = target_date - timedelta(days=target_date.weekday())
        end_range = start_range + timedelta(days=6)
    else:
        end_range = target_date

    # Query Appointments
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status != "cancelled",
        func.date(Appointment.start_time) >= start_range,
        func.date(Appointment.start_time) <= end_range
    ).all()

    # Query Patients
    patient_ids = [a.patient_id for a in appointments]
    patient_map = {}
    if patient_ids:
        patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
        user_ids = [p.user_id for p in patients]
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_name_map = {u.id: u.full_name for u in users}
        for p in patients:
            patient_map[p.id] = user_name_map.get(p.user_id, "Unknown Patient")
    
    result = []
    for appt in appointments:
        result.append({
            "id": str(appt.id),
            "start": appt.start_time.isoformat(),
            "end": appt.end_time.isoformat(),
            "patient_name": patient_map.get(appt.patient_id, "Unknown"),
            "reason": appt.reason,
            "status": appt.status,
            "notes": appt.ai_notes
        })

    return {
        "date": date_str,
        "view": view,
        "appointments": result,
        "working_hours": {
            "start": safe_time_str(doctor.work_start_time) or "09:00",
            "end": safe_time_str(doctor.work_end_time) or "17:00"
        }
    }

@router.post("/appointments")
def create_manual_appointment(
    payload: ManualAppointment,
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_doctor)
):
    """
    Doctor manually books an appointment for an existing patient.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")
    
    # Parse DateTime
    try:
        start_dt = datetime.strptime(f"{payload.date} {payload.time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(400, "Invalid date/time format")

    end_dt = start_dt + timedelta(minutes=doctor.slot_duration or 30)
    
    # Check Conflicts
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status != "cancelled",
        Appointment.start_time < end_dt,
        Appointment.end_time > start_dt
    ).first()
    
    if conflict:
        raise HTTPException(400, "Slot already booked.")

    new_appt = Appointment(
        id=uuid.uuid4(),
        doctor_id=doctor.id,
        hospital_id=doctor.hospital_id,
        patient_id=UUID(payload.patient_id),
        start_time=start_dt,
        end_time=end_dt,
        status="confirmed", # Doctor bookings are auto-confirmed
        reason=payload.reason,
        ai_notes="Manual Booking by Doctor"
    )
    
    db.add(new_appt)
    db.commit()
    return {"status": "success", "message": "Appointment booked successfully."}

@router.get("/patients")
def get_my_patients(db: Session = Depends(get_db), user: User = Depends(get_current_doctor)):
    """
    Fetch list of patients who have consulted this doctor before (for dropdowns).
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")

    # Find distinct patients from past appointments
    patient_ids = db.query(Appointment.patient_id).filter(
        Appointment.doctor_id == doctor.id
    ).distinct().all()
    
    patient_ids = [p[0] for p in patient_ids] # Flatten list
    
    patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
    results = []
    
    for p in patients:
        u = db.query(User).filter(User.id == p.user_id).first()
        if u:
            results.append({
                "id": str(p.id),
                "name": u.full_name,
                "email": u.email
            })
    return results

# ==========================================================
# 🏥 4. PATIENT DETAILS & RECORDS (🟢 Added from Version B)
# ==========================================================

class MedicalRecordSchema(BaseModel):
    record_type: str # "prescription", "xray", "lab_report"
    file_url: str # In a real app, this comes from S3/Cloudinary
    notes: str
    date: str

class PatientDetail(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    age: int
    gender: str
    blood_group: str
    medical_history: List[dict] 
    records: List[dict]

@router.get("/patients/{patient_id}")
def get_patient_case_file(
    patient_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_doctor)
):
    """
    Fetches the complete medical history of a specific patient.
    """
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    # Fetch Patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    
    pat_user = db.query(User).filter(User.id == patient.user_id).first()

    # Fetch Past Appointments (History)
    history = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.doctor_id == doctor.id
    ).order_by(Appointment.start_time.desc()).all()

    formatted_history = [{
        "date": h.start_time.strftime("%Y-%m-%d"),
        "reason": h.reason,
        "diagnosis": h.ai_notes or "N/A",
        "status": h.status
    } for h in history]

    # Mock Records (In real DB, query a MedicalRecords table)
    records = [] 

    return {
        "id": str(patient.id),
        "name": pat_user.full_name,
        "email": pat_user.email,
        "phone": pat_user.phone_number or "N/A",
        "age": 25, # Mock: Calculate from DOB in real app
        "gender": patient.gender or "N/A",
        "blood_group": patient.blood_group or "N/A",
        "medical_history": formatted_history,
        "records": records
    }

@router.post("/patients/{patient_id}/records")
def upload_medical_record(
    patient_id: str,
    record: MedicalRecordSchema,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_doctor)
):
    """
    Saves a reference to a file (Prescription/X-Ray).
    """
    # Logic to save to 'MedicalRecords' table would go here.
    return {"status": "success", "message": f"{record.record_type} saved to patient file."}

# ==========================================================
# ⚙️ 5. SCHEDULE SETTINGS (LIVE CONFIG)
# ==========================================================

class ScheduleSettings(BaseModel):
    work_start_time: str = Field(..., description="HH:MM format, e.g. 09:00")
    work_end_time: str = Field(..., description="HH:MM format, e.g. 17:00")
    slot_duration: int = Field(30, description="Minutes per slot")
    break_duration: int = Field(5, description="Minutes between slots")

@router.get("/schedule/settings")
def get_schedule_settings(db: Session = Depends(get_db), user: User = Depends(get_current_doctor)):
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")
        
    return {
        "work_start_time": safe_time_str(doctor.work_start_time) or "09:00",
        "work_end_time": safe_time_str(doctor.work_end_time) or "17:00",
        "slot_duration": doctor.slot_duration or 30,
        "break_duration": doctor.break_duration or 5
    }

@router.put("/schedule/settings")
def update_schedule_settings(
    settings: ScheduleSettings,
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_doctor)
):
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor:
        raise HTTPException(404, "Doctor profile not found")
        
    # Handle DB-Specific Time Format (Time Object vs String)
    try:
        # Try converting to Python time object
        start_t = datetime.strptime(settings.work_start_time, "%H:%M").time()
        end_t = datetime.strptime(settings.work_end_time, "%H:%M").time()
        
        # Check if model column expects Time object
        if hasattr(Doctor.work_start_time.type, 'python_type') and Doctor.work_start_time.type.python_type == time:
             doctor.work_start_time = start_t
             doctor.work_end_time = end_t
        else:
             # Fallback to string
             doctor.work_start_time = settings.work_start_time
             doctor.work_end_time = settings.work_end_time
    except Exception:
        # Generic Fallback
        doctor.work_start_time = settings.work_start_time
        doctor.work_end_time = settings.work_end_time

    doctor.slot_duration = settings.slot_duration
    doctor.break_duration = settings.break_duration
    
    db.commit()
    return {"status": "success", "message": "Availability updated successfully."}