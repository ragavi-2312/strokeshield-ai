from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.hospital import Hospital
from app.schemas.hospital import HospitalResponse, HospitalRecommendationResponse
from app.services.auth_service import get_current_user
from app.services.hospital_service import find_best_stroke_hospitals

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("", response_model=List[HospitalResponse])
def get_hospitals(
    db: Session = Depends(get_db),
    auth_data = Depends(get_current_user)
):
    hospitals = db.query(Hospital).all()
    return hospitals

@router.get("/nearby", response_model=List[HospitalResponse])
def get_nearby_stroke_hospitals(
    latitude: Optional[float] = Query(37.7749, description="Source GPS Latitude"),
    longitude: Optional[float] = Query(-122.4194, description="Source GPS Longitude"),
    urgency: Optional[str] = Query("HIGH", description="Patient Urgency: HIGH / MODERATE / LOW"),
    max_distance_km: Optional[float] = Query(35.0, description="Max search radius in km"),
    require_ct: Optional[bool] = Query(False, description="Filter for CT Scan availability"),
    require_mri: Optional[bool] = Query(False, description="Filter for MRI availability"),
    require_icu: Optional[bool] = Query(False, description="Filter for Neuro-ICU availability"),
    require_neuro: Optional[bool] = Query(False, description="Filter for Neurology department"),
    require_stroke: Optional[bool] = Query(False, description="Filter for dedicated Stroke Unit"),
    db: Session = Depends(get_db),
    auth_data = Depends(get_current_user)
):
    filters = {
        "require_ct": require_ct,
        "require_mri": require_mri,
        "require_icu": require_icu,
        "require_neuro": require_neuro,
        "require_stroke": require_stroke
    }
    
    ranked_hospitals = find_best_stroke_hospitals(
        db=db,
        source_lat=latitude,
        source_lon=longitude,
        patient_urgency=urgency,
        search_radius_km=max_distance_km,
        filters=filters
    )
    return ranked_hospitals

@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital_by_id(
    hospital_id: int,
    db: Session = Depends(get_db),
    auth_data = Depends(get_current_user)
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital
