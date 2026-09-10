export interface Doctor {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  hospital?: string;
  hospital_address?: string;
  latitude?: number;
  longitude?: number;
  specialization?: string;
  experience_years?: number;
  location?: string;
  registration_number?: string;
  data_type?: string;
  data_source?: string;
  created_at?: string;
}

export interface HospitalStaff {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  hospital_id: number;
  hospital_name?: string;
  created_at?: string;
}

export interface MedicalHistory {
  previous_stroke?: boolean;
  hypertension?: boolean;
  diabetes?: boolean;
  heart_disease?: boolean;
  high_cholesterol?: boolean;
  smoking?: string;
  alcohol_use?: string;
  family_history_stroke?: boolean;
  previous_neuro_conditions?: string;
  current_medications?: string;
  known_allergies?: string;
  bmi?: number;
}

export interface Patient {
  id: number;
  patient_id: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: MedicalHistory;
  created_at: string;
}

export interface PatientSummary {
  id: number;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  latest_risk_level?: 'LOW' | 'MODERATE' | 'HIGH';
  latest_risk_score?: number;
  latest_assessment_time?: string;
  last_risk_level?: 'LOW' | 'MODERATE' | 'HIGH';
  last_risk_score?: number;
  last_assessment_date?: string;
  total_assessments?: number;
  has_active_referral?: boolean;
}

export interface StructuredNotes {
  clinical_observation?: string;
  additional_symptoms?: string;
  immediate_action?: string;
  follow_up?: string;
}

export interface CameraAssessmentData {
  facial_asymmetry_score?: number;
  facial_symmetry_score?: number;
  facial_measurement_quality?: number;
  analysis_quality_tier?: 'HIGH' | 'MEDIUM' | 'LOW';
  mouth_asymmetry_score?: number;
  eye_asymmetry_score?: number;
  eyebrow_asymmetry_score?: number;
  cheek_asymmetry_score?: number;
  jaw_asymmetry_score?: number;
  highest_asymmetry_region?: string;
  smile_asymmetry_score?: number;
  frame_count?: number;
  valid_frame_count?: number;
  rejected_frame_count?: number;
  median_score?: number;
  mean_score?: number;
  standard_deviation?: number;
  head_yaw?: number;
  head_pitch?: number;
  head_roll?: number;
  facial_symmetry_deviation?: number;
  facial_symmetry_category?: string;
  mouth_symmetry_deviation?: number;
  eye_symmetry_deviation?: number;
  face_quality_score?: number;
  multi_frame_stability?: string;
  face_symmetry_score?: number;
  arm_drift_detected?: boolean;
  arm_drift_delta_px?: number;
  speech_mismatch_detected?: boolean;
  model_name?: string;
  model_version?: string;
  snapshot_timestamp?: string;
}

export interface AIAssessmentData {
  id?: number;
  assessment_id?: number;
  model_name: string;
  model_version: string;
  input_reference?: Record<string, any>;
  ai_facial_observation?: string;
  ai_arm_observation?: string;
  ai_speech_observation?: string;
  ai_urgency_score: number;
  ai_urgency_category: 'LOW' | 'MODERATE' | 'HIGH' | 'UNABLE_TO_ASSESS';
  ai_explanation: string;
  confidence_score?: number;
  generated_at: string;
}

export interface Assessment {
  id: number;
  patient_id: number;
  doctor_id: number;
  assessment_time: string;
  symptom_onset?: string;
  last_known_well_time?: string;
  symptom_duration_minutes?: number;
  
  face_result: string;
  face_ai_observation?: string;
  face_doctor_confirmation?: string;

  arm_result: string;
  arm_ai_observation?: string;
  arm_doctor_confirmation?: string;

  speech_result: string;
  speech_ai_observation?: string;
  speech_doctor_confirmation?: string;

  balance_result?: string;
  eyes_result?: string;

