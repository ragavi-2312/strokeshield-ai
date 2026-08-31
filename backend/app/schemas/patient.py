from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    dob: str # YYYY-MM-DD
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    medical_history: Dict[str, Any] = Field(default_factory=dict)

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[Dict[str, Any]] = None

class PatientSummary(BaseModel):
    id: int
    patient_id: str
    name: str
    age: int
    gender: str
    phone: str
    last_assessment_date: Optional[datetime] = None
    last_risk_level: Optional[str] = None
    last_risk_score: Optional[float] = None
    total_assessments: int = 0
    active_referral_status: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PatientDetail(PatientBase):
    id: int
    patient_id: str
    doctor_id: int
    age: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
