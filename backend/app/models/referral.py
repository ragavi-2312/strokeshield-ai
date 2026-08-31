from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    referral_code = Column(String(50), unique=True, index=True, nullable=True) # e.g. "REF-2026-00101"
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False) # Destination hospital
    
    # Source GPS & Clinic details
    source_hospital_name = Column(String(150), default="Clinic / Source Center")
    source_latitude = Column(Float, default=37.7749)
    source_longitude = Column(Float, default=-122.4194)
    source_accuracy_meters = Column(Float, nullable=True)
    source_timestamp = Column(DateTime, nullable=True)
    
    # Destination GPS
    destination_latitude = Column(Float, default=37.7749)
    destination_longitude = Column(Float, default=-122.4194)
    
    # Navigation metrics (Straight-line vs Road distance distinction)
    distance_km = Column(Float, default=5.0) # Straight-line distance
    road_distance_km = Column(Float, nullable=True) # Real road distance (null if offline)
    estimated_travel_minutes = Column(Integer, nullable=True) # Real driving ETA (null if offline)
    
    priority = Column(String(50), default="Emergency") # "Emergency", "Urgent", "Standard"
    status = Column(String(50), default="Sent") # "Created", "Sent", "Accepted", "Preparing", "In Transit", "Patient Arrived", "Closed"
    
    ambulance_requested = Column(String(50), default="Advanced Life Support (ALS)")
    estimated_eta_minutes = Column(Integer, default=15)
    dispatch_notes = Column(Text, nullable=True)
    patient_summary_snapshot = Column(JSON, default=dict) # Complete emergency summary snapshot at referral time
    
    # Doctor Confirmation Gate
    doctor_confirmed = Column(String(10), default="true")
    doctor_confirmed_at = Column(DateTime, default=datetime.utcnow)
    
    # Secure QR code payload
    qr_data = Column(JSON, default=dict)
    
    timeline_events = Column(JSON, default=list)
    
    # Stage Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    preparing_at = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="referrals")
    assessment = relationship("Assessment", back_populates="referrals")
    doctor = relationship("Doctor", back_populates="referrals")
    hospital = relationship("Hospital", back_populates="referrals")
