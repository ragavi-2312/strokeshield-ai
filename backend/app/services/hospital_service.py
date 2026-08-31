import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.hospital import Hospital

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def estimate_travel_time_min(distance_km: float) -> int:
    """Estimate emergency ambulance transit time in urban/suburban traffic."""
    # Assuming average emergency transit speed of 32 km/h + 2 min dispatch buffer
    travel_time = (distance_km / 32.0) * 60.0 + 2.0
    return max(3, int(round(travel_time)))

def find_best_stroke_hospitals(
    db: Session,
    source_lat: float,
    source_lon: float,
    patient_urgency: str = "HIGH",
    search_radius_km: float = 35.0,
    filters: Optional[Dict[str, bool]] = None
) -> List[Dict[str, Any]]:
    """
    Smart Stroke Hospital Discovery & Capability Ranking Algorithm.
    Prioritizes stroke/neurology capabilities, 24/7 emergency readiness,
    and diagnostic capabilities (CT/MRI/ICU) alongside GPS distance and travel time.
    """
    hospitals = db.query(Hospital).all()
    ranked_list = []
    
    filters = filters or {}
    require_ct = filters.get("require_ct", False)
    require_mri = filters.get("require_mri", False)
    require_icu = filters.get("require_icu", False)
    require_neuro = filters.get("require_neuro", False)
    require_stroke = filters.get("require_stroke", False)

    for h in hospitals:
        # Check active capability filters
        if require_ct and not h.ct_scan_available: continue
        if require_mri and not h.mri_available: continue
        if require_icu and not h.icu_available: continue
        if require_neuro and not h.neurology_available: continue
        if require_stroke and not h.stroke_care_available: continue

        dist_km = haversine_distance_km(source_lat, source_lon, h.latitude, h.longitude)
        if dist_km > search_radius_km:
            continue

        eta_min = estimate_travel_time_min(dist_km)

        # Smart Clinical Suitability Scoring
        score = 0.0

        # 1. Stroke Care & Capability
        if "Comprehensive" in h.stroke_capability:
            score += 50.0
        elif "Thrombectomy" in h.stroke_capability:
            score += 40.0
        elif "Primary" in h.stroke_capability:
            score += 30.0
        else:
            score += 15.0

        if h.stroke_care_available: score += 20.0
        if h.neurology_available: score += 20.0
        if h.emergency_available or h.emergency_department: score += 15.0
        if h.ct_scan_available: score += 12.0
        if h.mri_available: score += 8.0
        if h.icu_available: score += 8.0

        # Proximity weight: Deduct 1.5 points per km distance
        score -= dist_km * 1.5

        # If patient urgency is HIGH, penalize lack of Comprehensive/Thrombectomy capabilities
        if patient_urgency == "HIGH" and "Comprehensive" not in h.stroke_capability and "Thrombectomy" not in h.stroke_capability:
            score -= 15.0

        ranked_list.append({
            "hospital": h,
            "distance_km": dist_km,
            "estimated_travel_minutes": eta_min,
            "ranking_score": round(score, 1)
        })

    # Sort descending by clinical ranking score
    ranked_list.sort(key=lambda x: x["ranking_score"], reverse=True)

    result = []
    for item in ranked_list:
        h = item["hospital"]
        result.append({
            "id": h.id,
            "name": h.name,
            "address": h.address,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "phone": h.phone,
            "emergency_phone": h.emergency_phone or h.phone,
            "stroke_capability": h.stroke_capability,
            "neurology_available": h.neurology_available,
            "stroke_care_available": h.stroke_care_available,
            "emergency_department": h.emergency_department,
            "icu_available": h.icu_available,
            "ct_scan_available": h.ct_scan_available,
            "mri_available": h.mri_available,
            "operating_hours": h.operating_hours,
            "emergency_available": h.emergency_available,
            "verification_status": h.verification_status,
            "specialties": h.specialties or [],
            "estimated_distance_km": item["distance_km"],
            "estimated_travel_time_min": item["estimated_travel_minutes"],
            "ranking_score": item["ranking_score"]
        })

    return result
