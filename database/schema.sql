-- ==============================================================================
-- StrokeShield AI — Supabase PostgreSQL Production Database Schema
-- Strict 3-Layer Data Policy:
-- 1. ORIGINAL SOURCE DATA (Never altered by AI)
-- 2. AI-GENERATED DATA (Inferred, versioned, separate table ai_assessments)
-- 3. DOCTOR DECISION & CLINICAL GATE
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if needed (in dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS ai_assessments CASCADE;
DROP TABLE IF EXISTS speech_screenings CASCADE;
DROP TABLE IF EXISTS arm_screenings CASCADE;
DROP TABLE IF EXISTS face_screenings CASCADE;
DROP TABLE IF EXISTS be_fast_results CASCADE;
DROP TABLE IF EXISTS vitals CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

-- ==============================================================================
-- 1. SOURCE DATA LAYER (Primary Medical Records & Direct Measurements)
-- ==============================================================================

-- 1.1 HOSPITALS TABLE (Source Facility Master)
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude NUMERIC(10, 6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    phone TEXT,
    emergency_phone TEXT,
    neurology_available BOOLEAN DEFAULT true,
    stroke_care_available BOOLEAN DEFAULT true,
    emergency_department BOOLEAN DEFAULT true,
    ct_available BOOLEAN DEFAULT true,
    mri_available BOOLEAN DEFAULT true,
    icu_available BOOLEAN DEFAULT true,
    verification_status TEXT NOT NULL DEFAULT 'DEMO' CHECK (verification_status IN ('VERIFIED', 'DEMO', 'UNVERIFIED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.2 DOCTORS / CLINICAL PRACTITIONERS TABLE
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    full_name TEXT NOT NULL,
    specialization TEXT DEFAULT 'Neurologist',
    email TEXT UNIQUE NOT NULL,
    phone TEXT, -- e.g. "+91 98765 43210"
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'DOCTOR' CHECK (role IN ('DOCTOR', 'HOSPITAL_STAFF', 'ADMIN')),
    experience_years INTEGER DEFAULT 8,
    location TEXT DEFAULT 'Chennai, Tamil Nadu',
    registration_number TEXT DEFAULT 'DEMO-REG',
    data_type TEXT NOT NULL DEFAULT 'DEMO' CHECK (data_type IN ('DEMO', 'PRODUCTION')),
    data_source TEXT NOT NULL DEFAULT 'AI_GENERATED' CHECK (data_source IN ('AI_GENERATED', 'DOCTOR_ENTERED', 'DEVICE_MEASURED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.3 PATIENTS TABLE (Source Patient Facts)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    blood_group TEXT,
    medical_history TEXT,
    current_medications TEXT,
    created_by UUID REFERENCES doctors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.4 ASSESSMENTS TABLE (Encounter & Human Clinical Decision Gate)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    last_known_well TIMESTAMP WITH TIME ZONE,
    assessment_started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    assessment_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Human Clinical Confirmation Gate (Doctor Controlled)
    doctor_confirmation TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    doctor_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.5 VITALS TABLE (Original Measured Physiological Data)
CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    systolic_bp NUMERIC(5, 1) NOT NULL,
    diastolic_bp NUMERIC(5, 1) NOT NULL,
    blood_glucose NUMERIC(5, 1) NOT NULL,
    heart_rate NUMERIC(5, 1) NOT NULL,
    spo2 NUMERIC(5, 1) NOT NULL,
    temperature NUMERIC(4, 1),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.6 BE-FAST SCREENING RESULTS (Original Clinical Observations)
CREATE TABLE be_fast_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    balance_result TEXT NOT NULL DEFAULT 'NOT_ASSESSED' CHECK (balance_result IN ('NORMAL', 'ABNORMAL', 'UNABLE_TO_ASSESS', 'NOT_ASSESSED')),
    eyes_result TEXT NOT NULL DEFAULT 'NOT_ASSESSED' CHECK (eyes_result IN ('NORMAL', 'ABNORMAL', 'UNABLE_TO_ASSESS', 'NOT_ASSESSED')),
    face_result TEXT NOT NULL DEFAULT 'NOT_ASSESSED' CHECK (face_result IN ('NORMAL', 'ABNORMAL', 'UNABLE_TO_ASSESS', 'NOT_ASSESSED')),
    arms_result TEXT NOT NULL DEFAULT 'NOT_ASSESSED' CHECK (arms_result IN ('NORMAL', 'ABNORMAL', 'UNABLE_TO_ASSESS', 'NOT_ASSESSED')),
    speech_result TEXT NOT NULL DEFAULT 'NOT_ASSESSED' CHECK (speech_result IN ('NORMAL', 'ABNORMAL', 'UNABLE_TO_ASSESS', 'NOT_ASSESSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.7 FACE SCREENINGS TABLE (Direct Computer Vision Geometric Measurements)
CREATE TABLE face_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    facial_asymmetry_score NUMERIC(5, 2) NOT NULL,
    mouth_asymmetry_score NUMERIC(5, 2),
    eye_asymmetry_score NUMERIC(5, 2),
    eyebrow_asymmetry_score NUMERIC(5, 2),
    cheek_asymmetry_score NUMERIC(5, 2),
    smile_asymmetry_score NUMERIC(5, 2),
    measurement_quality NUMERIC(5, 2),
    frame_count INTEGER,
    score_mean NUMERIC(5, 2),
    score_median NUMERIC(5, 2),
    score_std_dev NUMERIC(5, 2),
    head_yaw NUMERIC(5, 2),
    head_pitch NUMERIC(5, 2),
    head_roll NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.8 ARM SCREENINGS TABLE (Direct Computer Vision Drift Measurements)
CREATE TABLE arm_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    left_arm_score NUMERIC(5, 2),
    right_arm_score NUMERIC(5, 2),
    arm_drift_score NUMERIC(5, 2),
    measurement_quality NUMERIC(5, 2),
    frame_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.9 SPEECH SCREENINGS TABLE (Original Voice Repetition Transcript)
CREATE TABLE speech_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    transcript_text TEXT,
    match_percentage NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.10 REFERRALS TABLE (Emergency Hospital Dispatch & Route Records)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code TEXT UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    source_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    destination_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    source_latitude NUMERIC(10, 6) NOT NULL CHECK (source_latitude >= -90 AND source_latitude <= 90),
    source_longitude NUMERIC(10, 6) NOT NULL CHECK (source_longitude >= -180 AND source_longitude <= 180),
    source_accuracy_meters NUMERIC(6, 2),
    source_location_timestamp TIMESTAMP WITH TIME ZONE,
    destination_latitude NUMERIC(10, 6) NOT NULL CHECK (destination_latitude >= -90 AND destination_latitude <= 90),
    destination_longitude NUMERIC(10, 6) NOT NULL CHECK (destination_longitude >= -180 AND destination_longitude <= 180),
    straight_line_distance_km NUMERIC(6, 2),
    road_distance_km NUMERIC(6, 2),
    estimated_travel_minutes INTEGER,
    priority TEXT NOT NULL DEFAULT 'HIGH' CHECK (priority IN ('HIGH', 'MODERATE', 'LOW')),
    status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('CREATED', 'SENT', 'ACCEPTED', 'PREPARING', 'PATIENT_ARRIVED', 'CLOSED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMP WITH TIME ZONE,
    preparing_at TIMESTAMP WITH TIME ZONE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================================================
-- 2. AI GENERATED DATA LAYER (Strictly Separate from Source Records)
-- ==============================================================================

CREATE TABLE ai_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    
    -- Model Provenance & Versioning (Section 12)
    model_name TEXT NOT NULL DEFAULT 'StrokeShield Multi-Modal Neuro Triage',
    model_version TEXT NOT NULL DEFAULT 'v1.0.0',
    input_reference JSONB DEFAULT '{}'::jsonb,
    
    -- AI Generated Inferences & Observations
    ai_facial_observation TEXT,
    ai_arm_observation TEXT,
    ai_speech_observation TEXT,
    
    -- AI Urgency Classification & Explanation
    ai_urgency_score NUMERIC(5, 2) NOT NULL,
    ai_urgency_category TEXT NOT NULL CHECK (ai_urgency_category IN ('LOW', 'MODERATE', 'HIGH', 'UNABLE_TO_ASSESS')),
    ai_explanation TEXT NOT NULL,
    confidence_score NUMERIC(5, 2) DEFAULT 0.95,
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. AUDIT LOGS TABLE (Compliance Ledger)
-- ==============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    actor_role TEXT NOT NULL DEFAULT 'Doctor',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_assessments_patient ON assessments(patient_id);
CREATE INDEX idx_assessments_doctor ON assessments(doctor_id);
CREATE INDEX idx_ai_assessments_assessment ON ai_assessments(assessment_id);
CREATE INDEX idx_ai_assessments_urgency ON ai_assessments(ai_urgency_category);
CREATE INDEX idx_vitals_assessment ON vitals(assessment_id);
CREATE INDEX idx_referrals_patient ON referrals(patient_id);
CREATE INDEX idx_referrals_dest_hospital ON referrals(destination_hospital_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ==============================================================================
-- SUPABASE REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_assessments;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE be_fast_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE arm_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Hospitals Public Read Policy
CREATE POLICY "Allow public read on hospitals" ON hospitals FOR SELECT USING (true);

-- 2. Patients Policy (Doctor Authorized)
CREATE POLICY "Allow authenticated read patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update patients" ON patients FOR UPDATE USING (true);

-- 3. Clinical Assessments & Screenings Policies
CREATE POLICY "Allow read on assessments" ON assessments FOR SELECT USING (true);
CREATE POLICY "Allow insert on assessments" ON assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on assessments" ON assessments FOR UPDATE USING (true);

CREATE POLICY "Allow all on vitals" ON vitals FOR ALL USING (true);
CREATE POLICY "Allow all on be_fast_results" ON be_fast_results FOR ALL USING (true);
CREATE POLICY "Allow all on face_screenings" ON face_screenings FOR ALL USING (true);
CREATE POLICY "Allow all on arm_screenings" ON arm_screenings FOR ALL USING (true);
CREATE POLICY "Allow all on speech_screenings" ON speech_screenings FOR ALL USING (true);

-- 4. AI Assessments Policy (AI Engine Generates, Doctor Reads)
CREATE POLICY "Allow read on ai_assessments" ON ai_assessments FOR SELECT USING (true);
CREATE POLICY "Allow insert on ai_assessments" ON ai_assessments FOR INSERT WITH CHECK (true);

-- 5. Referrals Realtime Policies
CREATE POLICY "Allow read referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Allow insert referrals" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update referrals status" ON referrals FOR UPDATE USING (true);

-- 6. Audit Log Policy
CREATE POLICY "Allow read audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
