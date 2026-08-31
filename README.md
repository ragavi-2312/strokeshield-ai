# 🛡️ StrokeShield AI — AI-Powered Stroke Early Triage & Emergency Referral System

> **Hackathon-Ready Clinical Decision-Support Prototype**  
> *Empowering doctors with evidence-based FAST/BE-FAST assessments, AI-assisted stroke urgency stratification, standardized EMS handover summaries, and rapid speciality hospital referrals.*

---

> [!IMPORTANT]
> ### ⚠️ Mandatory Medical Disclaimer
> **StrokeShield AI is a clinical decision-support and early-triage prototype, NOT a replacement for qualified medical diagnosis.**  
> - The application **never** claims "Stroke Confirmed" based on model predictions alone.
> - Diagnostic terminology strictly uses phrases like: *"Possible stroke symptoms detected — urgent medical evaluation recommended"*, *"High Urgency"*, and *"Clinical Assessment Required"*.
> - Final clinical diagnosis requires certified physician neurological examination and emergency neuroimaging (CT / CTA / MRI).

---

## 🌟 1. Project Objective & Core USP

The fundamental innovation of **StrokeShield AI** is **not simply predicting stroke risk**, but connecting the entire acute time-critical clinical pathway:

```
    Doctor Signs In
          ↓
  Patient Longitudinal Profile (P-1001)
          ↓
  Structured FAST & BE-FAST Assessment
          ↓
  Hemodynamic Vitals & Risk Factor Inputs
          ↓
  AI-Assisted Urgency Stratification & Scoring
          ↓
  Standardized EMS Emergency Summary (1-Click Print/Export)
          ↓
  Nearby Stroke-Capable Speciality Hospitals (Distance & Travel Time)
          ↓
  Emergency Referral & Ambulance Dispatch (Live Handover Tracking)
          ↓
  Longitudinal Patient Record & Time-Series Vitals History
```

---

## 🚀 2. Key Features

### 👨‍⚕️ Doctor-Centric Authentication & Portal
- Secure physician login (`dr.sarah@strokeshield.ai` / `Doctor@123`).
- One-click **"Login as Demo Doctor"** for seamless hackathon judge presentations.
- Forgot Password recovery simulation.
- Doctor profile with clinical affiliation, specialization, and session encryption.

### 📋 Patient Management & Longitudinal Timelines
- Automated Patient ID generation (`P-1001`, `P-1002`, etc.) and age calculation from DOB.
- Detailed medical history: Prior Stroke/TIA, Hypertension, Diabetes, Heart Disease/AFib, High Cholesterol, Smoking status, Current Medications, Allergies, BMI.
- **Assessment Immutability**: Historical patient assessments are never overwritten; every assessment generates a new immutable clinical entry.
- Visual **Longitudinal Timeline** recording registration, assessments, urgency spikes, and hospital referrals.
- Interactive **Vitals Trend Charts** using Recharts (Systolic/Diastolic BP, Blood Glucose, Heart Rate, SpO2, and Urgency Scores over time).

### ⚡ FAST & BE-FAST Stroke Triage Wizard
- **F — Face**: Facial asymmetry / droop detection.
- **A — Arms**: Arm drift, unilateral weakness, or numbness detection.
- **S — Speech**: Slurring, aphasia, or speech comprehension difficulty.
- **T — Time**: Onset time picker with **live elapsed duration calculation** (highlighting critical `< 4.5h` tPA thrombolytic window and `< 24h` endovascular thrombectomy window).
- **BE-FAST Extension**: Sudden loss of balance (ataxia) and sudden vision changes (hemianopia).
- **Vitals Validation**: Numeric bounds checking with instant clinical alerts for Hypertensive Crisis (BP ≥ 180/120), Hypoglycemia (< 70 mg/dL), and Hypoxia (SpO2 < 92%).

