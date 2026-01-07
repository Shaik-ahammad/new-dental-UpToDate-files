import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AL-SHIFA DENTAL SYSTEM"
    API_V1_STR: str = "/api/v1"
    
    # SECURITY
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours
    
    # DATABASE
    DATABASE_URL: str = "postgresql://postgres:JASLAB@localhost/alshifa_db"
    
    # INTEGRATIONS
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    MAPBOX_ACCESS_TOKEN: str = os.getenv("MAPBOX_ACCESS_TOKEN", "")
    WHATSAPP_TOKEN: str = os.getenv("WHATSAPP_TOKEN", "")

    # 🟢 NEW: Email / SMTP Settings (Required to fix AttributeError)
    # These default to empty strings/defaults so the app won't crash if .env is missing them
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "noreply@alshifa.com")
    
    class Config:
        case_sensitive = True

settings = Settings()