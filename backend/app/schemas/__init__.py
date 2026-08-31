from app.schemas.auth import (
    LoginRequest, ForgotPasswordRequest, DoctorResponse, HospitalStaffResponse, TokenResponse
)
from app.schemas.patient import PatientCreate, PatientUpdate, PatientSummary, PatientDetail
from app.schemas.assessment import (
    AssessmentCreate, AssessmentResponse, PredictRequest, PredictResponse, EmergencySummaryResponse
)
from app.schemas.hospital import HospitalBase, HospitalResponse, HospitalRecommendationResponse
from app.schemas.referral import ReferralCreate, ReferralStatusUpdate, ReferralResponse, ReferralRouteResponse
from app.schemas.dashboard import DashboardOverviewResponse, DashboardStats, RecentAssessmentItem, EmergencyAlertItem
from app.schemas.audit_log import AuditLogCreate, AuditLogResponse

__all__ = [
    "LoginRequest", "ForgotPasswordRequest", "DoctorResponse", "HospitalStaffResponse", "TokenResponse",
    "PatientCreate", "PatientUpdate", "PatientSummary", "PatientDetail",
    "AssessmentCreate", "AssessmentResponse", "PredictRequest", "PredictResponse", "EmergencySummaryResponse",
    "HospitalBase", "HospitalResponse", "HospitalRecommendationResponse",
    "ReferralCreate", "ReferralStatusUpdate", "ReferralResponse", "ReferralRouteResponse",
    "DashboardOverviewResponse", "DashboardStats", "RecentAssessmentItem", "EmergencyAlertItem",
    "AuditLogCreate", "AuditLogResponse"
]
