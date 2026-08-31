from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String(50), nullable=False)
    emergency_phone = Column(String(50), nullable=True)
    
    stroke_capability = Column(String(100), default="Comprehensive Stroke Center")
    neurology_available = Column(Boolean, default=True)
    stroke_care_available = Column(Boolean, default=True)
    emergency_department = Column(Boolean, default=True)
    icu_available = Column(Boolean, default=True)
    ct_scan_available = Column(Boolean, default=True)
    mri_available = Column(Boolean, default=True)
    operating_hours = Column(String(100), default="24/7 Emergency Care")
    emergency_available = Column(Boolean, default=True)
    verification_status = Column(String(50), default="DEMO") # "DEMO", "VERIFIED", "UNVERIFIED"
    
    specialties = Column(JSON, default=list) # e.g. ["24/7 Neuro-ICU", "Endovascular Thrombectomy", "tPA Ready"]
    estimated_distance_km = Column(Float, default=5.0)
    estimated_travel_time_min = Column(Integer, default=15)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    referrals = relationship("Referral", back_populates="hospital")
