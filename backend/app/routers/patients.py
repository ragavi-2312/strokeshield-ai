from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.models.referral import Referral
from app.schemas.patient import PatientCreate, PatientUpdate, PatientDetail, PatientSummary
from app.services.auth_service import get_current_doctor

router = APIRouter(prefix="/patients", tags=["Patients"])

def calculate_age(dob_str: str) -> int:
    try:
        born = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return 50 # Default fallback

def generate_next_patient_id(db: Session) -> str:
    count = db.query(Patient).count()
    return f"P-{1001 + count}"

@router.get("", response_model=List[PatientSummary])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, ID, or phone"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: LOW, MODERATE, HIGH"),
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    query = db.query(Patient).filter(Patient.doctor_id == current_doctor.id)
    
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            Patient.name.ilike(s),
            Patient.patient_id.ilike(s),
            Patient.phone.ilike(s)
        ))
        
    patients = query.order_by(desc(Patient.created_at)).all()
    
    summaries = []
    for p in patients:
        # Get latest assessment
        latest_assessment = db.query(Assessment).filter(Assessment.patient_id == p.id).order_by(desc(Assessment.assessment_time)).first()
        # Get active referral if any
        latest_referral = db.query(Referral).filter(Referral.patient_id == p.id).order_by(desc(Referral.created_at)).first()
        total_assessments = db.query(Assessment).filter(Assessment.patient_id == p.id).count()
        
        last_risk = latest_assessment.risk_level if latest_assessment else None
        last_score = latest_assessment.risk_score if latest_assessment else None
        last_date = latest_assessment.assessment_time if latest_assessment else None
        ref_status = latest_referral.status if latest_referral else None
        
        # Risk filter if specified
        if risk_level and last_risk != risk_level.upper():
            continue
            
        summaries.append(PatientSummary(
            id=p.id,
            patient_id=p.patient_id,
            name=p.name,
            age=p.age,
            gender=p.gender,
            phone=p.phone,
            last_assessment_date=last_date,
            last_risk_level=last_risk,
            last_risk_score=last_score,
            total_assessments=total_assessments,
            active_referral_status=ref_status,
            created_at=p.created_at
        ))
        
    return summaries

@router.post("", response_model=PatientDetail, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    age = calculate_age(payload.dob)
    patient_id = generate_next_patient_id(db)
    
    patient = Patient(
        patient_id=patient_id,
        doctor_id=current_doctor.id,
        name=payload.name.strip(),
        dob=payload.dob,
        age=age,
        gender=payload.gender,
        phone=payload.phone.strip(),
        email=payload.email.strip() if payload.email else None,
        address=payload.address.strip() if payload.address else None,
        emergency_contact_name=payload.emergency_contact_name.strip(),
        emergency_contact_phone=payload.emergency_contact_phone.strip(),
        medical_history=payload.medical_history or {}
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return patient

@router.put("/{patient_id}", response_model=PatientDetail)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    if payload.name is not None:
        patient.name = payload.name.strip()
    if payload.dob is not None:
        patient.dob = payload.dob
        patient.age = calculate_age(payload.dob)
    if payload.gender is not None:
        patient.gender = payload.gender
    if payload.phone is not None:
        patient.phone = payload.phone.strip()
    if payload.email is not None:
        patient.email = payload.email.strip() if payload.email else None
    if payload.address is not None:
        patient.address = payload.address.strip() if payload.address else None
    if payload.emergency_contact_name is not None:
        patient.emergency_contact_name = payload.emergency_contact_name.strip()
    if payload.emergency_contact_phone is not None:
        patient.emergency_contact_phone = payload.emergency_contact_phone.strip()
    if payload.medical_history is not None:
        patient.medical_history = payload.medical_history
        
    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient

@router.get("/{patient_id}/timeline")
def get_patient_timeline(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    timeline = []
    
    # 1. Registration Event
    timeline.append({
        "timestamp": patient.created_at.isoformat(),
        "type": "REGISTRATION",
        "title": "Patient Registered",
        "description": f"Patient profile created by {current_doctor.name}",
        "badge": "Normal",
        "icon": "user-plus"
    })
    
    # 2. Assessments
    assessments = db.query(Assessment).filter(Assessment.patient_id == patient_id).order_by(Assessment.assessment_time).all()
    for a in assessments:
        badge_type = "Emergency" if a.risk_level == "HIGH" else ("Warning" if a.risk_level == "MODERATE" else "Success")
        fast_summary = []
        if a.face_result != "normal": fast_summary.append("Face Abnormality")
        if a.arm_result != "normal": fast_summary.append("Arm Weakness")
        if a.speech_result != "normal": fast_summary.append("Speech Difficulty")
        fast_text = ", ".join(fast_summary) if fast_summary else "FAST Normal"
        
        timeline.append({
            "timestamp": a.assessment_time.isoformat(),
            "type": "ASSESSMENT",
            "title": f"Stroke Assessment — {a.risk_level} URGENCY (Score: {a.risk_score:.0f}/100)",
            "description": f"Vitals: BP {a.systolic_bp:.0f}/{a.diastolic_bp:.0f}, Glucose {a.glucose:.0f} mg/dL, SpO2 {a.spo2:.0f}%. FAST: {fast_text}.",
            "badge": badge_type,
            "assessment_id": a.id,
            "icon": "activity"
        })
        
    # 3. Referrals
    referrals = db.query(Referral).filter(Referral.patient_id == patient_id).order_by(Referral.created_at).all()
    for r in referrals:
        h_name = r.hospital.name if r.hospital else "Speciality Stroke Center"
        timeline.append({
            "timestamp": r.created_at.isoformat(),
            "type": "REFERRAL",
            "title": f"Emergency Referral Initiated — {h_name}",
            "description": f"Priority: {r.priority} | Current Status: {r.status} | Transport: {r.ambulance_requested}",
            "badge": "Emergency" if r.priority == "Emergency" else "Warning",
            "referral_id": r.id,
            "icon": "ambulance"
        })
        
        # Add sub-timeline events from referral if any
        if r.timeline_events:
            for event in r.timeline_events:
                timeline.append({
                    "timestamp": r.created_at.isoformat(), # approximate or event timestamp
                    "type": "REFERRAL_UPDATE",
                    "title": f"Referral Update: {event.get('event')}",
                    "description": f"Updated by: {event.get('actor', 'System')} at {event.get('time')}",
                    "badge": "Info",
                    "icon": "clock"
                })

    # Sort all timeline items chronologically (latest first)
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    return timeline

@router.get("/{patient_id}/vitals-history")
def get_vitals_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    assessments = db.query(Assessment).filter(Assessment.patient_id == patient_id).order_by(Assessment.assessment_time).all()
    
    vitals_series = []
    for a in assessments:
        vitals_series.append({
            "assessment_id": a.id,
            "date": a.assessment_time.strftime("%b %d, %H:%M"),
            "timestamp": a.assessment_time.isoformat(),
            "systolic_bp": a.systolic_bp,
            "diastolic_bp": a.diastolic_bp,
            "glucose": a.glucose,
            "heart_rate": a.heart_rate,
            "spo2": a.spo2,
            "temperature": a.temperature,
            "risk_score": a.risk_score,
            "risk_level": a.risk_level
        })
        
    return vitals_series
