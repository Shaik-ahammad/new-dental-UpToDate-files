from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timedelta

# --- PROJECT IMPORTS ---
from database import get_db
from models import User, Hospital, Doctor, Inventory, Appointment, Patient
from core.security import verify_password
from jose import jwt
from core.config import settings
from fastapi.security import OAuth2PasswordBearer

# Ensure email service is imported if available, or handle gracefully
try:
    from infra.email import email_service
except ImportError:
    email_service = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_org_context(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Unified Dependency with 🟢 AUTO-HEALING:
    - If an Organization User logs in but has no Hospital Profile, 
      automatically create one to prevent 404 errors.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if role not in ["organization", "doctor"]:
            raise HTTPException(status_code=403, detail="Organization or Clinical Admin access required")
            
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Resolve Hospital ID based on Role
    hospital = None
    
    if user.role == "organization":
        # 1. Try to find existing link
        hospital = db.query(Hospital).filter(Hospital.contact_email == user.email).first()
        
        # 🟢 2. AUTO-HEAL: If missing, create it immediately
        if not hospital:
            hospital = Hospital(
                name=f"{user.full_name}'s Facility", # Default Name
                contact_email=user.email,
                contact_number="",
                location="Please Update Location",
                is_verified=False
            )
            db.add(hospital)
            db.commit()
            db.refresh(hospital)
            print(f"✅ Auto-created Hospital profile for {user.email}")

    elif user.role == "doctor":
        # Linkage: Doctor User -> Doctor Profile -> Hospital
        doc = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doc:
            hospital = db.query(Hospital).filter(Hospital.id == doc.hospital_id).first()
            
    if not hospital:
        # If still missing (e.g. Doctor with no hospital link), raise error
        raise HTTPException(status_code=404, detail="Profile configuration error. Please contact Admin.")
        
    return {"user": user, "hospital": hospital}

router = APIRouter(prefix="/organization", tags=["Organization Portal"])

# ==========================================================
# 1. GET & UPDATE PROFILE
# ==========================================================
@router.get("/profile")
def get_org_profile(db: Session = Depends(get_db), context: dict = Depends(get_current_org_context)):
    hospital = context["hospital"]
    return {
        "id": str(hospital.id),
        "name": hospital.name,
        "location": hospital.location,
        "lat": hospital.lat,
        "lng": hospital.lng,
        "mapbox_id": hospital.mapbox_id,
        "is_verified": hospital.is_verified,
        "doctor_count": len(hospital.doctors),
        "license_number": hospital.license_number,
        "contact_email": hospital.contact_email,
        "contact_number": hospital.contact_number
    }

@router.put("/profile")
def update_org_profile(
    payload: dict, # {name, contact_email, contact_number}
    db: Session = Depends(get_db), 
    context: dict = Depends(get_current_org_context)
):
    """
    Updates basic facility details (Name, Contact Info).
    """
    hospital = context["hospital"]
    
    if "name" in payload: hospital.name = payload["name"]
    if "contact_email" in payload: hospital.contact_email = payload["contact_email"]
    if "contact_number" in payload: hospital.contact_number = payload["contact_number"]
    
    db.commit()
    return {"status": "success", "message": "Facility details updated successfully."}

@router.put("/location")
def update_location(
    payload: dict, # {lat: float, lng: float, address: str}
    db: Session = Depends(get_db), 
    context: dict = Depends(get_current_org_context)
):
    """
    Update Mapbox coordinates and address for the facility.
    """
    hospital = context["hospital"]
    if "lat" in payload: hospital.lat = payload["lat"]
    if "lng" in payload: hospital.lng = payload["lng"]
    if "address" in payload: hospital.location = payload["address"]
    db.commit()
    return {"status": "success", "message": "Location pin updated successfully."}

# ==========================================================
# 2. DOCTOR MANAGEMENT
# ==========================================================
@router.get("/doctors")
def get_our_doctors(db: Session = Depends(get_db), context: dict = Depends(get_current_org_context)):
    hospital = context["hospital"]
    doctors = db.query(Doctor).filter(Doctor.hospital_id == hospital.id).all()
    
    results = []
    for doc in doctors:
        doc_user = db.query(User).filter(User.id == doc.user_id).first()
        if doc_user:
            status = "Active" if doc.is_verified else "Pending Approval"
            results.append({
                "id": str(doc.user_id),
                "doc_id": str(doc.id),
                "name": doc_user.full_name,
                "email": doc_user.email,
                "specialization": doc.specialization,
                "license": doc.license_number,
                "status": status,
                "joined_at": doc_user.created_at
            })
    return results

@router.post("/doctors/{user_id}/verify")
def verify_doctor(
    user_id: str, 
    action: str, # 'approve' or 'reject'
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    context: dict = Depends(get_current_org_context)
):
    hospital = context["hospital"]
    doctor = db.query(Doctor).filter(Doctor.user_id == user_id, Doctor.hospital_id == hospital.id).first()
    target_user = db.query(User).filter(User.id == user_id).first()
    
    if not doctor or not target_user:
        raise HTTPException(404, "Doctor not found in your facility.")
        
    msg = ""
    if action == "approve":
        doctor.is_verified = True 
        target_user.is_verified = True 
        target_user.is_active = True
        if email_service:
             background_tasks.add_task(email_service.send_approval_notification, target_user.email, target_user.full_name, "Doctor")
        msg = "Doctor approved successfully."
    elif action == "reject":
        target_user.is_active = False
        target_user.is_verified = False
        doctor.is_verified = False
        msg = "Doctor registration rejected."
    else:
        raise HTTPException(400, "Invalid action")
        
    db.commit()
    return {"status": "success", "message": msg}

# ==========================================================
# 3. APPOINTMENTS MANAGEMENT
# ==========================================================
@router.get("/appointments")
def get_org_appointments(db: Session = Depends(get_db), context: dict = Depends(get_current_org_context)):
    """
    Fetch all appointments for this facility with Patient & Doctor details.
    """
    hospital = context["hospital"]
    
    # Fetch appointments sorted by newest first
    appointments = db.query(Appointment).filter(
        Appointment.hospital_id == hospital.id
    ).order_by(Appointment.start_time.desc()).all()
    
    results = []
    for appt in appointments:
        # Fetch related names (Note: In high volume systems, this should be batch fetched)
        doctor = db.query(User).join(Doctor).filter(Doctor.id == appt.doctor_id).first()
        patient = db.query(User).join(Patient).filter(Patient.id == appt.patient_id).first()
        
        results.append({
            "id": str(appt.id),
            "doctor_name": doctor.full_name if doctor else "Unknown",
            "patient_name": patient.full_name if patient else "Unknown",
            "date": appt.start_time.strftime("%Y-%m-%d"),
            "time": appt.start_time.strftime("%H:%M"),
            "status": appt.status,
            "reason": appt.reason,
            "cost": 150 # Placeholder/Mock cost
        })
        
    return results

# ==========================================================
# 4. INVENTORY MANAGEMENT
# ==========================================================
@router.get("/inventory")
def get_inventory(db: Session = Depends(get_db), context: dict = Depends(get_current_org_context)):
    hospital = context["hospital"]
    return db.query(Inventory).filter(Inventory.hospital_id == hospital.id).all()

@router.post("/inventory")
def add_or_update_stock(
    payload: dict, # {item_name: str, quantity: int, unit: str}
    db: Session = Depends(get_db), 
    context: dict = Depends(get_current_org_context)
):
    hospital = context["hospital"]
    
    # Check if item exists (Upsert Logic)
    item = db.query(Inventory).filter(
        Inventory.hospital_id == hospital.id, 
        Inventory.item_name == payload["item_name"]
    ).first()
    
    if item:
        # Restock Logic
        item.quantity += int(payload["quantity"])
        item.last_updated = func.now()
        msg = f"Restocked {item.item_name}. New Qty: {item.quantity}"
    else:
        # New Item Logic
        new_item = Inventory(
            hospital_id=hospital.id,
            item_name=payload["item_name"],
            quantity=int(payload["quantity"]),
            unit=payload.get("unit", "pcs"),
            status="Good"
        )
        db.add(new_item)
        msg = f"Added {payload['item_name']} to inventory."
    
    db.commit()
    return {"status": "success", "message": msg}

# ==========================================================
# 5. FINANCE & DASHBOARD STATS
# ==========================================================
@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), context: dict = Depends(get_current_org_context)):
    hospital = context["hospital"]
    
    # 1. Doctors
    active_docs = db.query(Doctor).filter(Doctor.hospital_id == hospital.id, Doctor.is_verified == True).count()
    
    # 2. Appointments (Today)
    today = datetime.now().date()
    appts_today = db.query(Appointment).filter(
        Appointment.hospital_id == hospital.id,
        func.date(Appointment.start_time) == today
    ).count()
    
    # 3. Revenue (Mock Calculation: 150 AED per appointment)
    total_appts = db.query(Appointment).filter(Appointment.hospital_id == hospital.id, Appointment.status == "confirmed").count()
    revenue = total_appts * 150 
    
    # 4. Inventory Alerts
    low_stock = db.query(Inventory).filter(Inventory.hospital_id == hospital.id, Inventory.quantity < 20).count()

    return {
        "doctors": active_docs,
        "appointments_today": appts_today,
        "revenue": revenue,
        "low_stock_alerts": low_stock
    }

