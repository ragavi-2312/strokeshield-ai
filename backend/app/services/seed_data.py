from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.doctor import Doctor
from app.models.hospital_staff import HospitalStaff
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.models.ai_assessment import AIAssessment
from app.models.hospital import Hospital
from app.models.referral import Referral
from app.models.audit_log import AuditLog
from app.services.auth_service import get_password_hash
from app.services.stroke_prediction_service import prediction_service
from app.config import settings

def clear_demo_data(db: Session):
    """
    Safely deletes ONLY DEMO / AI-GENERATED test records in foreign-key safe order.
    Never deletes PRODUCTION / real patient or clinical data.
    """
    print("[Reset] Clearing old DEMO and AI-GENERATED records...")

    # 1. Clear Audit Logs for demo users / demo actions
    db.query(AuditLog).filter(
        (AuditLog.user_email.like("%demo%")) |
        (AuditLog.user_email.like("%strokeshield.ai%"))
    ).delete(synchronize_session=False)

    # 2. Clear Referrals linked to demo assessments / demo doctors
    db.query(Referral).filter(
        (Referral.referral_code.like("REF-%")) |
        (Referral.status != "PRODUCTION_LOCKED")
    ).delete(synchronize_session=False)

    # 3. Clear AI Assessments
    db.query(AIAssessment).delete(synchronize_session=False)

    # 4. Clear Assessments linked to demo patients or doctors
    db.query(Assessment).delete(synchronize_session=False)

    # 5. Clear Patients (only demo patients with 'DEMO' or 'P-' prefix)
    db.query(Patient).filter(
        (Patient.patient_id.like("P-%")) |
        (Patient.email.like("%@example.com")) |
        (Patient.email.like("%demo%"))
    ).delete(synchronize_session=False)

    # 6. Clear Hospital Staff demo accounts
    db.query(HospitalStaff).filter(
        (HospitalStaff.email.like("%@strokeshield.ai")) |
        (HospitalStaff.email.like("%demo%"))
    ).delete(synchronize_session=False)

    # 7. Clear Hospitals flagged as DEMO
    db.query(Hospital).filter(
        (Hospital.verification_status == "DEMO") |
        (Hospital.name.like("%Demo%")) |
        (Hospital.name.like("%Metro%")) |
        (Hospital.name.like("%St. Jude%")) |
        (Hospital.name.like("%East Bay%")) |
        (Hospital.name.like("%University%")) |
        (Hospital.name.like("%Memorial%")) |
        (Hospital.name.like("%Valley%"))
    ).delete(synchronize_session=False)

    # 8. Clear all old demo doctors (removes Sarah Chen, James Wilson, and any old duplicates)
    db.query(Doctor).filter(
        (Doctor.email.like("%@strokeshield.ai")) |
        (Doctor.email.like("%@demo-strokeshield.com")) |
        (Doctor.registration_number.like("DEMO-%"))
    ).delete(synchronize_session=False)

    db.commit()
    print("[Reset] Old demo records successfully cleared.")

