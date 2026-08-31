from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class AIAssessmentResponse(BaseModel):
    id: int
    assessment_id: int
    model_name: str
    model_version: str
    input_reference: Dict[str, Any] = {}
    ai_facial_observation: Optional[str] = None
    ai_arm_observation: Optional[str] = None
    ai_speech_observation: Optional[str] = None
    ai_urgency_score: float
    ai_urgency_category: str
    ai_explanation: str
    confidence_score: Optional[float] = 0.95
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
