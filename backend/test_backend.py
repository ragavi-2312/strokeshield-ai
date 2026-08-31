import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.services.seed_data import seed_database

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_strokeshield.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_ai_generated_demo_doctor_login():
    # 1. Login as Dr. Raha
    resp_raha = client.post("/api/auth/login", json={"email": "raha@demo-strokeshield.com", "password": "Doctor@123"})
    assert resp_raha.status_code == 200
    doc_raha = resp_raha.json()["doctor"]
    assert doc_raha["name"] == "Dr. Raha"
    assert doc_raha["specialization"] == "Neurologist"
    assert doc_raha["phone"] == "+91 98765 43210"
    assert doc_raha["data_type"] == "DEMO"
    assert doc_raha["data_source"] == "AI_GENERATED"
    assert doc_raha["registration_number"] == "DEMO-REG-RAHA"

    # 2. Login as Dr. Vijay
    resp_vijay = client.post("/api/auth/login", json={"email": "vijay@demo-strokeshield.com", "password": "Doctor@123"})
    assert resp_vijay.status_code == 200
    doc_vijay = resp_vijay.json()["doctor"]
    assert doc_vijay["name"] == "Dr. Vijay"
    assert doc_vijay["specialization"] == "Emergency Medicine Specialist"
    assert doc_vijay["phone"] == "+91 87654 32109"
    assert doc_vijay["data_type"] == "DEMO"
    assert doc_vijay["data_source"] == "AI_GENERATED"
    assert doc_vijay["registration_number"] == "DEMO-REG-VIJAY"

def test_gps_hospital_discovery_and_ranking():
    login_resp = client.post("/api/auth/login", json={"email": "raha@demo-strokeshield.com", "password": "Doctor@123"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Search nearby stroke hospitals with GPS coordinates & CT filter
    resp = client.get("/api/hospitals/nearby?latitude=13.0827&longitude=80.2707&urgency=HIGH&require_ct=true", headers=headers)
    assert resp.status_code == 200
    hospitals = resp.json()
    assert len(hospitals) >= 3
    assert hospitals[0]["ct_scan_available"] is True
    assert hospitals[0]["estimated_distance_km"] >= 0

def test_emergency_referral_gps_route_workflow():
    login_resp = client.post("/api/auth/login", json={"email": "raha@demo-strokeshield.com", "password": "Doctor@123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch patient & assessment
    patients = client.get("/api/patients", headers=headers).json()
    assert len(patients) > 0
    p = patients[0]

    # Create new assessment
    a_resp = client.post("/api/assessments", json={
        "patient_id": p["id"],
        "symptom_onset": "2026-08-31T08:00:00",
        "last_known_well_time": "08:00 AM",
        "symptom_duration_minutes": 55,
        "face_result": "possible_abnormality",
        "face_ai_observation": "possible_facial_asymmetry",
        "face_doctor_confirmation": "abnormal",
        "arm_result": "possible_weakness",
        "arm_ai_observation": "possible_arm_drift",
        "arm_doctor_confirmation": "abnormal",
        "speech_result": "possible_speech_difficulty",
        "speech_doctor_confirmation": "abnormal",
        "systolic_bp": 185.0,
        "diastolic_bp": 105.0,
        "glucose": 190.0,
        "heart_rate": 84.0,
        "spo2": 97.0
    }, headers=headers)
    assert a_resp.status_code == 201
    assessment = a_resp.json()
    assert assessment["risk_level"] == "HIGH"

    # Fetch ranked hospitals
    hospitals = client.get("/api/hospitals/nearby?latitude=13.0827&longitude=80.2707", headers=headers).json()
    dest_hosp = hospitals[0]

    # Dispatch referral with GPS coordinates
    ref_resp = client.post("/api/referrals", json={
        "patient_id": p["id"],
        "assessment_id": assessment["id"],
        "hospital_id": dest_hosp["id"],
        "source_hospital_name": "Demo Stroke Care Hospital",
        "source_latitude": 13.0827,
        "source_longitude": 80.2707,
        "source_accuracy_meters": 8.0,
        "priority": "Emergency",
        "ambulance_requested": "Advanced Life Support (ALS) with Telemetry",
        "dispatch_notes": "Code Stroke test referral by Dr. Raha",
        "doctor_confirmed": True
    }, headers=headers)
    assert ref_resp.status_code == 201
    referral = ref_resp.json()
    assert referral["status"] == "Sent"
    assert referral["source_hospital_name"] == "Demo Stroke Care Hospital"
    assert referral["distance_km"] > 0

    # Fetch Route Navigation Details
    route_resp = client.get(f"/api/referrals/{referral['id']}/route", headers=headers)
    assert route_resp.status_code == 200
    route_data = route_resp.json()
    assert "https://www.google.com/maps/dir/" in route_data["navigation_url"]
    assert len(route_data["waypoints"]) >= 3
    assert route_data["straight_line_distance_km"] > 0
