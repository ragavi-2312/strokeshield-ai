from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class HospitalBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    phone: str
    emergency_phone: Optional[str] = None
    stroke_capability: str
    neurology_available: bool = True
    stroke_care_available: bool = True
    emergency_department: bool = True
    icu_available: bool = True
    ct_scan_available: bool = True
    mri_available: bool = True
    operating_hours: str = "24/7 Emergency Care"
    emergency_available: bool = True
    verification_status: str = "DEMO"
    specialties: List[str] = []
    estimated_distance_km: float = 5.0
    estimated_travel_time_min: int = 15

class HospitalResponse(HospitalBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class HospitalRecommendationResponse(BaseModel):
    hospitals: List[HospitalResponse]
    source_location: dict
    search_radius_km: float
    total_found: int
    disclaimer: str = "DEMO HOSPITAL DATA — Real-time facility availability is simulated for demonstration."