### 🤖 AI/ML-Ready Prediction Architecture (`stroke_prediction_service`)
- Modular architecture accepting structured patient features.
- Categorizes patients into **LOW RISK**, **MODERATE RISK**, and **HIGH URGENCY / EMERGENCY**.
- Quantified Urgency Score (`0-100`) and confidence metric.
- Transparent contributing clinical factors checklist explaining the urgency rationale.
- Modular plug-and-play interface (`predict_stroke_risk`) ready to swap in future Scikit-learn/XGBoost `model.pkl` artifacts.

### 🏥 Emergency Summary & Speciality Hospital Referral
- Standardized **Emergency Patient Summary** formatted for EMS and receiving neurologists (Print, Copy, and Export).
- **Nearby Stroke-Capable Hospitals Directory** featuring facility capabilities (Comprehensive Stroke Center, Thrombectomy Ready, Primary Stroke Center), travel distance (km), ETA (mins), emergency hotline, and Google Maps routing.
- **Referral Workflow**: Select priority (*Emergency* vs *Urgent*), ambulance protocol (*ALS with Telemetry*, *Mobile ICU*), dispatch notes, and live status tracking (`Created` → `Sent` → `Acknowledged` → `In Transit` → `Arrived` → `Closed`).

### 📄 Clinical Reports & Hackathon Presentation Tour
- Print-ready and downloadable clinical assessment reports.
- Built-in interactive **Hackathon Demonstration Tour** with 1-click test scenarios (Acute Stroke Emergency, Moderate Risk Followup, Low Risk Screening).

---

## 🛠️ 3. Technology Stack

- **Backend**: Python, FastAPI, SQLAlchemy ORM, SQLite database, Pydantic V2, Uvicorn, Passlib / PBKDF2 hashing, Python-JOSE (JWT).
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router DOM.
- **ML Layer**: Python service abstraction with baseline rule-based clinical scoring engine + dedicated `/backend/app/ml/` integration pipeline.

---

## 📁 4. Project Directory Structure

```
StrokeShield AI/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app with CORS & lifespan initialization
│   │   ├── config.py                   # Application settings & credentials
│   │   ├── database.py                 # SQLite SQLAlchemy engine & sessionmaker
│   │   ├── models/                     # Database ORM models
│   │   │   ├── doctor.py
│   │   │   ├── patient.py
│   │   │   ├── assessment.py
│   │   │   ├── hospital.py
│   │   │   └── referral.py
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   │   ├── auth.py
│   │   │   ├── patient.py
│   │   │   ├── assessment.py
│   │   │   ├── hospital.py
│   │   │   ├── referral.py
│   │   │   └── dashboard.py
│   │   ├── services/                   # Business logic & ML prediction engine
│   │   │   ├── auth_service.py         # JWT & password hashing
│   │   │   ├── stroke_prediction_service.py # FAST + vitals triage engine
│   │   │   └── seed_data.py            # Synthetic demo dataset initializer
│   │   ├── routers/                    # REST API endpoints
│   │   │   ├── auth.py                 # /auth/login, /auth/me, /auth/forgot-password
│   │   │   ├── patients.py             # /patients CRUD, search, timeline, vitals
│   │   │   ├── assessments.py          # /assessments, emergency-summary, reports
│   │   │   ├── predict.py              # /predict-risk
│   │   │   ├── hospitals.py            # /hospitals/nearby
│   │   │   ├── referrals.py            # /referrals status pipeline
│   │   │   └── dashboard.py            # /dashboard/statistics
│   │   └── ml/                         # Future ML Pipeline
│   │       ├── README.md               # Architecture & metric guidelines (Recall focus)
│   │       ├── dataset/README.md       # Expected CSV schema documentation
│   │       └── train_pipeline_stub.py  # Model training script stub
│   ├── test_backend.py                 # Automated pytest test suite
│   ├── requirements.txt
│   └── run.py                          # Server launcher
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts               # Authenticated API client
│   │   ├── context/AuthContext.tsx     # Auth state provider
│   │   ├── types/index.ts              # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── common/                 # Navbar, Sidebar, Badges, Disclaimers, Demo Modal
│   │   │   ├── patient/                # PatientVitalsChart, PatientTimeline, AddPatientModal
│   │   │   ├── referral/               # EmergencySummaryModal, ReferralWorkflowModal
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PatientsPage.tsx
│   │   │   ├── PatientDetailPage.tsx
│   │   │   ├── NewAssessmentPage.tsx
│   │   │   ├── AssessmentResultPage.tsx
│   │   │   ├── EmergencyCasesPage.tsx
│   │   │   ├── HospitalsPage.tsx
│   │   │   ├── ReferralsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── App.tsx                     # React Router & protected routes
│   │   ├── main.tsx
│   │   └── index.css                   # Tailwind directives & print styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## ⚡ 5. Setup & Running Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
1. Open a terminal in the project directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the automated backend test suite:
   ```bash
   python -m pytest test_backend.py -v
   ```
4. Start the FastAPI backend server:
   ```bash
   python run.py
   ```
   *The backend will automatically create SQLite tables and seed realistic synthetic patients and stroke hospitals.*
   *API documentation will be available at `http://localhost:8000/docs`.*

