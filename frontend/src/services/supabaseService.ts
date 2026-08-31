import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { api } from '../api/client';

export interface SupabasePatient {
  id?: string;
  patient_code: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  address?: string;
  blood_group?: string;
  medical_history?: string;
  current_medications?: string;
  created_by?: string;
  created_at?: string;
}

export interface SupabaseAssessmentPayload {
  patient_id: string;
  doctor_id?: string;
  last_known_well?: string;
  assessment_started_at?: string;
  assessment_completed_at?: string;
  urgency_level: 'LOW' | 'MODERATE' | 'HIGH' | 'UNABLE_TO_ASSESS';
  ai_assessment_score: number;
  doctor_confirmation?: string;
  doctor_notes?: string;
  vitals: {
    systolic_bp: number;
    diastolic_bp: number;
    blood_glucose: number;
    heart_rate: number;
    spo2: number;
    temperature?: number;
  };
  be_fast: {
    balance_result: 'NORMAL' | 'ABNORMAL' | 'UNABLE_TO_ASSESS' | 'NOT_ASSESSED';
    eyes_result: 'NORMAL' | 'ABNORMAL' | 'UNABLE_TO_ASSESS' | 'NOT_ASSESSED';
    face_result: 'NORMAL' | 'ABNORMAL' | 'UNABLE_TO_ASSESS' | 'NOT_ASSESSED';
    arms_result: 'NORMAL' | 'ABNORMAL' | 'UNABLE_TO_ASSESS' | 'NOT_ASSESSED';
    speech_result: 'NORMAL' | 'ABNORMAL' | 'UNABLE_TO_ASSESS' | 'NOT_ASSESSED';
  };
  face_screening?: {
    facial_asymmetry_score: number;
    mouth_asymmetry_score?: number;
    eye_asymmetry_score?: number;
    eyebrow_asymmetry_score?: number;
    cheek_asymmetry_score?: number;
    smile_asymmetry_score?: number;
    measurement_quality?: number;
    frame_count?: number;
    score_mean?: number;
    score_median?: number;
    score_std_dev?: number;
    head_yaw?: number;
    head_pitch?: number;
    head_roll?: number;
    ai_observation?: string;
    doctor_confirmation?: string;
    doctor_notes?: string;
  };
}

export interface SupabaseReferralPayload {
  patient_id: string;
  assessment_id: string;
  doctor_id?: string;
  destination_hospital_id: string;
  source_hospital_id?: string;
  source_latitude: number;
  source_longitude: number;
  source_accuracy_meters?: number;
  source_location_timestamp?: string;
  destination_latitude: number;
  destination_longitude: number;
  straight_line_distance_km: number;
  road_distance_km?: number | null;
  estimated_travel_minutes?: number | null;
  priority: 'HIGH' | 'MODERATE' | 'LOW';
  status?: 'CREATED' | 'SENT' | 'ACCEPTED' | 'PREPARING' | 'PATIENT_ARRIVED' | 'CLOSED';
}

const OFFLINE_DRAFTS_KEY = 'strokeshield_offline_assessment_drafts';

export class SupabaseDataService {
  /**
   * Check connection status
   */
  public static isConnected(): boolean {
    return isSupabaseConfigured && navigator.onLine;
  }