# ==========================================================
# 6. PATIENT CASE TRACKING (Facility View) - REAL DATA
# ==========================================================
@router.get("/patients")
def get_facility_patients(db: Session = Depends(get_db), context: dict = Depends(get_current_org_context)):
    """
    Returns list of patients treated at this facility with REAL status and last visit dates.
    """
    hospital = context["hospital"]
    
    # 1. Aggregation Query: Get unique Patient IDs and their MAX (latest) visit date
    patient_stats = db.query(
        Appointment.patient_id, 
        func.max(Appointment.start_time).label("last_visit")
    ).filter(
        Appointment.hospital_id == hospital.id
    ).group_by(
        Appointment.patient_id
    ).all()
    
    if not patient_stats:
        return []

    # Convert to a dictionary for easy lookup: { patient_uuid: datetime }
    visit_map = {stats[0]: stats[1] for stats in patient_stats}
    patient_ids = list(visit_map.keys())

    # 2. Batch Fetch Patient Profiles
    patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
    
    # 3. Batch Fetch User Details (Names/Emails)
    user_ids = [p.user_id for p in patients]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {u.id: u for u in users} # O(1) lookup map
    
    # 4. Assemble Real Data
    results = []
    cutoff_date = datetime.now() - timedelta(days=180) # 6 Months ago

    for pat in patients:
        user = user_map.get(pat.user_id)
        if user:
            # Get real last visit from our map
            last_visit_dt = visit_map.get(pat.id)
            
            # Determine Status Logic
            status = "Inactive"
            if last_visit_dt and last_visit_dt > cutoff_date:
                status = "Active"
            
            results.append({
                "id": str(pat.id),
                "name": user.full_name,
                "email": user.email,
                "last_visit": last_visit_dt.strftime("%Y-%m-%d") if last_visit_dt else "N/A", # 🟢 Real Date
                "status": status # 🟢 Real Status
            })
            
    return results