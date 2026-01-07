import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# --- USER MANAGEMENT ---

class User(Base):
    """
    Central Authentication Table.
    Matches Version A structure but optimized for Version B's security flow.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin', 'doctor', 'patient', 'staff', 'organization'
    is_active = Column(Boolean, default=True)
    
    # 🟢 KYC / Verification (Version B Feature)
    # Default is False: Admin must approve Doctor/Org accounts
    is_verified = Column(Boolean, default=False) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    patient_profile = relationship("Patient", back_populates="user", uselist=False)


# --- ORGANIZATION / TENANT ---

class Hospital(Base):
    """
    Organization Entity.
    Merged Version A 'Hospital' with Version B 'Organization' features (Mapbox).
    """
    __tablename__ = "hospitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    
    # 📍 Location & Mapbox Integration (From Ver B)
    mapbox_id = Column(String, nullable=True)
    location = Column(String, nullable=False) # Human readable address
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    
    contact_number = Column(String)
    contact_email = Column(String) # From Ver B
    
    # KYC
    license_number = Column(String, unique=True, nullable=True)
    # Organization verification status
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    doctors = relationship("Doctor", back_populates="hospital")
    inventory = relationship("Inventory", back_populates="hospital")
    appointments = relationship("Appointment", back_populates="hospital")


# --- PROFILES ---

class Doctor(Base):
    """
    Doctor Profile & Scheduling Logic.
    Combines Professional Info (A) with AI Scheduling Config (B).
    """
    __tablename__ = "doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"))
    
    # Professional Info
    specialization = Column(String, nullable=False)
    license_number = Column(String, nullable=True)
    # Redundant KYC field removed (we use User.is_verified) or kept for specific medical license verification
    is_verified = Column(Boolean, default=False) 
    
    # 🗓️ SMART SCHEDULING CONFIG (Merged A & B)
    slot_mode = Column(String, default="continuous") # continuous, interleaved, custom
    slot_duration = Column(Integer, default=30)  # Minutes per patient
    break_duration = Column(Integer, default=5)  # Minutes between slots
    work_start_time = Column(String, default="09:00") # "HH:MM"
    work_end_time = Column(String, default="17:00")   # "HH:MM"
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    hospital = relationship("Hospital", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


class Patient(Base):
    """
    Patient Profile
    """
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    
    # Demographics
    age = Column(Integer)
    gender = Column(String)
    medical_history_summary = Column(Text, nullable=True) # AI Context
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient")


# --- OPERATIONS ---

class Appointment(Base):
    """
    Booking Entity.
    Uses DateTime ranges (A) and Google Sync IDs (B).
    """
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Linkages
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"))
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"))
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=True) # Nullable for independent docs
    
    # Time Management
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    
    status = Column(String, default="scheduled") # scheduled, completed, cancelled, no_show
    reason = Column(String, nullable=True)
    ai_notes = Column(Text, nullable=True) 
    
    # 🗓️ External Sync (From Ver B)
    google_event_id = Column(String, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    hospital = relationship("Hospital", back_populates="appointments")


class Inventory(Base):
    """
    Resource Management.
    Preserved strictly from Version A (No equivalent in B).
    """
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"))
    
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    unit = Column(String, default="pcs") 
    status = Column(String, default="Good") # Good, Low, Critical
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="inventory")