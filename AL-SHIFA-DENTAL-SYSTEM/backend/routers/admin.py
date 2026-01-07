from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID

# --- PROJECT IMPORTS ---
from database import get_db
from models import User, Doctor, Hospital, Appointment, Patient 
from core.config import settings
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

# IMPORT EMAIL SERVICE
from infra.email import email_service

# Independent OAuth scheme to avoid circular imports
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_admin_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency: Decodes token and strictly checks for 'admin' role.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        if role != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
            
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

router = APIRouter(prefix="/admin", tags=["Super Admin"])

# ==========================================================
# 1. KYC QUEUE: PENDING DOCTORS (Version A)
# ==========================================================
@router.get("/doctors/pending")
def get_pending_doctors(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """
    Fetch all doctors where the underlying User account is not verified.
    """
    doctors = db.query(Doctor).join(User).filter(User.is_verified == False).all()
    
    response = []
    for doc in doctors:
        response.append({
            "id": str(doc.user.id),
            "name": doc.user.full_name,
            "email": doc.user.email,
            "license_number": doc.license_number or "N/A",
            "specialization": doc.specialization,
            "joined_at": doc.user.created_at
        })
    return response

# ==========================================================
# 2. KYC QUEUE: PENDING HOSPITALS (Version A)
# ==========================================================
@router.get("/hospitals/pending")
def get_pending_hospitals(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """
    Fetch all organizations/hospitals not yet verified.
    """
    hospitals = db.query(Hospital).filter(Hospital.is_verified == False).all()
    return hospitals

# ==========================================================
# 3. ACTION: VERIFY / REJECT (Version A - Advanced)
# ==========================================================
@router.post("/verify/{entity_type}/{id}")
def verify_entity(
    entity_type: str, 
    id: str, 
    action: str, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    admin: User = Depends(get_admin_user)
):
    """
    Perform KYC Action & Notify User via Email (Async).
    """
    target_email = None
    target_name = "User"

    # Fetch Record
    if entity_type == "doctor":
        record = db.query(User).filter(User.id == id).first()
        doc_profile = db.query(Doctor).filter(Doctor.user_id == id).first()
        if record:
            target_email = record.email
            target_name = record.full_name
            
    elif entity_type == "hospital":
        record = db.query(Hospital).filter(Hospital.id == id).first()
        doc_profile = None
        if record:
            target_email = record.contact_email
            target_name = record.name
            
    else:
        raise HTTPException(400, "Invalid entity type")

    if not record:
        raise HTTPException(404, "Record not found")

    # Perform Logic
    msg = ""
    if action == "approve":
        record.is_verified = True
        if doc_profile: doc_profile.is_verified = True
        
        # Trigger Email
        if target_email:
            background_tasks.add_task(
                email_service.send_approval_notification, 
                to_email=target_email, 
                name=target_name, 
                role=entity_type
            )
        msg = f"{entity_type.capitalize()} approved & notification queued."
        
    elif action == "reject":
        if entity_type == "doctor": 
            record.is_active = False 
        elif entity_type == "hospital":
            record.is_verified = False
        msg = f"{entity_type.capitalize()} rejected."
        
    else:
        raise HTTPException(400, "Invalid action")

    db.commit()
    return {"status": "success", "message": msg}

# ==========================================================
# 4. ADMIN DASHBOARD STATS (Version A)
# ==========================================================
@router.get("/dashboard/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """
    Aggregates high-level system metrics for the Admin Dashboard.
    """
    # 1. Counts
    total_doctors = db.query(Doctor).count()
    total_patients = db.query(Patient).count()
    total_hospitals = db.query(Hospital).count()
    
    # 2. Pending KYC (The "Action Items")
    pending_docs = db.query(User).filter(User.role == "doctor", User.is_verified == False).count()
    pending_hosps = db.query(Hospital).filter(Hospital.is_verified == False).count()
    
    # 3. Financials
    confirmed_appts = db.query(Appointment).filter(Appointment.status == "confirmed").count()
    total_revenue = confirmed_appts * 1500

    return {
        "total_users": {
            "doctors": total_doctors,
            "patients": total_patients,
            "hospitals": total_hospitals
        },
        "action_items": {
            "pending_doctors": pending_docs,
            "pending_hospitals": pending_hosps
        },
        "financials": {
            "revenue": total_revenue,
            "appointments": confirmed_appts
        }
    }

# ==========================================================
# 5. GENERAL USER MANAGEMENT (🟢 Version B Features)
# ==========================================================

@router.get("/pending-users")
def get_pending_users(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """
    Fetches all users (regardless of role) who are NOT verified.
    Useful for a raw data view in the Admin Panel.
    """
    return db.query(User).filter(User.is_verified == False).all()

@router.put("/approve/{user_id}")
def approve_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """
    Simple verification toggle for any user ID. 
    (Lightweight alternative to the full /verify workflow)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
        
    user.is_verified = True
    db.commit()
    return {"status": "User Approved", "email": user.email}