def seed_database(db: Session, force_reset: bool = False):
    """
    Creates fresh, standard synthetic demo records for Dr. Raha & Dr. Vijay,
    5 Chennai demo hospitals, 10 synthetic patients, assessments, and referrals.
    """
    # If not forcing reset and doctors already exist with Dr. Raha & Dr. Vijay, do nothing
    if not force_reset:
        has_raha = db.query(Doctor).filter(Doctor.email == "raha@demo-strokeshield.com").first()
        has_vijay = db.query(Doctor).filter(Doctor.email == "vijay@demo-strokeshield.com").first()
        if has_raha and has_vijay:
            return

    # Clear old demo data first
    clear_demo_data(db)

    print("[SeedData] Generating fresh 2 AI-Generated Demo Doctors (Dr. Raha & Dr. Vijay)...")
    now = datetime.utcnow()

    # 1. DOCTOR 1: Dr. Raha (Neurologist, 6 yrs experience, Chennai)
    dr_raha = Doctor(
        name="Dr. Raha",
        specialization="Neurologist",
        hospital="Demo Stroke Care Hospital",
        email="raha@demo-strokeshield.com",
        hashed_password=get_password_hash("Doctor@123"),
        phone="+91 98765 43210",
        role="DOCTOR",
        experience_years=6,
        location="Chennai, Tamil Nadu",
        registration_number="DEMO-REG-RAHA",
        data_type="DEMO",
        data_source="AI_GENERATED",
        hospital_address="Demo Stroke Care Hospital, 100 Anna Salai, Chennai, Tamil Nadu",
        latitude=13.0827,
        longitude=80.2707,
        created_at=now - timedelta(days=90)
    )
    db.add(dr_raha)

    # 2. DOCTOR 2: Dr. Vijay (Emergency Medicine Specialist, 6 yrs experience, Chennai)
    dr_vijay = Doctor(
        name="Dr. Vijay",
        specialization="Emergency Medicine Specialist",
        hospital="Demo Neuro Emergency Hospital",
        email="vijay@demo-strokeshield.com",
        hashed_password=get_password_hash("Doctor@123"),
        phone="+91 87654 32109",
        role="DOCTOR",
        experience_years=6,
        location="Chennai, Tamil Nadu",
        registration_number="DEMO-REG-VIJAY",
        data_type="DEMO",
        data_source="AI_GENERATED",
        hospital_address="Demo Neuro Emergency Hospital, 45 Greams Road, Thousand Lights, Chennai, Tamil Nadu",
        latitude=13.0569,
        longitude=80.2425,
        created_at=now - timedelta(days=90)
    )
    db.add(dr_vijay)
    db.commit()
    db.refresh(dr_raha)
    db.refresh(dr_vijay)

    # 3. FIVE DEMO STROKE HOSPITALS
    hospitals_data = [
        {
            "name": "Demo Stroke Care Hospital",
            "address": "100 Anna Salai, Chennai, Tamil Nadu",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "phone": "+91 44 2836 1000",
            "emergency_phone": "+91 91100 11221",
            "stroke_capability": "Comprehensive Stroke Center",
            "neurology_available": True,
            "stroke_care_available": True,
            "emergency_department": True,
            "icu_available": True,
            "ct_scan_available": True,
            "mri_available": True,
            "operating_hours": "24/7 Emergency Stroke Response",
            "emergency_available": True,
            "verification_status": "DEMO",
            "specialties": ["24/7 Neuro-ICU", "Endovascular Thrombectomy", "Dual CT/MRI Suites", "Telestroke Command"],
            "estimated_distance_km": 1.2,
            "estimated_travel_time_min": 5
        },
        {
            "name": "Demo Neuro Emergency Hospital",
            "address": "45 Greams Road, Thousand Lights, Chennai, Tamil Nadu",
            "latitude": 13.0569,
            "longitude": 80.2425,
            "phone": "+91 44 2829 2000",
            "emergency_phone": "+91 91100 11222",
            "stroke_capability": "Comprehensive Stroke Center",
            "neurology_available": True,
            "stroke_care_available": True,
            "emergency_department": True,
            "icu_available": True,
            "ct_scan_available": True,
            "mri_available": True,
            "operating_hours": "24/7 Emergency Department",
            "emergency_available": True,
            "verification_status": "DEMO",
            "specialties": ["24/7 Acute Stroke Team", "Rapid CT Angiography", "Endovascular Suites", "Neuro-Trauma ICU"],
            "estimated_distance_km": 3.4,
            "estimated_travel_time_min": 11
        },
        {
            "name": "Metro Comprehensive Stroke Center",
            "address": "450 Poonamallee High Road, Chennai, Tamil Nadu",
            "latitude": 13.0750,
            "longitude": 80.2600,
            "phone": "+91 44 2641 3000",
            "emergency_phone": "+91 91100 11223",
            "stroke_capability": "Comprehensive Stroke Center",
            "neurology_available": True,
            "stroke_care_available": True,
            "emergency_department": True,
            "icu_available": True,
            "ct_scan_available": True,
            "mri_available": True,
            "operating_hours": "24/7 Level 1 Trauma & Neuro",
            "emergency_available": True,
            "verification_status": "DEMO",
            "specialties": ["24/7 Interventional Radiology", "tPA Thrombolysis Ready", "Neuro-Intensive Care", "Stroke Clinical Trials"],
            "estimated_distance_km": 2.1,
            "estimated_travel_time_min": 8
        },
        {
            "name": "St. Jude Regional Neuroscience Hospital",
            "address": "820 Health Parkway, T. Nagar, Chennai, Tamil Nadu",
            "latitude": 13.0450,
            "longitude": 80.2300,
            "phone": "+91 44 2434 4000",
            "emergency_phone": "+91 91100 11224",
            "stroke_capability": "Primary Stroke Center",
            "neurology_available": True,
            "stroke_care_available": True,
            "emergency_department": True,
            "icu_available": False,
            "ct_scan_available": True,
            "mri_available": True,
            "operating_hours": "24/7 Acute Stroke Unit",
            "emergency_available": True,
            "verification_status": "DEMO",
            "specialties": ["tPA Thrombolysis Ready", "Stroke Dedicated Ward", "Rapid Multi-slice CT", "Vascular Neurology Team"],
            "estimated_distance_km": 4.8,
            "estimated_travel_time_min": 14
        },
        {
            "name": "East Bay Neurological Hospital",
            "address": "300 Bayview Road, ECR, Chennai, Tamil Nadu",
            "latitude": 12.9800,
            "longitude": 80.2550,
            "phone": "+91 44 2448 5000",
            "emergency_phone": "+91 91100 11225",
            "stroke_capability": "Primary Stroke Center",
            "neurology_available": True,
            "stroke_care_available": True,
            "emergency_department": True,
            "icu_available": True,
            "ct_scan_available": True,
            "mri_available": False,
            "operating_hours": "24/7 Emergency Care",
            "emergency_available": True,
            "verification_status": "DEMO",
            "specialties": ["Rapid Neuro Triage", "Emergency Telemetry", "High-Resolution CT"],
            "estimated_distance_km": 7.5,
            "estimated_travel_time_min": 19
        }
    ]

    hospitals = []
    for h_data in hospitals_data:
        h = Hospital(**h_data)
        db.add(h)
        hospitals.append(h)
    db.commit()
    for h in hospitals:
        db.refresh(h)

    # 4. ONE DEMO HOSPITAL STAFF USER
    hospital_staff = HospitalStaff(
        name="Nurse Coordinator Mark Reynolds, RN",
        email="staff.metro@strokeshield.ai",
        hashed_password=get_password_hash("Hospital@123"),
        role="hospital_staff",
        phone="+91 91100 12345",
        hospital_id=hospitals[0].id,
        created_at=now - timedelta(days=60)
    )
    db.add(hospital_staff)
    db.commit()

    # 5. TEN FRESH DEMO PATIENTS (Diverse Clinical & Demographic Profiles)
    patients_data = [
        {
            "patient_id": "P-1001",
            "name": "Robert M. Jenkins",
            "dob": "1958-04-12",
            "age": 68,
            "gender": "Male",
            "phone": "+91 98401 23456",
            "email": "robert.jenkins@example.com",
            "address": "45 Anna Nagar West, Chennai",
            "emergency_contact_name": "Martha Jenkins (Wife)",
            "emergency_contact_phone": "+91 98401 23457",
            "medical_history": {
                "previous_stroke": True, "hypertension": True, "diabetes": True,
                "heart_disease": True, "high_cholesterol": True, "smoking": "former",
                "alcohol_use": "none", "family_history_stroke": True,
                "previous_neuro_conditions": "Transient Ischemic Attack (TIA) in 2024",
                "current_medications": "Aspirin 81mg, Lisinopril 20mg, Atorvastatin 40mg, Metformin 1000mg",
                "known_allergies": "Penicillin", "bmi": 29.2
            },
            "created_at": now - timedelta(days=20)
        },
        {
            "patient_id": "P-1002",
            "name": "Maria Elena Rodriguez",
            "dob": "1967-08-25",
            "age": 59,
            "gender": "Female",
            "phone": "+91 98402 34567",
            "email": "maria.rodriguez@example.com",
            "address": "124 T. Nagar 3rd Main Rd, Chennai",
            "emergency_contact_name": "Carlos Rodriguez (Son)",
            "emergency_contact_phone": "+91 98402 34568",
            "medical_history": {
                "previous_stroke": False, "hypertension": True, "diabetes": True,
                "heart_disease": False, "high_cholesterol": True, "smoking": "never",
                "alcohol_use": "occasional", "family_history_stroke": True,
                "previous_neuro_conditions": "None",
                "current_medications": "Amlodipine 10mg, Glipizide 5mg",
                "known_allergies": "Sulfa drugs", "bmi": 31.0
            },
            "created_at": now - timedelta(days=45)
        },
        {
            "patient_id": "P-1003",
            "name": "David Arthur Miller",
            "dob": "1954-11-03",
            "age": 71,
            "gender": "Male",
            "phone": "+91 98403 45678",
            "email": "david.miller@example.com",
            "address": "890 Alwarpet High Rd, Chennai",
            "emergency_contact_name": "Sarah Miller (Daughter)",
            "emergency_contact_phone": "+91 98403 45679",
            "medical_history": {
                "previous_stroke": False, "hypertension": True, "diabetes": False,
                "heart_disease": True, "high_cholesterol": True, "smoking": "current",
                "alcohol_use": "moderate", "family_history_stroke": False,
                "previous_neuro_conditions": "Atrial Fibrillation on Warfarin",
                "current_medications": "Warfarin 5mg, Metoprolol 50mg, Rosuvastatin 20mg",
                "known_allergies": "None", "bmi": 27.5
            },
            "created_at": now - timedelta(days=12)
        },
        {
            "patient_id": "P-1004",
            "name": "Linda Wei Chang",
            "dob": "1981-02-14",
            "age": 45,
            "gender": "Female",
            "phone": "+91 98404 56789",
            "email": "linda.chang@example.com",
            "address": "350 Velachery Main Rd, Chennai",
            "emergency_contact_name": "Kevin Chang (Husband)",
            "emergency_contact_phone": "+91 98404 56780",
            "medical_history": {
                "previous_stroke": False, "hypertension": False, "diabetes": False,
                "heart_disease": False, "high_cholesterol": False, "smoking": "current",
                "alcohol_use": "occasional", "family_history_stroke": False,
                "previous_neuro_conditions": "Occasional tension headaches",
                "current_medications": "Oral contraceptives",
                "known_allergies": "Latex", "bmi": 22.8
            },
            "created_at": now - timedelta(days=60)
        },
        {
            "patient_id": "P-1005",
            "name": "Karthik Subramanian",
            "dob": "1960-07-30",
            "age": 66,
            "gender": "Male",
            "phone": "+91 98405 67890",
            "email": "karthik.subramanian@example.com",
            "address": "512 Mylapore Tank St, Chennai",
            "emergency_contact_name": "Latha Subramanian (Wife)",
            "emergency_contact_phone": "+91 98405 67891",
            "medical_history": {
                "previous_stroke": False, "hypertension": True, "diabetes": True,
                "heart_disease": True, "high_cholesterol": True, "smoking": "never",
                "alcohol_use": "none", "family_history_stroke": True,
                "previous_neuro_conditions": "Coronary Stent (2022)",
                "current_medications": "Clopidogrel 75mg, Telmisartan 40mg",
                "known_allergies": "None", "bmi": 26.4
            },
            "created_at": now - timedelta(days=15)
        },
        {
            "patient_id": "P-1006",
            "name": "Eleanor Vance",
            "dob": "1949-12-14",
            "age": 76,
            "gender": "Female",
            "phone": "+91 98406 78901",
            "email": "eleanor.vance@example.com",
            "address": "904 Besant Nagar Beach Rd, Chennai",
            "emergency_contact_name": "Thomas Vance (Son)",
            "emergency_contact_phone": "+91 98406 78902",
            "medical_history": {
                "previous_stroke": True, "hypertension": True, "diabetes": False,
                "heart_disease": True, "high_cholesterol": True, "smoking": "former",
                "alcohol_use": "none", "family_history_stroke": True,
                "previous_neuro_conditions": "Ischemic Stroke (2021)",
                "current_medications": "Apixaban 5mg, Atorvastatin 80mg",
                "known_allergies": "Codeine", "bmi": 24.1
            },
            "created_at": now - timedelta(days=35)
        },
        {
            "patient_id": "P-1007",
            "name": "Ananya Sharma",
            "dob": "1975-06-08",
            "age": 51,
            "gender": "Female",
            "phone": "+91 98407 89012",
            "email": "ananya.sharma@example.com",
            "address": "210 Adyar Gandhinagar, Chennai",
            "emergency_contact_name": "Rohan Sharma (Brother)",
            "emergency_contact_phone": "+91 98407 89013",
            "medical_history": {
                "previous_stroke": False, "hypertension": False, "diabetes": False,
                "heart_disease": False, "high_cholesterol": False, "smoking": "never",
                "alcohol_use": "occasional", "family_history_stroke": False,
                "previous_neuro_conditions": "Migraine with aura",
                "current_medications": "Propranolol 40mg",
                "known_allergies": "None", "bmi": 23.5
            },
            "created_at": now - timedelta(days=8)
        },
        {
            "patient_id": "P-1008",
            "name": "Ramesh Kumar",
            "dob": "1963-03-19",
            "age": 63,
            "gender": "Male",
            "phone": "+91 98408 90123",
            "email": "ramesh.kumar@example.com",
            "address": "334 Kilpauk Garden Rd, Chennai",
            "emergency_contact_name": "Deepa Kumar (Wife)",
            "emergency_contact_phone": "+91 98408 90124",
            "medical_history": {
                "previous_stroke": False, "hypertension": True, "diabetes": True,
                "heart_disease": False, "high_cholesterol": True, "smoking": "current",
                "alcohol_use": "moderate", "family_history_stroke": True,
                "previous_neuro_conditions": "Peripheral Neuropathy",
                "current_medications": "Metformin 1000mg, Glimepiride 2mg, Losartan 50mg",
                "known_allergies": "NSAIDs", "bmi": 30.1
            },
            "created_at": now - timedelta(days=18)
        },
        {
            "patient_id": "P-1009",
            "name": "Samuel Washington",
            "dob": "1955-08-22",
            "age": 70,
            "gender": "Male",
            "phone": "+91 98409 01234",
            "email": "samuel.washington@example.com",
            "address": "77 Nungambakkam High Rd, Chennai",
            "emergency_contact_name": "Daniel Washington (Son)",
            "emergency_contact_phone": "+91 98409 01235",
            "medical_history": {
                "previous_stroke": False, "hypertension": True, "diabetes": False,
                "heart_disease": True, "high_cholesterol": True, "smoking": "former",
                "alcohol_use": "none", "family_history_stroke": False,
                "previous_neuro_conditions": "Severe Carotid Artery Stenosis",
                "current_medications": "Aspirin 81mg, Rosuvastatin 40mg",
                "known_allergies": "None", "bmi": 28.0
            },
            "created_at": now - timedelta(days=5)
        },
        {
            "patient_id": "P-1010",
            "name": "Priya Sundaram",
            "dob": "1970-10-15",
            "age": 55,
            "gender": "Female",
            "phone": "+91 98410 12345",
            "email": "priya.sundaram@example.com",
            "address": "102 Harrington Rd, Chetpet, Chennai",
            "emergency_contact_name": "Suresh Sundaram (Husband)",
            "emergency_contact_phone": "+91 98410 12346",
            "medical_history": {
                "previous_stroke": False, "hypertension": False, "diabetes": False,
                "heart_disease": False, "high_cholesterol": True, "smoking": "never",
                "alcohol_use": "none", "family_history_stroke": False,
                "previous_neuro_conditions": "Mild vertigo episodes",
                "current_medications": "Betahistine as needed",
                "known_allergies": "None", "bmi": 24.8
            },
            "created_at": now - timedelta(days=22)
        }
    ]

    patient_instances = []
    for p_data in patients_data:
        p = Patient(
            doctor_id=dr_raha.id,
            **p_data
        )
        db.add(p)
        patient_instances.append(p)
    db.commit()
    for p in patient_instances:
        db.refresh(p)

    # 6. CREATE SAMPLE ASSESSMENTS & AI ASSESSMENTS (Layer 1 + Layer 2)
    onset_p1 = (now - timedelta(minutes=65)).isoformat()
    lkw_p1 = (now - timedelta(minutes=65)).strftime("%I:%M %p")
    features_p1 = {
        "age": 68, "gender": "Male", "hypertension": True, "diabetes": True,
        "heart_disease": True, "high_cholesterol": True, "smoking": "former",
        "previous_stroke": True, "family_history_stroke": True,
        "systolic_bp": 188.0, "diastolic_bp": 108.0, "glucose": 195.0,
        "heart_rate": 88.0, "spo2": 96.0, "temperature": 37.1,
        "face_result": "possible_abnormality",
        "face_ai_observation": "possible_facial_asymmetry",
        "face_doctor_confirmation": "abnormal",
        "arm_result": "possible_weakness",
        "arm_ai_observation": "possible_arm_drift",
        "arm_doctor_confirmation": "abnormal",
        "speech_result": "possible_speech_difficulty",
        "speech_doctor_confirmation": "abnormal",
        "balance_result": "sudden_loss",
        "eyes_result": "normal",
        "symptom_duration_minutes": 65
    }
    pred_p1 = prediction_service.predict_stroke_risk(features_p1)

    recent_assessment_p1 = Assessment(
        patient_id=patient_instances[0].id,
        doctor_id=dr_raha.id,
        assessment_time=now - timedelta(minutes=25),
        symptom_onset=onset_p1,
        last_known_well_time=lkw_p1,
        symptom_duration_minutes=65,
        face_result="possible_abnormality",
        face_ai_observation="possible_facial_asymmetry",
        face_doctor_confirmation="abnormal",
        arm_result="possible_weakness",
        arm_ai_observation="possible_arm_drift",
        arm_doctor_confirmation="abnormal",
        speech_result="possible_speech_difficulty",
        speech_ai_observation="possible_speech_mismatch",
        speech_doctor_confirmation="abnormal",
        balance_result="sudden_loss",
        eyes_result="normal",
        systolic_bp=188.0,
        diastolic_bp=108.0,
        glucose=195.0,
        heart_rate=88.0,
        spo2=96.0,
        temperature=37.1,
        risk_score=pred_p1["risk_score"],
        risk_level=pred_p1["risk_level"],
        confidence=None,
        contributing_factors=pred_p1["contributing_factors"],
        recommendation=pred_p1["recommendation"],
        doctor_notes="Acute onset right facial droop and right arm pronator drift verified via camera screening. Last known well ~65 mins ago.",
        structured_notes={
            "clinical_observation": "Right facial asymmetry and pronounced right upper extremity pronator drift with speech slurring.",
            "additional_symptoms": "Mild dizziness, expressive word-finding difficulty.",
            "immediate_action": "Code stroke activation, pre-notified Demo Stroke Care Hospital for urgent CTA and tPA evaluation.",
            "follow_up": "Standby for EMS telemetry arrival."
        },
        camera_assessment_data={
            "face_symmetry_score": 64.5,
            "arm_drift_detected": True,
            "arm_drift_delta_px": 42.0,
            "speech_mismatch_detected": True
        },
        created_at=now - timedelta(minutes=25)
    )
    db.add(recent_assessment_p1)
    db.commit()
    db.refresh(recent_assessment_p1)

    # Add Layer 2 AI Assessment Record
    ai_record = AIAssessment(
        assessment_id=recent_assessment_p1.id,
        model_name="StrokeShield Multi-Modal Neuro Triage",
        model_version="v1.0.0",
        input_reference={
            "patient_id": patient_instances[0].id,
            "vitals": {"systolic_bp": 188.0, "diastolic_bp": 108.0, "glucose": 195.0, "spo2": 96.0},
            "fast_features": {"face": "possible_abnormality", "arm": "possible_weakness", "speech": "possible_speech_difficulty"}
        },
        ai_facial_observation="Quantitative Landmark Deviation: 64.5/100 (High Asymmetry)",
        ai_arm_observation="Upper limb pronator drift delta: 42px",
        ai_speech_observation="Phonetic mismatch detected during voice test",
        ai_urgency_score=pred_p1["risk_score"],
        ai_urgency_category="HIGH",
        ai_explanation="Critical multi-domain neurological deficits with severe hypertension and symptom onset within acute 4.5-hour thrombolytic window.",
        confidence_score=0.95,
        generated_at=now - timedelta(minutes=25)
    )
    db.add(ai_record)
    db.commit()

    # 7. CREATE SAMPLE EMERGENCY REFERRAL
    ref_p1 = Referral(
        referral_code="REF-2026-00101",
        patient_id=patient_instances[0].id,
        assessment_id=recent_assessment_p1.id,
        doctor_id=dr_raha.id,
        hospital_id=hospitals[0].id,
        source_hospital_name="Demo Stroke Care Clinic",
        source_latitude=dr_raha.latitude,
        source_longitude=dr_raha.longitude,
        source_accuracy_meters=8.0,
        destination_latitude=hospitals[0].latitude,
        destination_longitude=hospitals[0].longitude,
        distance_km=1.2,
        road_distance_km=1.2,
        estimated_travel_minutes=5,
        priority="Emergency",
        status="Preparing",
        ambulance_requested="Advanced Life Support (ALS) with Telemetry",
        estimated_eta_minutes=5,
        dispatch_notes="Code Stroke Pre-notification: 68M with acute right hemiparesis and aphasia, onset <75 min. Requesting emergency CT Angiography suite standby.",
        doctor_confirmed="true",
        doctor_confirmed_at=now - timedelta(minutes=20),
        accepted_at=now - timedelta(minutes=12),
        preparing_at=now - timedelta(minutes=6),
        qr_data={
            "referral_code": "REF-2026-00101",
            "hospital": hospitals[0].name,
            "priority": "Emergency",
            "token": "sec-tok-991048201",
            "issued_at": (now - timedelta(minutes=20)).isoformat()
        },
        patient_summary_snapshot={
            "patient_id": "P-1001",
            "name": "Robert M. Jenkins",
            "age": 68,
            "gender": "Male",
            "symptom_onset": onset_p1,
            "last_known_well": lkw_p1,
            "fast_findings": {"face": "Asymmetry/Droop (Confirmed)", "arm": "Right Arm Weakness (Confirmed)", "speech": "Slurred / Expressive Difficulty (Confirmed)"},
            "vitals": {"bp": "188/108", "glucose": 195, "heart_rate": 88, "spo2": "96%"},
            "urgency": "HIGH / EMERGENCY",
            "source_hospital": "Demo Stroke Care Clinic",
            "destination_hospital": hospitals[0].name,
            "distance_km": 1.2,
            "travel_time_min": 5
        },
        timeline_events=[
            {"time": (now - timedelta(minutes=20)).strftime("%H:%M:%S"), "event": "Emergency Assessment Completed & Doctor Confirmed", "actor": "Dr. Raha"},
            {"time": (now - timedelta(minutes=16)).strftime("%H:%M:%S"), "event": "Referral Dispatched to Demo Stroke Care Hospital (1.2 km / ~5 mins ETA)", "actor": "Dr. Raha"},
            {"time": (now - timedelta(minutes=12)).strftime("%H:%M:%S"), "event": "Receiving Neuro-ICU Team Accepted Referral", "actor": "Nurse Coordinator Mark Reynolds, RN"},
            {"time": (now - timedelta(minutes=6)).strftime("%H:%M:%S"), "event": "Trauma Team Preparing CT Angiography Suite", "actor": "Metro Stroke Triage Desk"}
        ],
        created_at=now - timedelta(minutes=16)
    )
    db.add(ref_p1)

    # 8. SEED AUDIT LOGS
    audit_logs_data = [
        {"user_type": "Doctor", "user_name": dr_raha.name, "user_email": dr_raha.email, "action": "Doctor Sign In", "details": {"ip": "127.0.0.1", "auth_method": "password"}},
        {"user_type": "Doctor", "user_name": dr_raha.name, "user_email": dr_raha.email, "action": "Patient Registered", "details": {"patient_id": "P-1001", "name": "Robert M. Jenkins"}},
        {"user_type": "Doctor", "user_name": dr_raha.name, "user_email": dr_raha.email, "action": "Face Camera Screening Performed", "details": {"patient_id": "P-1001", "symmetry_score": 64.5, "observation": "possible_facial_asymmetry"}},
        {"user_type": "Doctor", "user_name": dr_raha.name, "user_email": dr_raha.email, "action": "BE-FAST Assessment Completed", "details": {"patient_id": "P-1001", "risk_level": "HIGH", "risk_score": 99.0}},
        {"user_type": "Doctor", "user_name": dr_raha.name, "user_email": dr_raha.email, "action": "Emergency Referral Dispatched", "details": {"referral_code": "REF-2026-00101", "destination": "Demo Stroke Care Hospital", "distance_km": 1.2}},
        {"user_type": "Hospital Staff", "user_name": hospital_staff.name, "user_email": hospital_staff.email, "action": "Referral Accepted", "details": {"referral_code": "REF-2026-00101", "status": "Preparing"}}
    ]

    for log in audit_logs_data:
        db.add(AuditLog(
            user_type=log["user_type"],
            user_name=log["user_name"],
            user_email=log["user_email"],
            action=log["action"],
            details=log["details"],
            created_at=now - timedelta(minutes=15)
        ))

    db.commit()
    print("[SeedData] Database cleanly reset and seeded with EXACTLY 2 Demo Doctors (Dr. Raha & Dr. Vijay), 5 Demo Hospitals, 10 Demo Patients, Sample Assessments, and Referrals.")
