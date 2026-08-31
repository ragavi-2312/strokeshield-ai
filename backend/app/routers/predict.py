from fastapi import APIRouter, Depends
from app.schemas.assessment import PredictRequest, PredictResponse
from app.services.stroke_prediction_service import prediction_service
from app.services.auth_service import get_current_doctor
from app.models.doctor import Doctor

router = APIRouter(prefix="/predict-risk", tags=["Prediction"])

@router.post("", response_model=PredictResponse)
def predict_stroke_urgency(
    payload: PredictRequest,
    current_doctor: Doctor = Depends(get_current_doctor)
):
    features = payload.model_dump()
    result = prediction_service.predict_stroke_risk(features)
    return result
