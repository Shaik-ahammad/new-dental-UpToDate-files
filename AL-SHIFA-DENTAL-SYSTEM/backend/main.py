from fastapi import FastAPI, Depends, HTTPException, status, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from jose import jwt, JWTError

# --- INTERNAL MODULES ---
import models
import database
import schemas
from agents.router import AgentRouter

# --- CORE IMPORTS ---
from core.config import settings
from core.security import verify_password, get_password_hash, create_access_token

# --- ROUTER IMPORTS ---
# 🆕 ACTION: Imported 'patient' alongside admin, organization, and doctor
from routers import admin, organization, doctor, patient

# --- INITIALIZATION ---
models.Base.metadata.create_all(bind=database.engine)
ai_router_service = AgentRouter()

app = FastAPI(title=settings.PROJECT_NAME, version="2.4.0")

# --- CORS SETUP ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DEPENDENCIES ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Use settings from config.py
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# ==============================================================================
# 1. AUTH ROUTER (Preserved)
# ==============================================================================
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check Email
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Create User
    try:
        hashed_pw = get_password_hash(user.password)
        
        new_user = models.User(
            email=user.email,
            password_hash=hashed_pw,
            full_name=user.full_name,
            role=user.role,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 3. Create Profile based on Role
        if user.role == "doctor":
            # Auto-assign to default hospital (Bootstrap logic)
            hospital = db.query(models.Hospital).first()
            if not hospital:
                hospital = models.Hospital(
                    name="Al-Shifa Main Center", 
                    location="City Center",
                    contact_email="admin@alshifa.com"
                )
                db.add(hospital)
                db.commit()
            
            new_profile = models.Doctor(
                user_id=new_user.id,
                hospital_id=hospital.id,
                specialization=user.specialization or "General Dentist",
                license_number=user.license_number,
                slot_duration=30,
                work_start_time="09:00",
                work_end_time="17:00"
            )
            db.add(new_profile)

        elif user.role == "patient":
            new_profile = models.Patient(
                user_id=new_user.id,
                age=user.age,
                gender=user.gender
            )
            db.add(new_profile)

        db.commit()
        return new_user
        
    except Exception as e:
        db.rollback()
        print(f"CRITICAL REGISTRATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration Error: {str(e)}")

@auth_router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=403, detail="Invalid Credentials")

    token = create_access_token(subject=str(user.id), role=user.role)
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@auth_router.get("/me")
def read_current_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if current_user.role == "doctor":
        profile = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
        if profile: 
            profile_data = {
                "specialization": profile.specialization, 
                "hospital_id": str(profile.hospital_id),
                "schedule_config": {
                    "slot_mode": profile.slot_mode,
                    "slot_duration": profile.slot_duration,
                    "break_duration": profile.break_duration,
                    "work_start": profile.work_start_time,
                    "work_end": profile.work_end_time
                }
            }
    elif current_user.role == "patient":
        profile = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
        if profile: 
            profile_data = {"age": profile.age, "gender": profile.gender}
        
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "details": profile_data
    }

# ==============================================================================
# 2. AI AGENT ROUTER (Preserved)
# ==============================================================================
agent_api_router = APIRouter(prefix="/agent", tags=["AI Agents"])

@agent_api_router.post("/execute")
async def execute_agent_logic(request: Request):
    payload = await request.json()
    if "user_query" not in payload: raise HTTPException(400, "user_query is required")
    try:
        return await ai_router_service.route(payload)
    except Exception as e:
        print(f"Agent Error: {e}")
        return {"response_text": "I'm having trouble connecting to the neural network.", "action_taken": "error"}

@agent_api_router.get("/memory/inventory")
def read_inventory_memory(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "doctor": raise HTTPException(403, "Access Denied")
    # Assuming inventory agent is initialized in router
    try:
        inventory_data = ai_router_service.agents["inventory"].memory.graph 
        return [{"id": k, "name": v["name"], "stock": v["stock"]} for k, v in inventory_data.items()]
    except:
        return []

# --- APP ASSEMBLY ---
app.include_router(auth_router)
app.include_router(agent_api_router)

# 🆕 ACTION: Register ALL Modular Routers (Admin, Org, Doctor, Patient)
app.include_router(admin.router)
app.include_router(organization.router)
app.include_router(doctor.router)
app.include_router(patient.router) # 🆕 Registered Patient Router

@app.get("/")
def health_check():
    return {
        "status": "operational", 
        "system": "Al-Shifa Neural Core", 
        "version": "2.4",
        "time": datetime.now()
    }