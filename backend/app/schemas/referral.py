from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.hospital import HospitalResponse

class ReferralCreate(BaseModel):
    patient_id: int
    assessment_id: int
    hospital_id: int
    source_hospital_name: Optional[str] = None
    source_latitude: Optional[float] = None
    source_longitude: Optional[float] = None
    source_accuracy_meters: Optional[float] = None
    source_timestamp: Optional[datetime] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    distance_km: Optional[float] = None
    road_distance_km: Optional[float] = None
    estimated_travel_minutes: Optional[int] = None
    priority: str = "Emergency" # "Emergency", "Urgent", "Standard"
    ambulance_requested: Optional[str] = "Advanced Life Support (ALS)"
    dispatch_notes: Optional[str] = None
    doctor_confirmed: Optional[bool] = True

class ReferralStatusUpdate(BaseModel):
    status: str # "Sent", "Accepted", "Preparing", "In Transit", "Patient Arrived", "Closed"
    note: Optional[str] = None

class ReferralResponse(BaseModel):
    id: int
    referral_code: Optional[str] = None
    patient_id: int
    assessment_id: int
    doctor_id: int
    hospital_id: int
    source_hospital_name: Optional[str] = None
    source_latitude: Optional[float] = None
    source_longitude: Optional[float] = None
    source_accuracy_meters: Optional[float] = None
    source_timestamp: Optional[datetime] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    distance_km: Optional[float] = None
    road_distance_km: Optional[float] = None
    estimated_travel_minutes: Optional[int] = None
    priority: str
    status: str
    ambulance_requested: Optional[str] = None
    estimated_eta_minutes: Optional[int] = 15
    dispatch_notes: Optional[str] = None
    doctor_confirmed: Optional[str] = "true"
    doctor_confirmed_at: Optional[datetime] = None
    qr_data: Dict[str, Any] = {}
    patient_summary_snapshot: Dict[str, Any] = {}
    timeline_events: List[Dict[str, Any]] = []
    created_at: datetime
    accepted_at: Optional[datetime] = None
    preparing_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    updated_at: datetime
    
    hospital: Optional[HospitalResponse] = None
    patient_name: Optional[str] = None
    patient_identifier: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ReferralRouteResponse(BaseModel):
    referral_id: int
    referral_code: str
    status: str
    source: Dict[str, Any] # {"name": "...", "latitude": 37.77, "longitude": -122.41, "accuracy": 10}
    destination: Dict[str, Any] # {"name": "...", "latitude": 37.78, "longitude": -122.42, "address": "..."}
    straight_line_distance_km: float
    road_distance_km: Optional[float] = None
    estimated_travel_minutes: Optional[int] = None
    navigation_url: str
    waypoints: List[List[float]]
    hospital_capabilities: Dict[str, bool]
