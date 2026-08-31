from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    assessment_time = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Symptom Onset & Last Known Well Timing
    symptom_onset = Column(String(100), nullable=True) # ISO string or 'Unknown' or 'Wake-up stroke'
    last_known_well_time = Column(String(100), nullable=True) # Last Known Well timestamp or formatted string
    symptom_duration_minutes = Column(Integer, nullable=True) # Calculated minutes elapsed
    
    # FAST Criteria + Camera Assisted Observations + Doctor Verifications
    face_result = Column(String(50), nullable=False) # 'normal', 'possible_abnormality', 'unable_to_assess'
    face_ai_observation = Column(String(100), nullable=True) # 'no_obvious_asymmetry', 'possible_facial_asymmetry'
    face_doctor_confirmation = Column(String(50), nullable=True) # 'normal', 'abnormal', 'unable_to_assess'

    arm_result = Column(String(50), nullable=False)  # 'normal', 'possible_weakness', 'possible_numbness', 'unable_to_assess'
    arm_ai_observation = Column(String(100), nullable=True) # 'no_obvious_drift', 'possible_arm_drift'
    arm_doctor_confirmation = Column(String(50), nullable=True) # 'normal', 'weakness_suspected', 'unable_to_assess'

    speech_result = Column(String(50), nullable=False) # 'normal', 'possible_speech_difficulty', 'unable_to_assess'
    speech_ai_observation = Column(String(100), nullable=True) # 'normal_speech_pattern', 'possible_speech_mismatch'
    speech_doctor_confirmation = Column(String(50), nullable=True) # 'normal', 'abnormal', 'unable_to_assess'
    
    # Optional BE-FAST Extension
    balance_result = Column(String(50), default="normal") # 'normal', 'sudden_loss', 'unable_to_assess'
    eyes_result = Column(String(50), default="normal")    # 'normal', 'sudden_vision_changes', 'unable_to_assess'
    
    # Vital Signs
    systolic_bp = Column(Float, nullable=False)
    diastolic_bp = Column(Float, nullable=False)
    glucose = Column(Float, nullable=False) # mg/dL
    heart_rate = Column(Float, nullable=False) # bpm
    spo2 = Column(Float, nullable=False) # %
    temperature = Column(Float, nullable=True) # °C
    
    # AI / Urgency Results
    risk_score = Column(Float, nullable=False) # 0 to 100
    risk_level = Column(String(50), nullable=False) # 'LOW', 'MODERATE', 'HIGH'
    confidence = Column(Float, nullable=True) # e.g. None in demo mode as required
    contributing_factors = Column(JSON, default=list) # e.g. ["Face droop detected", "Elevated BP (185/110)", "Onset < 3h"]
    recommendation = Column(Text, nullable=False)
    doctor_notes = Column(Text, nullable=True)
    
    # Structured Doctor Notes (Clinical Observation, Additional Symptoms, Immediate Action, Follow-up)
    structured_notes = Column(JSON, default=dict)
    
    # Camera Analysis Metrics Snapshot
    camera_assessment_data = Column(JSON, default=dict) # e.g. {"face_symmetry_score": 72, "drift_delta_px": 35}
    
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="assessments")
    doctor = relationship("Doctor", back_populates="assessments")
    referrals = relationship("Referral", back_populates="assessment")
    ai_assessment = relationship("AIAssessment", back_populates="assessment", uselist=False, cascade="all, delete-orphan")

