from app.routers.auth import router as auth_router
from app.routers.patients import router as patients_router
from app.routers.assessments import router as assessments_router
from app.routers.predict import router as predict_router
from app.routers.hospitals import router as hospitals_router
from app.routers.referrals import router as referrals_router
from app.routers.dashboard import router as dashboard_router
from app.routers.audit_logs import router as audit_logs_router

__all__ = [
    "auth_router",
    "patients_router",
    "assessments_router",
    "predict_router",
    "hospitals_router",
    "referrals_router",
    "dashboard_router",
    "audit_logs_router",
]
