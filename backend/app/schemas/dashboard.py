from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DashboardStats(BaseModel):
    total_patients: int
    assessments_today: int
    high_risk_patients: int
    emergency_cases: int
    active_referrals: int

class RecentAssessmentItem(BaseModel):
    id: int
    patient_id_str: str
    patient_name: str
    age: int
    gender: str
    assessment_date: datetime
    risk_level: str
    risk_score: float
    status: str # e.g. "Action Required", "Under Observation", "Referred", "Routine"
    has_active_referral: bool
    referral_id: Optional[int] = None
    referral_status: Optional[str] = None

class EmergencyAlertItem(BaseModel):
    assessment_id: int
    patient_id: int
    patient_id_str: str
    patient_name: str
    age: int
    assessment_time: datetime
    risk_level: str
    risk_score: float
    symptom_duration_text: str
    contributing_factors: List[str]
    has_referral: bool
    referral_id: Optional[int] = None
    referral_status: Optional[str] = None

class DashboardOverviewResponse(BaseModel):
    stats: DashboardStats
    emergency_alerts: List[EmergencyAlertItem]
    recent_assessments: List[RecentAssessmentItem]
