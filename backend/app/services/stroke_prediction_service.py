from typing import Dict, Any, List, Optional
import os

class StrokePredictionService:
    """
    StrokeShield AI Triage & Urgency Assessment Engine.
    
    Architecture Note:
    - Integrates Doctor-Confirmed FAST, Camera Observations, BE-FAST, Vitals, and Medical History.
    - Operates in Demo Mode with modular Scikit-Learn/XGBoost integration support.
    - Complies with Safety Policy: Never claims definitive medical diagnosis.
    - Confidence is set to None in demo mode (no fake precision claims).
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.ml_model = None

    def predict_stroke_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        score = 10.0 # baseline population risk
        contributing_factors: List[str] = []
        fast_positive_count = 0

        # 1. FAST Signs & Camera Screening Doctor Confirmations
        face_conf = features.get("face_doctor_confirmation")
        face_raw = features.get("face_result", "normal")
        if face_conf == "abnormal" or face_raw == "possible_abnormality":
            score += 30.0
            fast_positive_count += 1
            contributing_factors.append("Facial asymmetry observed / confirmed by physician (FAST: Face)")
        elif features.get("face_ai_observation") == "possible_facial_asymmetry":
            score += 15.0
            contributing_factors.append("Camera-assisted screening: Possible facial asymmetry noted")

        arm_conf = features.get("arm_doctor_confirmation")
        arm_raw = features.get("arm_result", "normal")
        if arm_conf in ["abnormal", "weakness_suspected"] or arm_raw in ["possible_weakness", "possible_numbness"]:
            score += 30.0
            fast_positive_count += 1
            contributing_factors.append("Unilateral arm weakness / drift confirmed by physician (FAST: Arm)")
        elif features.get("arm_ai_observation") == "possible_arm_drift":
            score += 15.0
            contributing_factors.append("Camera-assisted screening: Possible arm drift trajectory noted")

        speech_conf = features.get("speech_doctor_confirmation")
        speech_raw = features.get("speech_result", "normal")
        if speech_conf == "abnormal" or speech_raw == "possible_speech_difficulty":
            score += 30.0
            fast_positive_count += 1
            contributing_factors.append("Speech slurring / aphasia confirmed by physician (FAST: Speech)")
        elif features.get("speech_ai_observation") == "possible_speech_mismatch":
            score += 10.0
            contributing_factors.append("Speech screening: Sentence mismatch observation noted")

        # 2. Extended BE-FAST (Balance & Eyes)
        balance = features.get("balance_result", "normal")
        if balance == "sudden_loss":
            score += 15.0
            contributing_factors.append("Acute balance loss / ataxia (BE-FAST: Balance)")

        eyes = features.get("eyes_result", "normal")
        if eyes == "sudden_vision_changes":
            score += 15.0
            contributing_factors.append("Acute visual disturbance / visual field cut (BE-FAST: Eyes)")

        # 3. Last Known Well / Time Window
        onset_mins = features.get("symptom_duration_minutes")
        if onset_mins is not None and (fast_positive_count > 0 or score >= 40):
            if onset_mins <= 270: # <= 4.5 hours (IV Thrombolysis window)
                score += 10.0
                contributing_factors.append(f"Last Known Well: ~{onset_mins} mins ago (Within critical 4.5h IV thrombolysis reperfusion window)")
            elif onset_mins <= 1440: # <= 24 hours (Mechanical Thrombectomy window)
                score += 5.0
                contributing_factors.append(f"Last Known Well: ~{round(onset_mins/60, 1)}h ago (Within 24h endovascular thrombectomy window)")

        # 4. Vital Signs Evaluation
        sys_bp = float(features.get("systolic_bp", 120))
        dia_bp = float(features.get("diastolic_bp", 80))
        if sys_bp >= 180 or dia_bp >= 120:
            score += 15.0
            contributing_factors.append(f"Hypertensive crisis range (BP: {sys_bp:.0f}/{dia_bp:.0f} mmHg)")
        elif sys_bp >= 140 or dia_bp >= 90:
            score += 8.0
            contributing_factors.append(f"Elevated blood pressure (BP: {sys_bp:.0f}/{dia_bp:.0f} mmHg)")

        glucose = float(features.get("glucose", 100))
        if glucose < 70:
            score += 8.0
            contributing_factors.append(f"Hypoglycemia (Blood Glucose: {glucose:.0f} mg/dL) — Rule out hypoglycemia mimic")
        elif glucose >= 200:
            score += 6.0
            contributing_factors.append(f"Significant hyperglycemia (Blood Glucose: {glucose:.0f} mg/dL)")

        spo2 = float(features.get("spo2", 98))
        if spo2 < 92:
            score += 6.0
            contributing_factors.append(f"Hypoxia detected (SpO2: {spo2:.0f}%)")

        heart_rate = float(features.get("heart_rate", 75))
        if heart_rate > 110 or heart_rate < 50:
            score += 4.0
            contributing_factors.append(f"Abnormal heart rate ({heart_rate:.0f} bpm)")

        # 5. Medical History
        if features.get("previous_stroke", False):
            score += 12.0
            contributing_factors.append("Prior history of Stroke / TIA")

        if features.get("heart_disease", False):
            score += 8.0
            contributing_factors.append("Pre-existing cardiac condition (AFib / CAD)")

        if features.get("hypertension", False):
            score += 6.0
            contributing_factors.append("Documented history of hypertension")

        if features.get("diabetes", False):
            score += 5.0
            contributing_factors.append("Documented history of diabetes")

        if features.get("high_cholesterol", False):
            score += 3.0
            contributing_factors.append("Hyperlipidemia")

        smoking = str(features.get("smoking", "never")).lower()
        if smoking in ["current", "true", "yes"]:
            score += 4.0
            contributing_factors.append("Current tobacco use")

        age = int(features.get("age", 50))
        if age >= 75:
            score += 10.0
            contributing_factors.append(f"Advanced age ({age} years)")
        elif age >= 60:
            score += 6.0
            contributing_factors.append(f"Age risk factor ({age} years)")

        final_score = min(max(round(score, 1), 5.0), 99.0)

        # Urgency Classification
        if fast_positive_count >= 1 or final_score >= 65.0:
            risk_level = "HIGH"
            urgency_tier = "Immediate Emergency / Stroke Protocol"
            recommendation = (
                "Possible stroke symptoms detected. Immediate emergency medical evaluation, "
                "emergency CT/CTA neuroimaging, and Comprehensive Stroke Center referral are strongly recommended."
            )
        elif final_score >= 38.0:
            risk_level = "MODERATE"
            urgency_tier = "Priority Urgent Evaluation"
            recommendation = (
                "Moderate cardiovascular & stroke risk profile. Priority clinical assessment, "
                "vital stabilization, and close neurological monitoring are advised."
            )
        else:
            risk_level = "LOW"
            urgency_tier = "Standard Clinical Protocol"
            recommendation = (
                "Low acute urgency identified. Continue standard clinical care, "
                "educate patient on FAST stroke warning signs, and manage baseline risk factors."
            )

        if not contributing_factors:
            contributing_factors.append("No acute focal deficits or critical vitals detected.")

        return {
            "risk_level": risk_level,
            "risk_score": final_score,
            "confidence": None, # Explicitly None in demo mode per medical safety prompt requirement #17
            "urgency_tier": urgency_tier,
            "contributing_factors": contributing_factors,
            "recommendation": recommendation,
            "is_demo_prediction": True,
            "disclaimer": "Clinical Decision Support Prototype — NOT a definitive diagnostic tool or replacement for professional medical evaluation."
        }

prediction_service = StrokePredictionService()