  /**
   * Save Patient
   */
  public static async createPatient(patient: SupabasePatient): Promise<any> {
    if (this.isConnected()) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .insert([patient])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase insert patient failed, routing through API client:', err);
      }
    }

    // Direct API fallback
    return api.post('/patients', {
      name: patient.full_name,
      dob: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      medical_history: {
        raw: patient.medical_history,
        medications: patient.current_medications,
      },
    });
  }

  /**
   * Save Full Assessment (Assessments + Vitals + BE-FAST + Face Screening + Audit Log)
   */
  public static async createAssessment(payload: SupabaseAssessmentPayload): Promise<any> {
    if (this.isConnected()) {
      try {
        // 1. Insert assessment record
        const { data: assessment, error: aErr } = await supabase
          .from('assessments')
          .insert([{
            patient_id: payload.patient_id,
            doctor_id: payload.doctor_id,
            last_known_well: payload.last_known_well,
            urgency_level: payload.urgency_level,
            ai_assessment_score: payload.ai_assessment_score,
            doctor_confirmation: payload.doctor_confirmation,
            doctor_notes: payload.doctor_notes,
            assessment_completed_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (aErr) throw aErr;

        // 2. Insert vitals
        if (payload.vitals && assessment) {
          await supabase.from('vitals').insert([{
            assessment_id: assessment.id,
            systolic_bp: payload.vitals.systolic_bp,
            diastolic_bp: payload.vitals.diastolic_bp,
            blood_glucose: payload.vitals.blood_glucose,
            heart_rate: payload.vitals.heart_rate,
            spo2: payload.vitals.spo2,
            temperature: payload.vitals.temperature || 37.0,
          }]);
        }

        // 3. Insert BE-FAST
        if (payload.be_fast && assessment) {
          await supabase.from('be_fast_results').insert([{
            assessment_id: assessment.id,
            balance_result: payload.be_fast.balance_result,
            eyes_result: payload.be_fast.eyes_result,
            face_result: payload.be_fast.face_result,
            arms_result: payload.be_fast.arms_result,
            speech_result: payload.be_fast.speech_result,
          }]);
        }

        // 4. Insert Face Screening measurements
        if (payload.face_screening && assessment) {
          await supabase.from('face_screenings').insert([{
            assessment_id: assessment.id,
            ...payload.face_screening,
          }]);
        }

        return assessment;
      } catch (err) {
        console.warn('Supabase assessment insertion error, falling back to API:', err);
      }
    }

    // Save locally if offline
    if (!navigator.onLine) {
      this.saveOfflineDraft(payload);
    }

    // Fallback to FastAPI backend
    return api.post('/assessments', {
      patient_id: Number(payload.patient_id) || 1,
      symptom_onset: payload.last_known_well,
      urgency_level: payload.urgency_level,
      systolic_bp: payload.vitals.systolic_bp,
      diastolic_bp: payload.vitals.diastolic_bp,
      glucose: payload.vitals.blood_glucose,
      heart_rate: payload.vitals.heart_rate,
      spo2: payload.vitals.spo2,
      face_result: payload.be_fast.face_result.toLowerCase(),
      arm_result: payload.be_fast.arms_result.toLowerCase(),
      speech_result: payload.be_fast.speech_result.toLowerCase(),
      doctor_notes: payload.doctor_notes,
      camera_assessment_data: payload.face_screening,
    });
  }

  /**
   * Create Referral & Dispatch
   */
  public static async createReferral(payload: SupabaseReferralPayload): Promise<any> {
    if (this.isConnected()) {
      try {
        const referralCode = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
        const { data, error } = await supabase
          .from('referrals')
          .insert([{
            referral_code: referralCode,
            patient_id: payload.patient_id,
            assessment_id: payload.assessment_id,
            doctor_id: payload.doctor_id,
            destination_hospital_id: payload.destination_hospital_id,
            source_latitude: payload.source_latitude,
            source_longitude: payload.source_longitude,
            source_accuracy_meters: payload.source_accuracy_meters,
            destination_latitude: payload.destination_latitude,
            destination_longitude: payload.destination_longitude,
            straight_line_distance_km: payload.straight_line_distance_km,
            road_distance_km: payload.road_distance_km,
            estimated_travel_minutes: payload.estimated_travel_minutes,
            priority: payload.priority,
            status: payload.status || 'SENT',
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase referral creation failed, using API:', err);
      }
    }

    return api.post('/referrals', {
      patient_id: Number(payload.patient_id) || 1,
      assessment_id: Number(payload.assessment_id) || 1,
      hospital_id: 1,
      source_latitude: payload.source_latitude,
      source_longitude: payload.source_longitude,
      source_accuracy_meters: payload.source_accuracy_meters,
      distance_km: payload.straight_line_distance_km,
      road_distance_km: payload.road_distance_km,
      estimated_travel_minutes: payload.estimated_travel_minutes,
      priority: payload.priority,
    });
  }

  /**
   * Realtime Subscription for Referrals (Section 17)
   */
  public static subscribeToReferrals(
    onUpdate: (payload: any) => void
  ): () => void {
    if (!isSupabaseConfigured) {
      // Return dummy unsubscribe if Supabase is not configured
      return () => {};
    }

    const channel = supabase
      .channel('public:referrals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals' },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Offline Draft Storage (Section 26)
   */
  public static saveOfflineDraft(draft: SupabaseAssessmentPayload) {
    try {
      const existing = this.getOfflineDrafts();
      existing.push({
        ...draft,
        draft_id: `draft_${Date.now()}`,
        saved_at: new Date().toISOString(),
        synced: false,
      });
      localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save offline draft:', e);
    }
  }

  public static getOfflineDrafts(): any[] {
    try {
      const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static async syncOfflineDrafts(): Promise<number> {
    const drafts = this.getOfflineDrafts();
    if (drafts.length === 0 || !navigator.onLine) return 0;

    let syncedCount = 0;
    const remaining: any[] = [];

    for (const draft of drafts) {
      try {
        await this.createAssessment(draft);
        syncedCount++;
      } catch (err) {
        remaining.push(draft);
      }
    }

    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(remaining));
    return syncedCount;
  }
}