  systolic_bp: number;
  diastolic_bp: number;
  glucose: number;
  heart_rate: number;
  spo2: number;
  temperature?: number;

  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  confidence?: number;
  contributing_factors: string[];
  recommendation: string;
  doctor_notes?: string;
  structured_notes?: StructuredNotes;
  camera_assessment_data?: CameraAssessmentData;
  ai_assessment?: AIAssessmentData;
  created_at: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergency_phone?: string;
  stroke_capability: string;
  neurology_available?: boolean;
  stroke_care_available?: boolean;
  emergency_department?: boolean;
  icu_available?: boolean;
  ct_scan_available?: boolean;
  mri_available?: boolean;
  operating_hours?: string;
  emergency_available: boolean;
  verification_status?: string;
  specialties: string[];
  estimated_distance_km: number;
  estimated_travel_time_min: number;
}

export interface Referral {
  id: number;
  referral_code?: string;
  patient_id: number;
  assessment_id: number;
  doctor_id: number;
  hospital_id: number;
  source_hospital_name?: string;
  source_latitude?: number;
  source_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  distance_km?: number;
  estimated_travel_minutes?: number;
  priority: 'Emergency' | 'Urgent' | 'Standard';
  status: 'Sent' | 'Accepted' | 'Preparing' | 'In Transit' | 'Patient Arrived' | 'Closed' | 'Created' | 'Acknowledged' | 'Arrived';
  ambulance_requested?: string;
  estimated_eta_minutes?: number;
  dispatch_notes?: string;
  doctor_confirmed?: string;
  doctor_confirmed_at?: string;
  qr_data?: {
    referral_code?: string;
    hospital_name?: string;
    priority?: string;
    secure_token?: string;
    issued_at?: string;
  };
  patient_summary_snapshot?: Record<string, any>;
  timeline_events: Array<{
    time: string;
    event: string;
    actor: string;
  }>;
  created_at: string;
  accepted_at?: string;
  preparing_at?: string;
  arrived_at?: string;
  closed_at?: string;
  updated_at: string;
  hospital?: Hospital;
  patient_name?: string;
  patient_identifier?: string;
}

export interface EmergencySummary {
  patient_id: string;
  patient_name: string;
  age: number;
  gender: string;
  phone: string;
  emergency_contact: string;
  emergency_phone: string;
  assessment_time: string;
  symptom_onset: string;
  last_known_well_time?: string;
  symptom_duration_text: string;
  fast_findings: Record<string, string>;
  befast_findings?: Record<string, string>;
  camera_findings?: CameraAssessmentData;
  vital_signs: Record<string, any>;
  relevant_medical_history: string[];
  risk_level: string;
  risk_score: number;
  urgency_recommendation: string;
  contributing_factors: string[];
  doctor_notes?: string;
  structured_notes?: StructuredNotes;
  assessing_doctor: string;
  hospital_affiliation: string;
  disclaimer: string;
}

export interface AuditLog {
  id: number;
  user_type: string;
  user_name: string;
  user_email: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export interface TimelineItem {
  id: string;
  date?: string;
  time?: string;
  timestamp?: string;
  type: 'assessment' | 'referral' | 'note' | 'vitals' | 'registration';
  title: string;
  description: string;
  risk_level?: 'LOW' | 'MODERATE' | 'HIGH';
  badge?: string;
  assessment_id?: number;
  referral_id?: number;
}

export interface VitalsPoint {
  time: string;
  date: string;
  systolic_bp: number;
  diastolic_bp: number;
  glucose: number;
  heart_rate: number;
  spo2: number;
  risk_score: number;
}

export interface EmergencyAlert {
  assessment_id: number;
  patient_id: number;
  patient_id_str: string;
  patient_name: string;
  age: number;
  gender: string;
  risk_score: number;
  risk_level: 'HIGH';
  assessment_time: string;
  symptom_duration_text: string;
  contributing_factors: string[];
  has_referral: boolean;
  referral_status?: string;
}

export interface DashboardStats {
  total_patients: number;
  assessments_today: number;
  high_risk_patients: number;
  emergency_cases: number;
  active_referrals: number;
}

export interface DashboardOverview {
  doctor_name: string;
  hospital_name: string;
  stats: DashboardStats;
  emergency_alerts: EmergencyAlert[];
  recent_assessments: any[];
}
