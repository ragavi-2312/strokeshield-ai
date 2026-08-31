from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.models.referral import Referral
from app.schemas.dashboard import (
    DashboardOverviewResponse, DashboardStats, RecentAssessmentItem, EmergencyAlertItem
)
from app.services.auth_service import get_current_doctor

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/statistics", response_model=DashboardOverviewResponse)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    
    total_patients = db.query(Patient).filter(Patient.doctor_id == current_doctor.id).count()
    assessments_today = (
        db.query(Assessment)
        .filter(Assessment.doctor_id == current_doctor.id, Assessment.assessment_time >= today_start)
        .count()
    )
    
    # High risk patients count
    high_risk_count = (
        db.query(Assessment.patient_id)
        .filter(Assessment.doctor_id == current_doctor.id, Assessment.risk_level == "HIGH")
        .distinct()
        .count()
    )
    
    # Active referrals
    active_referrals_count = (
        db.query(Referral)
        .filter(Referral.doctor_id == current_doctor.id, Referral.status.in_(["Created", "Sent", "Acknowledged", "In Transit"]))
        .count()
    )

    # 1. Emergency Alerts: High urgency assessments
    high_assessments = (
        db.query(Assessment)
        .filter(Assessment.doctor_id == current_doctor.id, Assessment.risk_level == "HIGH")
        .order_by(desc(Assessment.assessment_time))
        .limit(10)
        .all()
    )
    
    emergency_alerts = []
    seen_patients = set()
    for a in high_assessments:
        if a.patient_id in seen_patients:
            continue
        seen_patients.add(a.patient_id)
        patient = a.patient
        if not patient:
            continue
            
        # Check if referral exists for this assessment/patient
        ref = db.query(Referral).filter(Referral.patient_id == patient.id).order_by(desc(Referral.created_at)).first()
        
        # Duration text
        if a.symptom_duration_minutes is not None:
            hours = a.symptom_duration_minutes // 60
            mins = a.symptom_duration_minutes % 60
            dur_text = f"{hours}h {mins}m onset" if hours > 0 else f"{mins}m onset"
        else:
            dur_text = "Onset unrecorded"
            
        emergency_alerts.append(EmergencyAlertItem(
            assessment_id=a.id,
            patient_id=patient.id,
            patient_id_str=patient.patient_id,
            patient_name=patient.name,
            age=patient.age,
            assessment_time=a.assessment_time,
            risk_level=a.risk_level,
            risk_score=a.risk_score,
            symptom_duration_text=dur_text,
            contributing_factors=a.contributing_factors[:3] if a.contributing_factors else [],
            has_referral=ref is not None,
            referral_id=ref.id if ref else None,
            referral_status=ref.status if ref else None
        ))

    # 2. Recent Assessments Table
    recent_assessments_raw = (
        db.query(Assessment)
        .filter(Assessment.doctor_id == current_doctor.id)
        .order_by(desc(Assessment.assessment_time))
        .limit(15)
        .all()
    )
    
    recent_items = []
    for a in recent_assessments_raw:
        patient = a.patient
        if not patient:
            continue
        ref = db.query(Referral).filter(Referral.assessment_id == a.id).first()
        
        status_label = "Emergency Action" if a.risk_level == "HIGH" else ("Priority Care" if a.risk_level == "MODERATE" else "Routine")
        if ref:
            status_label = f"Referred ({ref.status})"

        recent_items.append(RecentAssessmentItem(
            id=a.id,
            patient_id_str=patient.patient_id,
            patient_name=patient.name,
            age=patient.age,
            gender=patient.gender,
            assessment_date=a.assessment_time,
            risk_level=a.risk_level,
            risk_score=a.risk_score,
            status=status_label,
            has_active_referral=ref is not None,
            referral_id=ref.id if ref else None,
            referral_status=ref.status if ref else None
        ))

    return DashboardOverviewResponse(
        stats=DashboardStats(
            total_patients=total_patients,
            assessments_today=assessments_today,
            high_risk_patients=high_risk_count,
            emergency_cases=len(emergency_alerts),
            active_referrals=active_referrals_count
        ),
        emergency_alerts=emergency_alerts,
        recent_assessments=recent_items
    )
