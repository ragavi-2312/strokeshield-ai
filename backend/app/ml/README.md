# StrokeShield AI — Machine Learning Architecture & Future Pipeline

> [!IMPORTANT]
> **Dataset Status**: Real-world dataset integration is currently pending. The current triage layer uses a modular, clinically-grounded decision support ruleset and urgency stratifier. **Do not claim model clinical validation or definitive diagnostic accuracy** until validated on real clinical datasets.

---

## 1. Architecture Overview

StrokeShield AI is designed with clean decoupling between the clinical triage application and the predictive ML models.

```
Incoming Patient Features (FAST + Vitals + History)
                    ↓
   FastAPI `/predict-risk` Endpoint
                    ↓
  `StrokePredictionService` (Singleton)
          │                   │
  [Baseline Clinical]   [Trained ML Pipeline: `model.pkl`]
   Decision Rules        (RandomForest / XGBoost / LogisticRegression)
          │                   │
          └─────────┬─────────┘
                    ↓
      Urgency Output (Score, Tier, Rationale)
```

---

## 2. Planned ML Pipeline Workflow

When a verified clinical stroke dataset (e.g., Kaggle Stroke Prediction Dataset, PhysioNet, or institutional EHR data) is provided:

1. **Data Ingestion**: Place raw CSV/Parquet into `/backend/app/ml/dataset/stroke_data.csv`.
2. **Preprocessing**:
   - Impute missing BMI / glucose using iterative/median imputer.
   - Encode categorical features (`gender`, `smoking_status`, `work_type`, `ever_married`).
   - One-hot encode FAST findings (`face`, `arm`, `speech`).
   - Feature scale numerical variables (`age`, `systolic_bp`, `glucose`, `bmi`).
3. **Class Imbalance Handling**:
   - Stroke events typically constitute < 5% of positive classes in tabular populations.
   - Use **SMOTE** (Synthetic Minority Over-sampling Technique) or cost-sensitive learning (`scale_pos_weight` in XGBoost).
4. **Model Training & Comparison**:
   - Baseline: Logistic Regression with L2 Regularization.
   - Ensemble 1: Random Forest Classifier.
   - Ensemble 2: XGBoost / LightGBM Classifier.
   - Neural Net: Multi-Layer Perceptron (MLP).
5. **Evaluation Metrics (Recall / Sensitivity Priority)**:
   - In emergency stroke triage, **False Negatives (missed strokes) carry severe morbidity/mortality risks**.
   - Primary metric: **Recall (Sensitivity) >= 95%** at target operating threshold.
   - Secondary metrics: ROC-AUC, PR-AUC, F1-score, Specificity.
6. **Model Export**:
   - Save trained scikit-learn/joblib pipeline to `backend/app/ml/model.pkl`.
   - `StrokePredictionService` will automatically detect and load `model.pkl` on startup.
