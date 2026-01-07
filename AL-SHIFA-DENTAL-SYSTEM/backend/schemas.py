from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from uuid import UUID
from datetime import date, datetime

# ==========================================================
# 1. SHARED & TOKEN SCHEMAS
# ==========================================================

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient" # 'admin', 'doctor', 'patient', 'staff'

# ==========================================================
# 2. DOCTOR CONFIGURATION (MERGED A + B)
# ==========================================================

class DoctorScheduleConfig(BaseModel):
    """
    Controls AI scheduling logic.
    Merged: Adds 'slot_mode' from Ver B to existing fields.
    """
    slot_mode: str = Field(default="continuous", description="continuous | interleaved | custom")
    slot_duration: int = Field(default=30, description="Minutes per patient")
    break_duration: int = Field(default=5, description="Minutes between slots")
    work_start: str = Field(default="09:00", description="HH:MM format")
    work_end: str = Field(default="17:00", description="HH:MM format")

# ==========================================================
# 3. HOSPITAL / ORGANIZATION (NEW - For Mapbox)
# ==========================================================

class HospitalBase(BaseModel):
    name: str
    location: str
    contact_email: Optional[str] = None
    contact_number: Optional[str] = None
    
    # 📍 Mapbox Fields (From Ver B)
    mapbox_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class HospitalCreate(HospitalBase):
    license_number: Optional[str] = None

class HospitalOut(HospitalBase):
    id: UUID
    is_verified: bool

    class Config:
        from_attributes = True

# ==========================================================
# 4. AUTHENTICATION & REGISTRATION
# ==========================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(UserBase):
    password: str
    
    # --- Doctor Specific Fields ---
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    hospital_name: Optional[str] = None # Optional: For auto-creating/linking hospital
    
    # --- Patient Specific Fields ---
    age: Optional[int] = None
    gender: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# ==========================================================
# 5. APPOINTMENTS (PRESERVED FROM VERSION A)
# ==========================================================

class AppointmentCreate(BaseModel):
    doctor_id: Optional[UUID] = None
    date: date
    time: str # "HH:MM"
    reason: str = "General Checkup"

class AppointmentOut(BaseModel):
    id: UUID
    start_time: datetime
    end_time: datetime
    status: str
    reason: Optional[str] = None
    
    # 🗓️ External Sync (From Ver B)
    google_event_id: Optional[str] = None
    
    class Config:
        from_attributes = True

# ==========================================================
# 6. USER OUTPUTS (PROFILE RESPONSES)
# ==========================================================

class DoctorProfileOut(BaseModel):
    specialization: str
    license_number: Optional[str] = None
    hospital_id: Optional[UUID] = None
    schedule_config: Optional[DoctorScheduleConfig] = None

    class Config:
        from_attributes = True

class UserOut(UserBase):
    id: UUID
    is_active: bool
    is_verified: bool = False
    details: Optional[Any] = None # Holds DoctorProfileOut, Patient dict, or HospitalOut

    class Config:
        from_attributes = True