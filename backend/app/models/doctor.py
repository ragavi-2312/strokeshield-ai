from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True) # e.g. "+91 98765 43210"
    hospital = Column(String(150), nullable=True)
    hospital_address = Column(String(255), default="Demo Stroke Care Hospital, Chennai, Tamil Nadu")
    latitude = Column(Float, default=13.0827)
    longitude = Column(Float, default=80.2707)
    specialization = Column(String(100), default="Neurologist")
    role = Column(String(50), default="DOCTOR")
    experience_years = Column(Integer, default=8)
    location = Column(String(100), default="Chennai, Tamil Nadu")
    registration_number = Column(String(100), default="DEMO-REG")
    
    # Transparency & Data Provenance flags (Section 4)
    data_type = Column(String(50), default="DEMO")
    data_source = Column(String(50), default="AI_GENERATED")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    patients = relationship("Patient", back_populates="doctor")
    assessments = relationship("Assessment", back_populates="doctor")
    referrals = relationship("Referral", back_populates="doctor")
