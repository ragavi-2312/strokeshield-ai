from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class DoctorResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str = "DOCTOR"
    phone: Optional[str] = None
    hospital: Optional[str] = None
    hospital_address: Optional[str] = "Chennai, Tamil Nadu"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    specialization: Optional[str] = "Neurologist"
    experience_years: Optional[int] = 8
    location: Optional[str] = "Chennai, Tamil Nadu"
    registration_number: Optional[str] = "DEMO-REG"
    data_type: Optional[str] = "DEMO"
    data_source: Optional[str] = "AI_GENERATED"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class HospitalStaffResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str = "hospital_staff"
    phone: Optional[str] = None
    hospital_id: int
    hospital_name: Optional[str] = None
    data_type: Optional[str] = "DEMO"
    data_source: Optional[str] = "AI_GENERATED"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "doctor" # "doctor" | "hospital_staff"
    doctor: Optional[DoctorResponse] = None
    hospital_staff: Optional[HospitalStaffResponse] = None
