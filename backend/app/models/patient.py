from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. P-1001
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    name = Column(String(150), nullable=False)
    dob = Column(String(50), nullable=False) # YYYY-MM-DD
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(150), nullable=True)
    address = Column(String(255), nullable=True)
    emergency_contact_name = Column(String(150), nullable=False)
    emergency_contact_phone = Column(String(50), nullable=False)
    
    # Structured medical history & risk factors
    medical_history = Column(JSON, default=dict) 
    # Example JSON: {
    #   "previous_stroke": false, "hypertension": true, "diabetes": true,
    #   "heart_disease": false, "high_cholesterol": true, "smoking": "current",
    #   "alcohol_use": "occasional", "family_history_stroke": true,
    #   "previous_neuro_conditions": "Migraine with aura",
    #   "current_medications": "Amlodipine 5mg, Metformin 500mg",
    #   "known_allergies": "Penicillin", "bmi": 28.4
    # }
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="patients")
    assessments = relationship("Assessment", back_populates="patient", cascade="all, delete-orphan", order_by="desc(Assessment.assessment_time)")
    referrals = relationship("Referral", back_populates="patient", cascade="all, delete-orphan", order_by="desc(Referral.created_at)")
