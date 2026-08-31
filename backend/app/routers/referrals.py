from typing import List, Optional, Dict, Any
from datetime import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.doctor import Doctor
from app.models.hospital_staff import HospitalStaff
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.models.hospital import Hospital
from app.models.referral import Referral
from app.schemas.referral import ReferralCreate, ReferralStatusUpdate, ReferralResponse, ReferralRouteResponse
from app.services.auth_service import get_current_user, get_current_doctor, log_audit_event
from app.services.hospital_service import haversine_distance_km, estimate_travel_time_min

router = APIRouter(prefix="/referrals", tags=["Referrals"])

def generate_referral_code(db: Session) -> str:
    count = db.query(Referral).count()
    return f"REF-2026-{10001 + count}"

def format_referral_response(ref: Referral) -> ReferralResponse:
    patient = ref.patient
    return ReferralResponse(
        id=ref.id,
        referral_code=ref.referral_code or f"REF-2026-1000{ref.id}",
        patient_id=ref.patient_id,
        assessment_id=ref.assessment_id,
        doctor_id=ref.doctor_id,
        hospital_id=ref.hospital_id,
        source_hospital_name=ref.source_hospital_name or "Source Medical Center",
        source_latitude=ref.source_latitude or 37.7749,
        source_longitude=ref.source_longitude or -122.4194,
        source_accuracy_meters=ref.source_accuracy_meters,
        source_timestamp=ref.source_timestamp,
        destination_latitude=ref.destination_latitude or (ref.hospital.latitude if ref.hospital else 37.7749),
        destination_longitude=ref.destination_longitude or (ref.hospital.longitude if ref.hospital else -122.4194),
        distance_km=ref.distance_km or (ref.hospital.estimated_distance_km if ref.hospital else 5.0),
        road_distance_km=ref.road_distance_km,
        estimated_travel_minutes=ref.estimated_travel_minutes,
        priority=ref.priority,
        status=ref.status,
        ambulance_requested=ref.ambulance_requested,
        estimated_eta_minutes=ref.estimated_eta_minutes,
        dispatch_notes=ref.dispatch_notes,
        doctor_confirmed=ref.doctor_confirmed or "true",
        doctor_confirmed_at=ref.doctor_confirmed_at,
        qr_data=ref.qr_data or {},
        patient_summary_snapshot=ref.patient_summary_snapshot or {},
        timeline_events=ref.timeline_events or [],
        created_at=ref.created_at,
        accepted_at=ref.accepted_at,
        preparing_at=ref.preparing_at,
        arrived_at=ref.arrived_at,
        closed_at=ref.closed_at,
        updated_at=ref.updated_at,
        hospital=ref.hospital,
        patient_name=patient.name if patient else "Unknown",
        patient_identifier=patient.patient_id if patient else ""
    )

