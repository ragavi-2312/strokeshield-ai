from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class AIAssessment(Base):
    """
    AI-Generated Data Layer (Section 3 & 9):
    Separated from original source clinical records.
    Contains model versioning, generated urgency classification, and explanation.
    """
    __tablename__ = "ai_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    
    # Model Provenance & Versioning (Section 12)
    model_name = Column(String(100), default="StrokeShield Multi-Modal Neuro Triage")
    model_version = Column(String(50), default="v1.0.0")
    input_reference = Column(JSON, default=dict)
    
    # AI Generated Inferences & Observations
    ai_facial_observation = Column(Text, nullable=True)
    ai_arm_observation = Column(Text, nullable=True)
    ai_speech_observation = Column(Text, nullable=True)
    
    # AI Urgency Classification
    ai_urgency_score = Column(Float, nullable=False, default=0.0) # 0.0 to 100.0
    ai_urgency_category = Column(String(50), nullable=False, default="LOW") # LOW, MODERATE, HIGH, UNABLE_TO_ASSESS
    ai_explanation = Column(Text, nullable=False, default="")
    confidence_score = Column(Float, default=0.95)
    
    generated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assessment = relationship("Assessment", back_populates="ai_assessment")
