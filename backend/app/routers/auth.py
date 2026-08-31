from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.doctor import Doctor
from app.models.hospital_staff import HospitalStaff
from app.schemas.auth import (
    LoginRequest, ForgotPasswordRequest, TokenResponse, DoctorResponse, HospitalStaffResponse
)
from app.services.auth_service import (
    verify_password, create_access_token, get_current_user, log_audit_event
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_doctor_response(doctor: Doctor) -> DoctorResponse:
    return DoctorResponse(
        id=doctor.id,
        name=doctor.name,
        email=doctor.email,
        role=doctor.role or "DOCTOR",
        phone=doctor.phone or "+91 98765 43210",
        hospital=doctor.hospital,
        hospital_address=doctor.hospital_address or "Chennai, Tamil Nadu",
        latitude=doctor.latitude or 13.0827,
        longitude=doctor.longitude or 80.2707,
        specialization=doctor.specialization or "Neurologist",
        experience_years=doctor.experience_years or 8,
        location=doctor.location or "Chennai, Tamil Nadu",
        registration_number=doctor.registration_number or "DEMO-REG",
        data_type=doctor.data_type or "DEMO",
        data_source=doctor.data_source or "AI_GENERATED",
        created_at=doctor.created_at
    )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email_clean = request.email.lower().strip()
    
    # 1. Try Doctor Login
    doctor = db.query(Doctor).filter(Doctor.email == email_clean).first()
    if doctor and verify_password(request.password, doctor.hashed_password):
        access_token = create_access_token(data={"sub": str(doctor.id), "role": "doctor", "email": doctor.email})
        log_audit_event(db, "Doctor", doctor.name, doctor.email, "Doctor Sign In", {"role": "doctor", "email": doctor.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": "doctor",
            "doctor": format_doctor_response(doctor),
            "hospital_staff": None
        }

    # 2. Try Hospital Staff Login
    staff = db.query(HospitalStaff).filter(HospitalStaff.email == email_clean).first()
    if staff and verify_password(request.password, staff.hashed_password):
        access_token = create_access_token(data={"sub": str(staff.id), "role": "hospital_staff", "email": staff.email})
        hosp_name = staff.hospital.name if staff.hospital else "Speciality Stroke Center"
        log_audit_event(db, "Hospital Staff", staff.name, staff.email, "Hospital Staff Sign In", {"hospital_id": staff.hospital_id})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": "hospital_staff",
            "doctor": None,
            "hospital_staff": HospitalStaffResponse(
                id=staff.id,
                name=staff.name,
                email=staff.email,
                role="hospital_staff",
                phone=staff.phone or "+91 91100 12345",
                hospital_id=staff.hospital_id,
                hospital_name=hosp_name,
                data_type="DEMO",
                data_source="AI_GENERATED",
                created_at=staff.created_at
            )
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Use raha@demo-strokeshield.com or vijay@demo-strokeshield.com (Password: Doctor@123).",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.get("/me")
def get_current_user_profile(auth_data = Depends(get_current_user)):
    user = auth_data["user"]
    role = auth_data["role"]
    if role == "hospital_staff":
        hosp_name = user.hospital.name if user.hospital else "Speciality Stroke Center"
        return {
            "role": "hospital_staff",
            "hospital_staff": HospitalStaffResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role="hospital_staff",
                phone=user.phone or "+91 91100 12345",
                hospital_id=user.hospital_id,
                hospital_name=hosp_name,
                data_type="DEMO",
                data_source="AI_GENERATED",
                created_at=user.created_at
            )
        }
    else:
        return {
            "role": "doctor",
            "doctor": format_doctor_response(user)
        }

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return {
        "message": f"Password reset instructions have been dispatched to {request.email}.",
        "demo_hint": "Demo Doctor: raha@demo-strokeshield.com / Doctor@123 | Dr. Vijay: vijay@demo-strokeshield.com / Doctor@123"
    }