### Frontend Setup
1. Open a second terminal:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

## 🧪 6. Hackathon Judge Demonstration Flow

Follow this step-by-step presentation scenario:

1. **Doctor Login**:
   - Navigate to the login screen and click **"Login as Demo Doctor"** (`dr.sarah@strokeshield.ai`).
2. **Dashboard Overview**:
   - Review the clinical metrics cards and active **Emergency Stroke Alerts banner**.
3. **Register New Patient**:
   - Click **"Register New Patient"** → enter demographics (ID `P-1007` generated automatically, age auto-calculated).
4. **Structured FAST Assessment**:
   - Click **"New Stroke Assessment"** (or use the *"Fill Demo Acute Stroke Case"* shortcut button).
   - Review the live **Elapsed Duration calculator** (< 4.5h tPA window).
   - Enter vitals (BP 185/105 mmHg) and note the real-time clinical warning banners.
5. **AI Urgency Result**:
   - Click **"Assess Stroke Urgency & Triage"** → view the quantified **HIGH URGENCY (84/100)** gauge, clinical contributing factors, and decision-support guidance.
6. **Generate Emergency Summary**:
   - Click **"Emergency Summary"** to view the standardized EMS handover report with print/copy options.
7. **Initiate Speciality Referral**:
   - Click **"Initiate Referral"** → select *Metro Comprehensive Stroke Center (1.4 km, 6 mins ETA)* → Dispatch.
8. **Track Referral & Longitudinal History**:
   - Navigate to **"Referrals & Dispatch"** to advance the handover status (*Sent* → *Acknowledged* → *In Transit* → *Arrived*).
   - Open the patient's profile to view the updated **Interactive Vitals Trend Chart** and **Longitudinal Timeline**.

---

## 🧠 7. Future Real-World ML Integration Pipeline

> **Real-world clinical dataset integration is pending.** The current prototype utilizes an evidence-based clinical triage engine and provides a clean modular architecture for future trained models.

### Planned ML Workflow:
1. Ingest clinical stroke dataset into `/backend/app/ml/dataset/stroke_data.csv`.
2. Execute preprocessing, class balancing (SMOTE / scale_pos_weight), and feature engineering.
3. Compare Logistic Regression, Random Forest, and XGBoost classifiers.
4. Optimize for **High Sensitivity / Recall (≥ 95%)** to minimize dangerous false negatives.
5. Export pipeline artifact to `/backend/app/ml/model.pkl`, which `StrokePredictionService` automatically loads on startup.

---

## 🔒 8. Security & Data Protection
- Role-based doctor authorization with JWT tokens.
- Secure password hashing using standard PBKDF2-HMAC-SHA256 with cryptographic salting.
- Sensitive medical records isolated from public URLs.
- Comprehensive input bounds validation to prevent medical data corruption.
- All pre-seeded data consists entirely of synthetic clinical scenarios.
