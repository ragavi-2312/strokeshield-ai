from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.ai_assessment import AIAssessmentResponse

class AssessmentBase(BaseModel):
    patient_id: int
    symptom_onset: Optional[str] = None
    last_known_well_time: Optional[str] = None
    symptom_duration_minutes: Optional[int] = None
    
    # FAST & Camera Findings
    face_result: str # 'normal', 'possible_abnormality', 'unable_to_assess'
    face_ai_observation: Optional[str] = None
    face_doctor_confirmation: Optional[str] = None

    arm_result: str  # 'normal', 'possible_weakness', 'possible_numbness', 'unable_to_assess'
    arm_ai_observation: Optional[str] = None
    arm_doctor_confirmation: Optional[str] = None

    speech_result: str # 'normal', 'possible_speech_difficulty', 'unable_to_assess'
    speech_ai_observation: Optional[str] = None
    speech_doctor_confirmation: Optional[str] = None
    
    # Optional BE-FAST
    balance_result: Optional[str] = "normal"
    eyes_result: Optional[str] = "normal"
    
    # Vitals
    systolic_bp: float = Field(..., ge=50, le=300)
    diastolic_bp: float = Field(..., ge=30, le=200)
    glucose: float = Field(..., ge=20, le=800)
    heart_rate: float = Field(..., ge=30, le=250)
    spo2: float = Field(..., ge=50, le=100)
    temperature: Optional[float] = Field(None, ge=30.0, le=45.0)
    
    doctor_notes: Optional[str] = None
    structured_notes: Optional[Dict[str, str]] = None
    camera_assessment_data: Optional[Dict[str, Any]] = None

class AssessmentCreate(AssessmentBase):
    pass

class PredictRequest(BaseModel):
    age: int = 55
    gender: Optional[str] = "Male"
    hypertension: bool = False
    diabetes: bool = False
    heart_disease: bool = False
    high_cholesterol: bool = False
    smoking: Optional[str] = "never"
    previous_stroke: bool = False
    family_history_stroke: bool = False
    bmi: Optional[float] = 25.0
    
    systolic_bp: float = 120.0
    diastolic_bp: float = 80.0
    glucose: float = 100.0
    heart_rate: float = 75.0
    spo2: float = 98.0
    temperature: Optional[float] = 37.0
    
    face_result: str = "normal"
    face_doctor_confirmation: Optional[str] = None
    arm_result: str = "normal"
    arm_doctor_confirmation: Optional[str] = None
    speech_result: str = "normal"
    speech_doctor_confirmation: Optional[str] = None
    balance_result: Optional[str] = "normal"
    eyes_result: Optional[str] = "normal"
    symptom_duration_minutes: Optional[int] = None
    last_known_well_time: Optional[str] = None

class PredictResponse(BaseModel):
    risk_level: str # 'LOW', 'MODERATE', 'HIGH'
    risk_score: float # 0 - 100
    confidence: Optional[float] = None
    urgency_tier: str
    contributing_factors: List[str]
    recommendation: str
    model_name: str = "StrokeShield Multi-Modal Neuro Triage"
    model_version: str = "v1.0.0"
    is_demo_prediction: bool = True
    disclaimer: str = "Clinical Decision Support Prototype — NOT a definitive diagnostic tool or replacement for professional medical evaluation."

class AssessmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    assessment_time: datetime
    symptom_onset: Optional[str] = None
    last_known_well_time: Optional[str] = None
    symptom_duration_minutes: Optional[int] = None
    face_result: str
    face_ai_observation: Optional[str] = None
    face_doctor_confirmation: Optional[str] = None
    arm_result: str
    arm_ai_observation: Optional[str] = None
    arm_doctor_confirmation: Optional[str] = None
    speech_result: str
    speech_ai_observation: Optional[str] = None
    speech_doctor_confirmation: Optional[str] = None
    balance_result: Optional[str] = "normal"
    eyes_result: Optional[str] = "normal"
    systolic_bp: float
    diastolic_bp: float
    glucose: float
    heart_rate: float
    spo2: float
    temperature: Optional[float] = None
    risk_score: float
    risk_level: str
    confidence: Optional[float] = None
    contributing_factors: List[str]
    recommendation: str
    doctor_notes: Optional[str] = None
    structured_notes: Optional[Dict[str, str]] = None
    camera_assessment_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    ai_assessment: Optional[AIAssessmentResponse] = None

    model_config = ConfigDict(from_attributes=True)

class EmergencySummaryResponse(BaseModel):
    patient_id: str
    patient_name: str
    age: int
    gender: str
    phone: str
    emergency_contact: str
    emergency_phone: str
    assessment_time: str
    symptom_onset: str
    last_known_well_time: Optional[str] = None
    symptom_duration_text: str
    
    # 1. SOURCE / ORIGINAL INFORMATION
    fast_findings: Dict[str, str]
    befast_findings: Dict[str, str]
    camera_findings: Dict[str, Any]
    vital_signs: Dict[str, Any]
    relevant_medical_history: List[str]
    
    # 2. AI-ASSISTED INFORMATION (Separated)
    ai_model_name: str = "StrokeShield Multi-Modal Neuro Triage"
    ai_model_version: str = "v1.0.0"
    risk_level: str
    risk_score: float
    urgency_recommendation: str
    contributing_factors: List[str]
    
    # 3. DOCTOR DECISION & NOTES
    doctor_notes: Optional[str]
    structured_notes: Optional[Dict[str, str]] = None
    assessing_doctor: str
    hospital_affiliation: str
    disclaimer: str
