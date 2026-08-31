-- ==============================================================================
-- StrokeShield AI — Supabase PostgreSQL Seed Dataset
-- Strict Separation: Original Clinical Data vs AI-Generated Analysis
-- ==============================================================================

-- 1. SEED 5 HOSPITALS (Chennai Stroke Emergency Network)
INSERT INTO hospitals (id, name, address, latitude, longitude, phone, emergency_phone, neurology_available, stroke_care_available, emergency_department, ct_available, mri_available, icu_available, verification_status) VALUES
('a0000000-0000-0000-0000-000000000001', 'Demo Stroke Care Hospital', '100 Anna Salai, Chennai, Tamil Nadu', 13.082700, 80.270700, '+91 44 2836 1000', '+91 91100 11221', true, true, true, true, true, true, 'DEMO'),
('a0000000-0000-0000-0000-000000000002', 'Demo Neuro Emergency Hospital', '45 Greams Road, Thousand Lights, Chennai, Tamil Nadu', 13.056900, 80.242500, '+91 44 2829 2000', '+91 91100 11222', true, true, true, true, true, true, 'DEMO'),
('a0000000-0000-0000-0000-000000000003', 'Metro Comprehensive Stroke Center', '450 Poonamallee High Road, Chennai, Tamil Nadu', 13.075000, 80.260000, '+91 44 2641 3000', '+91 91100 11223', true, true, true, true, true, true, 'DEMO'),
('a0000000-0000-0000-0000-000000000004', 'St. Jude Regional Neuroscience Hospital', '820 Health Parkway, T. Nagar, Chennai, Tamil Nadu', 13.045000, 80.230000, '+91 44 2434 4000', '+91 91100 11224', true, true, true, true, false, false, 'DEMO'),
('a0000000-0000-0000-0000-000000000005', 'East Bay Neurological Hospital', '300 Bayview Road, ECR, Chennai, Tamil Nadu', 12.980000, 80.255000, '+91 44 2448 5000', '+91 91100 11225', true, true, true, true, false, true, 'DEMO')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED EXACTLY 2 AI-GENERATED DEMO DOCTORS & HOSPITAL STAFF
INSERT INTO doctors (id, full_name, specialization, email, phone, hospital_id, role, experience_years, location, registration_number, data_type, data_source) VALUES
('b0000000-0000-0000-0000-000000000001', 'Dr. Raha', 'Neurologist', 'raha@demo-strokeshield.com', '+91 98765 43210', 'a0000000-0000-0000-0000-000000000001', 'DOCTOR', 6, 'Chennai, Tamil Nadu', 'DEMO-REG-RAHA', 'DEMO', 'AI_GENERATED'),
('b0000000-0000-0000-0000-000000000002', 'Dr. Vijay', 'Emergency Medicine Specialist', 'vijay@demo-strokeshield.com', '+91 87654 32109', 'a0000000-0000-0000-0000-000000000002', 'DOCTOR', 6, 'Chennai, Tamil Nadu', 'DEMO-REG-VIJAY', 'DEMO', 'AI_GENERATED'),
('b0000000-0000-0000-0000-000000000003', 'Nurse Coordinator Mark Reynolds, RN', 'Emergency Triage Coordinator', 'staff.metro@strokeshield.ai', '+91 91100 12345', 'a0000000-0000-0000-0000-000000000001', 'HOSPITAL_STAFF', 5, 'Chennai, Tamil Nadu', 'DEMO-REG-STAFF', 'DEMO', 'AI_GENERATED')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED 10 PATIENTS (Original Patient Demographic & Clinical Facts)
INSERT INTO patients (id, patient_code, full_name, date_of_birth, gender, phone, address, blood_group, medical_history, current_medications, created_by) VALUES
('c0000000-0000-0000-0000-000000000001', 'P-1001', 'Robert M. Jenkins', '1958-04-12', 'Male', '+91 98401 23456', '45 Anna Nagar West, Chennai', 'A+', 'Hypertension, Type 2 Diabetes, Heavy Smoking History', 'Lisinopril 20mg, Metformin 500mg', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000002', 'P-1002', 'Maria Elena Rodriguez', '1967-08-25', 'Female', '+91 98402 34567', '124 T. Nagar 3rd Main Rd, Chennai', 'O+', 'Hypertension, Hyperlipidemia', 'Atorvastatin 40mg, Amlodipine 5mg', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000003', 'P-1003', 'David Arthur Miller', '1954-11-03', 'Male', '+91 98403 45678', '890 Alwarpet High Rd, Chennai', 'B+', 'Atrial Fibrillation, Previous TIA (2024)', 'Apixaban 5mg, Metoprolol 25mg', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000004', 'P-1004', 'Linda Wei Chang', '1981-02-14', 'Female', '+91 98404 56789', '350 Velachery Main Rd, Chennai', 'AB+', 'No significant cardiovascular history, Migraines with aura', 'Sumatriptan as needed', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000005', 'P-1005', 'Karthik Subramanian', '1960-07-30', 'Male', '+91 98405 67890', '512 Mylapore Tank St, Chennai', 'O-', 'Hypertension, Coronary Artery Disease', 'Aspirin 81mg, Carvedilol 12.5mg', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000006', 'P-1006', 'Eleanor Vance', '1949-12-14', 'Female', '+91 98406 78901', '904 Besant Nagar Beach Rd, Chennai', 'A-', 'Hypertension, Atrial Fibrillation, Osteoarthritis', 'Warfarin 2.5mg, Acetaminophen', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000007', 'P-1007', 'Ananya Sharma', '1975-06-08', 'Female', '+91 98407 89012', '210 Adyar Gandhinagar, Chennai', 'B-', 'Heavy Tobacco Use, Sleep Apnea', 'CPAP therapy', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000008', 'P-1008', 'Ramesh Kumar', '1963-03-19', 'Male', '+91 98408 90123', '334 Kilpauk Garden Rd, Chennai', 'O+', 'Type 2 Diabetes, Diabetic Neuropathy', 'Metformin 1000mg, Glipizide 5mg', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000009', 'P-1009', 'Samuel Washington', '1955-08-22', 'Male', '+91 98409 01234', '77 Nungambakkam High Rd, Chennai', 'A+', 'Hypertension, Peripheral Vascular Disease', 'Clopidogrel 75mg, Losartan 50mg', 'b0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000010', 'P-1010', 'Priya Sundaram', '1970-10-15', 'Female', '+91 98410 12345', '102 Harrington Rd, Chetpet, Chennai', 'AB-', 'Mild Hypercholesterolemia', 'Diet controlled', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 4. LAYER 1: ORIGINAL ENCOUNTER ASSESSMENTS & VITALS
INSERT INTO assessments (id, patient_id, doctor_id, last_known_well, assessment_started_at, assessment_completed_at, doctor_confirmation, doctor_notes) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '65 minutes', NOW() - INTERVAL '10 minutes', NOW(), 'CONFIRMED_HIGH', 'Dr. Raha confirmed right nasolabial flattening and right arm pronator drift. Immediate stroke protocol initiated.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vitals (id, assessment_id, systolic_bp, diastolic_bp, blood_glucose, heart_rate, spo2, temperature) VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 188.0, 108.0, 195.0, 88.0, 96.0, 37.1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO be_fast_results (id, assessment_id, balance_result, eyes_result, face_result, arms_result, speech_result) VALUES
('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'ABNORMAL', 'NORMAL', 'ABNORMAL', 'ABNORMAL', 'ABNORMAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO face_screenings (id, assessment_id, facial_asymmetry_score, mouth_asymmetry_score, eye_asymmetry_score, eyebrow_asymmetry_score, cheek_asymmetry_score, smile_asymmetry_score, measurement_quality, frame_count, score_mean, score_median, score_std_dev, head_yaw, head_pitch, head_roll) VALUES
('f1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 48.60, 56.20, 24.10, 19.50, 12.40, 56.20, 94.0, 25, 47.80, 48.60, 2.40, 0.8, -1.2, 0.4)
ON CONFLICT (id) DO NOTHING;

-- 5. LAYER 2: AI-GENERATED ASSESSMENTS (Strictly Separate from Source Records)
INSERT INTO ai_assessments (id, assessment_id, model_name, model_version, input_reference, ai_facial_observation, ai_arm_observation, ai_speech_observation, ai_urgency_score, ai_urgency_category, ai_explanation, confidence_score) VALUES
('a1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'StrokeShield Multi-Modal Neuro Triage', 'v1.0.0', '{"vitals_ref": "e0000000-0000-0000-0000-000000000001", "face_ref": "f1000000-0000-0000-0000-000000000001"}'::jsonb, 'Possible facial asymmetry (Facial Symmetry Deviation Score: 48.6/100) — marked unilateral deviation', 'Possible arm weakness with unilateral downward drift', 'Possible speech dysarthria detected during phrase repetition', 94.50, 'HIGH', 'Multiple acute neuro-focal signs detected within the hyperacute therapeutic time window (65 minutes). Urgent vascular stroke imaging indicated.', 0.96)
ON CONFLICT (id) DO NOTHING;

-- 6. LAYER 3: REFERRALS (Emergency Routing)
INSERT INTO referrals (id, referral_code, patient_id, assessment_id, doctor_id, destination_hospital_id, source_latitude, source_longitude, source_accuracy_meters, source_location_timestamp, destination_latitude, destination_longitude, straight_line_distance_km, road_distance_km, estimated_travel_minutes, priority, status, created_at, accepted_at) VALUES
('80000000-0000-0000-0000-000000000001', 'REF-2026-10001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 13.082700, 80.270700, 8.0, NOW() - INTERVAL '40 minutes', 13.082700, 80.270700, 0.0, 1.20, 5, 'HIGH', 'ACCEPTED', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '35 minutes')
ON CONFLICT (id) DO NOTHING;

-- 7. AUDIT LOGS (Immutable History of Changes)
INSERT INTO audit_logs (id, user_id, actor_role, action, entity_type, entity_id, old_value, new_value, metadata, created_at) VALUES
('90000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Doctor', 'Doctor Login', 'Doctor', 'b0000000-0000-0000-0000-000000000001', NULL, '{"status": "logged_in"}'::jsonb, '{"email": "raha@demo-strokeshield.com"}'::jsonb, NOW() - INTERVAL '60 minutes'),
('90000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Doctor', 'Patient Assessment Created', 'Assessment', 'd0000000-0000-0000-0000-000000000001', NULL, '{"doctor_confirmation": "CONFIRMED_HIGH"}'::jsonb, '{"patient_code": "P-1001"}'::jsonb, NOW() - INTERVAL '45 minutes'),
('90000000-0000-0000-0000-000000000003', NULL, 'AI Engine', 'AI Assessment Generated', 'AIAssessment', 'a1000000-0000-0000-0000-000000000001', NULL, '{"urgency_score": 94.5, "model_version": "v1.0.0"}'::jsonb, '{"model": "StrokeShield Multi-Modal Neuro Triage"}'::jsonb, NOW() - INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;
