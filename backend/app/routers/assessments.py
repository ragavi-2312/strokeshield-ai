from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.schemas.assessment import (
    AssessmentCreate, AssessmentResponse, EmergencySummaryResponse
)
from app.services.auth_service import get_current_doctor, log_audit_event
from app.services.stroke_prediction_service import prediction_service

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id, Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    med_hist = patient.medical_history or {}
    
    # Consolidate patient features for AI triage prediction
    features = {
        "age": patient.age,
        "gender": patient.gender,
        "hypertension": med_hist.get("hypertension", False),
        "diabetes": med_hist.get("diabetes", False),
        "heart_disease": med_hist.get("heart_disease", False),
        "high_cholesterol": med_hist.get("high_cholesterol", False),
        "smoking": med_hist.get("smoking", "never"),
        "previous_stroke": med_hist.get("previous_stroke", False),
        "family_history_stroke": med_hist.get("family_history_stroke", False),
        "bmi": med_hist.get("bmi", 25.0),
        
        "systolic_bp": payload.systolic_bp,
        "diastolic_bp": payload.diastolic_bp,
        "glucose": payload.glucose,
        "heart_rate": payload.heart_rate,
        "spo2": payload.spo2,
        "temperature": payload.temperature,
        
        "face_result": payload.face_result,
        "face_ai_observation": payload.face_ai_observation,
        "face_doctor_confirmation": payload.face_doctor_confirmation,

        "arm_result": payload.arm_result,
        "arm_ai_observation": payload.arm_ai_observation,
        "arm_doctor_confirmation": payload.arm_doctor_confirmation,

        "speech_result": payload.speech_result,
        "speech_ai_observation": payload.speech_ai_observation,
        "speech_doctor_confirmation": payload.speech_doctor_confirmation,

        "balance_result": payload.balance_result or "normal",
        "eyes_result": payload.eyes_result or "normal",
        "symptom_duration_minutes": payload.symptom_duration_minutes,
        "last_known_well_time": payload.last_known_well_time
    }
    
    ai_result = prediction_service.predict_stroke_risk(features)
    
    assessment = Assessment(
        patient_id=patient.id,
        doctor_id=current_doctor.id,
        assessment_time=datetime.utcnow(),
        symptom_onset=payload.symptom_onset,
        last_known_well_time=payload.last_known_well_time,
        symptom_duration_minutes=payload.symptom_duration_minutes,
        face_result=payload.face_result,
        face_ai_observation=payload.face_ai_observation,
        face_doctor_confirmation=payload.face_doctor_confirmation,
        arm_result=payload.arm_result,
        arm_ai_observation=payload.arm_ai_observation,
        arm_doctor_confirmation=payload.arm_doctor_confirmation,
        speech_result=payload.speech_result,
        speech_ai_observation=payload.speech_ai_observation,
        speech_doctor_confirmation=payload.speech_doctor_confirmation,
        balance_result=payload.balance_result or "normal",
        eyes_result=payload.eyes_result or "normal",
        systolic_bp=payload.systolic_bp,
        diastolic_bp=payload.diastolic_bp,
        glucose=payload.glucose,
        heart_rate=payload.heart_rate,
        spo2=payload.spo2,
        temperature=payload.temperature,
        risk_score=ai_result["risk_score"],
        risk_level=ai_result["risk_level"],
        confidence=None, # Explicitly None for safety
        contributing_factors=ai_result["contributing_factors"],
        recommendation=ai_result["recommendation"],
        doctor_notes=payload.doctor_notes,
        structured_notes=payload.structured_notes or {},
        camera_assessment_data=payload.camera_assessment_data or {}
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # 2. Persist to Separate AI Assessment Layer (Section 3 & 9)
    from app.models.ai_assessment import AIAssessment
    ai_record = AIAssessment(
        assessment_id=assessment.id,
        model_name="StrokeShield Multi-Modal Neuro Triage",
        model_version="v1.0.0",
        input_reference={
            "patient_code": patient.patient_id,
            "systolic_bp": payload.systolic_bp,
            "diastolic_bp": payload.diastolic_bp,
            "glucose": payload.glucose,
            "spo2": payload.spo2,
            "face_result": payload.face_result,
            "arm_result": payload.arm_result,
            "speech_result": payload.speech_result
        },
        ai_facial_observation=payload.face_ai_observation,
        ai_arm_observation=payload.arm_ai_observation,
        ai_speech_observation=payload.speech_ai_observation,
        ai_urgency_score=ai_result["risk_score"],
        ai_urgency_category=ai_result["risk_level"],
        ai_explanation=ai_result["recommendation"],
        confidence_score=0.95,
        generated_at=datetime.utcnow()
    )
    db.add(ai_record)
    db.commit()

    # Record Audit Log
    log_audit_event(
        db, 
        "Doctor", 
        current_doctor.name, 
        current_doctor.email, 
        "BE-FAST Assessment Completed", 
        {
            "assessment_id": assessment.id,
            "patient_id": patient.patient_id,
            "risk_level": assessment.risk_level,
            "risk_score": assessment.risk_score,
            "face_confirmed": assessment.face_doctor_confirmation,
            "arm_confirmed": assessment.arm_doctor_confirmation
        }
    )

    return assessment

@router.get("/recent", response_model=List[AssessmentResponse])
def get_recent_assessments(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    assessments = (
        db.query(Assessment)
        .filter(Assessment.doctor_id == current_doctor.id)
        .order_by(desc(Assessment.assessment_time))
        .limit(limit)
        .all()
    )
    return assessments

@router.get("/patient/{patient_id}", response_model=List[AssessmentResponse])
def get_patient_assessments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    assessments = (
        db.query(Assessment)
        .filter(Assessment.patient_id == patient_id)
        .order_by(desc(Assessment.assessment_time))
        .all()
    )
    return assessments

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.doctor_id == current_doctor.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.get("/{assessment_id}/emergency-summary", response_model=EmergencySummaryResponse)
def get_emergency_summary(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.doctor_id == current_doctor.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    patient = assessment.patient
    med_hist = patient.medical_history or {}
    
    if assessment.symptom_duration_minutes is not None:
        hours = assessment.symptom_duration_minutes // 60
        mins = assessment.symptom_duration_minutes % 60
        duration_text = f"{hours}h {mins}m elapsed" if hours > 0 else f"{mins} minutes elapsed"
    else:
        duration_text = "Unknown / Not recorded"
        
    history_items = []
    if med_hist.get("previous_stroke"): history_items.append("Prior Stroke/TIA")
    if med_hist.get("hypertension"): history_items.append("Hypertension")
    if med_hist.get("diabetes"): history_items.append("Diabetes Mellitus")
    if med_hist.get("heart_disease"): history_items.append("Cardiac Disease / AFib")
    if med_hist.get("high_cholesterol"): history_items.append("Hyperlipidemia")
    if med_hist.get("smoking") in ["current", "former"]: history_items.append(f"Tobacco ({med_hist.get('smoking')})")
    if med_hist.get("current_medications"): history_items.append(f"Meds: {med_hist.get('current_medications')}")
    if med_hist.get("known_allergies"): history_items.append(f"Allergies: {med_hist.get('known_allergies')}")
    if not history_items: history_items.append("No significant chronic history reported")

    return EmergencySummaryResponse(
        patient_id=patient.patient_id,
        patient_name=patient.name,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        emergency_contact=patient.emergency_contact_name,
        emergency_phone=patient.emergency_contact_phone,
        assessment_time=assessment.assessment_time.strftime("%Y-%m-%d %H:%M UTC"),
        symptom_onset=assessment.symptom_onset or "Unknown",
        last_known_well_time=assessment.last_known_well_time or assessment.symptom_onset,
        symptom_duration_text=duration_text,
        fast_findings={
            "face": f"{assessment.face_result} (AI: {assessment.face_ai_observation or 'N/A'}, Confirmed: {assessment.face_doctor_confirmation or 'Yes'})",
            "arm": f"{assessment.arm_result} (AI: {assessment.arm_ai_observation or 'N/A'}, Confirmed: {assessment.arm_doctor_confirmation or 'Yes'})",
            "speech": f"{assessment.speech_result} (Confirmed: {assessment.speech_doctor_confirmation or 'Yes'})",
            "time_window": duration_text
        },
        befast_findings={
            "balance": "Sudden Ataxia / Loss of Balance" if assessment.balance_result == "sudden_loss" else "Normal",
            "eyes": "Sudden Visual Disturbance" if assessment.eyes_result == "sudden_vision_changes" else "Normal"
        },
        camera_findings=assessment.camera_assessment_data or {},
        vital_signs={
            "blood_pressure": f"{assessment.systolic_bp:.0f}/{assessment.diastolic_bp:.0f} mmHg",
            "blood_glucose": f"{assessment.glucose:.0f} mg/dL",
            "heart_rate": f"{assessment.heart_rate:.0f} bpm",
            "spo2": f"{assessment.spo2:.0f}%",
            "temperature": f"{assessment.temperature:.1f} °C" if assessment.temperature else "37.0 °C"
        },
        relevant_medical_history=history_items,
        risk_level=assessment.risk_level,
        risk_score=assessment.risk_score,
        urgency_recommendation=assessment.recommendation,
        contributing_factors=assessment.contributing_factors or [],
        doctor_notes=assessment.doctor_notes,
        structured_notes=assessment.structured_notes or {},
        assessing_doctor=current_doctor.name,
        hospital_affiliation=current_doctor.hospital or "StrokeShield AI Clinical Portal",
        disclaimer="Clinical Decision Support Prototype — NOT a definitive diagnostic tool or replacement for professional medical evaluation."
    )
