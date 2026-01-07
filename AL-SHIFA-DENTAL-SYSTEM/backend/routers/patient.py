from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta, date
from typing import List, Optional
from pydantic import BaseModel

# --- PROJECT IMPORTS ---
from database import get_db
from models import User, Doctor, Appointment, Patient
from core.config import settings
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/patient", tags=["Patient Portal"])

# --- DEPENDENCY ---
def get_current_patient(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "patient":
            raise HTTPException(403, "Patient access required")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Invalid credentials")
    return db.query(User).filter(User.id == user_id).first()

# --- SCHEMAS ---
class BookingRequest(BaseModel):
    doctor_id: str
    slot_time: str # ISO Format
    reason: str

# ==========================================================
# 1. LIST DOCTORS
# ==========================================================
@router.get("/doctors")
def get_available_doctors(db: Session = Depends(get_db)):
    """
    Returns list of verified doctors for the booking grid.
    """
    # Join Doctor with User to get names
    doctors = db.query(Doctor).join(User).filter(User.is_verified == True).all()
    
    response = []
    for doc in doctors:
        response.append({
            "id": str(doc.id),
            "name": doc.user.full_name,
            "specialization": doc.specialization,
            "hospital": "Al-Shifa Main Center", # Placeholder until Hospital relation joined
            "image": f"https://api.dicebear.com/7.x/avataaars/svg?seed={doc.user.full_name}" # Auto-avatar
        })
    return response

# ==========================================================
# 2. GET SLOTS (The "Smart" Logic)
# ==========================================================
@router.get("/slots")
def get_doctor_slots(doctor_id: str, date_str: str, db: Session = Depends(get_db)):
    """
    Generates available 30-min slots for a specific doctor & date.
    Excludes existing appointments.
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
        
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    
    # 1. Generate All Potential Slots (9 AM - 5 PM default)
    # In a real app, use doctor.work_start_time
    start_time = datetime.strptime(f"{date_str} 09:00", "%Y-%m-%d %H:%M")
    end_time = datetime.strptime(f"{date_str} 17:00", "%Y-%m-%d %H:%M")
    
    slots = []
    current = start_time
    while current < end_time:
        slots.append(current)
        current += timedelta(minutes=30)
        
    # 2. Fetch Booked Slots
    booked = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        func.date(Appointment.start_time) == target_date,
        Appointment.status != "cancelled"
    ).all()
    
    booked_times = [b.start_time for b in booked]
    
    # 3. Filter
    available_slots = []
    for slot in slots:
        if slot not in booked_times:
            # Return time only (HH:MM)
            available_slots.append(slot.strftime("%H:%M"))
            
    return available_slots

# ==========================================================
# 3. BOOK APPOINTMENT
# ==========================================================
@router.post("/book")
def book_appointment(
    req: BookingRequest, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_patient)
):
    # 1. Get Patient Profile
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(400, "Patient profile missing")
        
    # 2. Parse Time
    try:
        # Client sends ISO string (e.g., "2023-10-27T10:00:00")
        start_dt = datetime.fromisoformat(req.slot_time.replace('Z', ''))
        end_dt = start_dt + timedelta(minutes=30)
    except:
        raise HTTPException(400, "Invalid time format")

    # 3. Create Appointment
    new_appt = Appointment(
        doctor_id=req.doctor_id,
        patient_id=patient.id,
        start_time=start_dt,
        end_time=end_dt,
        status="confirmed", # Auto-confirm for MVP
        reason=req.reason
    )
    
    db.add(new_appt)
    db.commit()
    
    return {"status": "success", "appointment_id": str(new_appt.id)}

# ==========================================================
# 4. GET MY APPOINTMENTS (🆕 Real-Time DB Fetch)
# ==========================================================
@router.get("/appointments")
def get_my_appointments(db: Session = Depends(get_db), user: User = Depends(get_current_patient)):
    """
    Fetch real appointments from the database for the dashboard.
    Shows confirmed bookings ordered by date.
    """
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        return []

    # Get appointments ordered by time
    appts = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.status != "cancelled"
    ).order_by(Appointment.start_time.asc()).all()

    response = []
    for a in appts:
        # Fetch doctor name via relationship
        doctor = db.query(Doctor).filter(Doctor.id == a.doctor_id).first()
        if doctor:
            doc_user = db.query(User).filter(User.id == doctor.user_id).first()
            doc_name = doc_user.full_name if doc_user else "Unknown Doctor"
        else:
            doc_name = "Unknown Doctor"
        
        response.append({
            "id": str(a.id),
            "doctor": doc_name,
            "treatment": a.reason or "General Checkup",
            "date": a.start_time.strftime("%Y-%m-%d"),
            "time": a.start_time.strftime("%I:%M %p"),
            "status": a.status
        })
    
    return response