@router.post("", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
    payload: ReferralCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id, Patient.doctor_id == current_doctor.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    assessment = db.query(Assessment).filter(Assessment.id == payload.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment record not found")
        
    hospital = db.query(Hospital).filter(Hospital.id == payload.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Destination hospital not found")

    now = datetime.utcnow()
    referral_code = generate_referral_code(db)
    secure_token = f"tok-{secrets.token_hex(8)}"
    
    # Resolve exact source GPS
    src_lat = payload.source_latitude if payload.source_latitude is not None else current_doctor.latitude or 37.7749
    src_lon = payload.source_longitude if payload.source_longitude is not None else current_doctor.longitude or -122.4194
    src_name = payload.source_hospital_name or current_doctor.hospital or "Origin Clinic"
    src_acc = payload.source_accuracy_meters or 12.0
    src_time = payload.source_timestamp or now

    # Compute straight-line distance & road estimates
    dist_km = haversine_distance_km(src_lat, src_lon, hospital.latitude, hospital.longitude)
    road_dist_km = payload.road_distance_km
    eta_min = payload.estimated_travel_minutes or estimate_travel_time_min(dist_km)

    # Snapshot of emergency clinical summary (Section 20)
    snapshot = {
        "patient_id": patient.patient_id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "symptom_onset": assessment.symptom_onset or "Unknown",
        "last_known_well": assessment.last_known_well_time or assessment.symptom_onset,
        "fast_findings": {
            "face": assessment.face_result,
            "arm": assessment.arm_result,
            "speech": assessment.speech_result
        },
        "camera_findings": assessment.camera_assessment_data or {},
        "vitals": {
            "bp": f"{assessment.systolic_bp:.0f}/{assessment.diastolic_bp:.0f}",
            "glucose": assessment.glucose,
            "heart_rate": assessment.heart_rate,
            "spo2": f"{assessment.spo2:.0f}%"
        },
        "risk_level": assessment.risk_level,
        "risk_score": assessment.risk_score,
        "source_hospital": src_name,
        "source_gps": {"latitude": src_lat, "longitude": src_lon, "accuracy_meters": src_acc},
        "destination_hospital": hospital.name,
        "destination_gps": {"latitude": hospital.latitude, "longitude": hospital.longitude},
        "straight_line_distance_km": dist_km,
        "road_distance_km": road_dist_km,
        "estimated_travel_minutes": eta_min
    }
    
    qr_payload = {
        "referral_code": referral_code,
        "hospital_name": hospital.name,
        "priority": payload.priority,
        "secure_token": secure_token,
        "issued_at": now.isoformat()
    }
    
    timeline = [
        {
            "time": now.strftime("%H:%M:%S"),
            "event": f"Emergency Referral Dispatched for {hospital.name} ({dist_km} km straight-line)",
            "actor": current_doctor.name
        },
        {
            "time": now.strftime("%H:%M:%S"),
            "event": f"Doctor Gate Verified | Transport: {payload.ambulance_requested}",
            "actor": current_doctor.name
        }
    ]

    referral = Referral(
        referral_code=referral_code,
        patient_id=patient.id,
        assessment_id=assessment.id,
        doctor_id=current_doctor.id,
        hospital_id=hospital.id,
        source_hospital_name=src_name,
        source_latitude=src_lat,
        source_longitude=src_lon,
        source_accuracy_meters=src_acc,
        source_timestamp=src_time,
        destination_latitude=hospital.latitude,
        destination_longitude=hospital.longitude,
        distance_km=dist_km,
        road_distance_km=road_dist_km,
        estimated_travel_minutes=eta_min,
        priority=payload.priority,
        status="Sent",
        ambulance_requested=payload.ambulance_requested,
        estimated_eta_minutes=eta_min,
        dispatch_notes=payload.dispatch_notes,
        doctor_confirmed="true",
        doctor_confirmed_at=now,
        qr_data=qr_payload,
        patient_summary_snapshot=snapshot,
        timeline_events=timeline,
        created_at=now,
        updated_at=now
    )
    
    db.add(referral)
    db.commit()
    db.refresh(referral)

    log_audit_event(
        db,
        "Doctor",
        current_doctor.name,
        current_doctor.email,
        "Emergency Referral Created",
        {
            "referral_code": referral_code,
            "destination": hospital.name,
            "distance_km": dist_km,
            "road_distance_km": road_dist_km,
            "eta_min": eta_min
        }
    )

    return format_referral_response(referral)

@router.get("", response_model=List[ReferralResponse])
def list_referrals(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    auth_data = Depends(get_current_user)
):
    user = auth_data["user"]
    role = auth_data["role"]
    
    query = db.query(Referral)
    if role == "doctor":
        query = query.filter(Referral.doctor_id == user.id)
    elif role == "hospital_staff":
        query = query.filter(Referral.hospital_id == user.hospital_id)
        
    if status_filter:
        query = query.filter(Referral.status == status_filter)
        
    referrals = query.order_by(desc(Referral.created_at)).all()
    return [format_referral_response(r) for r in referrals]

@router.get("/{referral_id}", response_model=ReferralResponse)
def get_referral(
    referral_id: int,
    db: Session = Depends(get_db),
    auth_data = Depends(get_current_user)
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return format_referral_response(referral)

@router.get("/{referral_id}/route", response_model=ReferralRouteResponse)
def get_referral_route(
    referral_id: int,
    db: Session = Depends(get_db),
    auth_data = Depends(get_current_user)
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    hosp = referral.hospital
    src_lat = referral.source_latitude or 37.7749
    src_lon = referral.source_longitude or -122.4194
    src_acc = referral.source_accuracy_meters or 10.0
    dest_lat = referral.destination_latitude or (hosp.latitude if hosp else 37.7833)
    dest_lon = referral.destination_longitude or (hosp.longitude if hosp else -122.4167)
    
    # Calculate direct Google Maps / Navigation URL with exact coordinates
    nav_url = f"https://www.google.com/maps/dir/?api=1&origin={src_lat},{src_lon}&destination={dest_lat},{dest_lon}&travelmode=driving"
    
    mid_lat = (src_lat + dest_lat) / 2.0 + 0.002
    mid_lon = (src_lon + dest_lon) / 2.0 - 0.002
    waypoints = [
        [src_lat, src_lon],
        [src_lat + (mid_lat - src_lat) * 0.5, src_lon + (mid_lon - src_lon) * 0.4],
        [mid_lat, mid_lon],
        [mid_lat + (dest_lat - mid_lat) * 0.6, mid_lon + (dest_lon - mid_lon) * 0.7],
        [dest_lat, dest_lon]
    ]

    return ReferralRouteResponse(
        referral_id=referral.id,
        referral_code=referral.referral_code or f"REF-2026-1000{referral.id}",
        status=referral.status,
        source={
            "name": referral.source_hospital_name or "Origin Clinic",
            "latitude": src_lat,
            "longitude": src_lon,
            "accuracy": src_acc
        },
        destination={
            "name": hosp.name if hosp else "Stroke Center",
            "address": hosp.address if hosp else "Metro City",
            "latitude": dest_lat,
            "longitude": dest_lon,
            "phone": hosp.phone if hosp else "",
            "emergency_phone": hosp.emergency_phone if hosp else ""
        },
        straight_line_distance_km=referral.distance_km or (hosp.estimated_distance_km if hosp else 5.0),
        road_distance_km=referral.road_distance_km,
        estimated_travel_minutes=referral.estimated_travel_minutes,
        navigation_url=nav_url,
        waypoints=waypoints,
        hospital_capabilities={
            "stroke_care": hosp.stroke_care_available if hosp else True,
            "neurology": hosp.neurology_available if hosp else True,
            "emergency": hosp.emergency_department if hosp else True,
            "ct_scan": hosp.ct_scan_available if hosp else True,
            "mri": hosp.mri_available if hosp else True,
            "icu": hosp.icu_available if hosp else True
        }
    )

@router.patch("/{referral_id}/status", response_model=ReferralResponse)
def update_referral_status(
    referral_id: int,
    payload: ReferralStatusUpdate,
    db: Session = Depends(get_db),
    auth_data = Depends(get_current_user)
):
    user = auth_data["user"]
    role = auth_data["role"]
    
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    now = datetime.utcnow()
    referral.status = payload.status
    referral.updated_at = now
    
    if payload.status == "Accepted":
        referral.accepted_at = now
    elif payload.status == "Preparing":
        referral.preparing_at = now
    elif payload.status in ["Patient Arrived", "Arrived"]:
        referral.arrived_at = now
    elif payload.status == "Closed":
        referral.closed_at = now
    
    events = list(referral.timeline_events or [])
    note_text = f" ({payload.note})" if payload.note else ""
    actor_name = user.name
    actor_label = f"{actor_name} ({'Hospital Team' if role == 'hospital_staff' else 'Doctor'})"
    
    events.append({
        "time": now.strftime("%H:%M:%S"),
        "event": f"Status updated to: {payload.status}{note_text}",
        "actor": actor_label
    })
    referral.timeline_events = events
    
    db.commit()
    db.refresh(referral)

    log_audit_event(
        db,
        "Hospital Staff" if role == "hospital_staff" else "Doctor",
        user.name,
        user.email,
        f"Referral Status Updated ({payload.status})",
        {"referral_id": referral.id, "new_status": payload.status}
    )

    return format_referral_response(referral)
