import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "StrokeShield AI"
    APP_VERSION: str = "1.0.0"
    APP_MODE: str = os.getenv("APP_MODE", "DEMO") # "DEMO" or "PRODUCTION"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "strokeshield-super-secret-jwt-key-2026-hackathon")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./strokeshield.db")
    DEMO_MODE: bool = True
    
    # AI-Generated Demo Doctor 1: Dr. Raha
    DOCTOR_RAHA_EMAIL: str = "raha@demo-strokeshield.com"
    DOCTOR_RAHA_PASSWORD: str = "Doctor@123"
    DOCTOR_RAHA_NAME: str = "Dr. Raha"
    DOCTOR_RAHA_SPECIALIZATION: str = "Neurologist"
    DOCTOR_RAHA_HOSPITAL: str = "Demo Stroke Care Hospital"
    DOCTOR_RAHA_PHONE: str = "+91 98765 43210"
    DOCTOR_RAHA_LOCATION: str = "Chennai, Tamil Nadu"
    DOCTOR_RAHA_EXP: int = 8
    
    # AI-Generated Demo Doctor 2: Dr. Vijay
    DOCTOR_VIJAY_EMAIL: str = "vijay@demo-strokeshield.com"
    DOCTOR_VIJAY_PASSWORD: str = "Doctor@123"
    DOCTOR_VIJAY_NAME: str = "Dr. Vijay"
    DOCTOR_VIJAY_SPECIALIZATION: str = "Emergency Medicine Specialist"
    DOCTOR_VIJAY_HOSPITAL: str = "Demo Neuro Emergency Hospital"
    DOCTOR_VIJAY_PHONE: str = "+91 87654 32109"
    DOCTOR_VIJAY_LOCATION: str = "Chennai, Tamil Nadu"
    DOCTOR_VIJAY_EXP: int = 6

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
