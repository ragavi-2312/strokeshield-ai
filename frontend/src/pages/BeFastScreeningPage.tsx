import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { PatientSummary } from '../types';
import { 
  Camera, 
  Smile, 
  Activity, 
  Mic, 
  Clock, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { FaceScreeningModal } from '../components/camera/FaceScreeningModal';
import { ArmScreeningModal } from '../components/camera/ArmScreeningModal';
import { SpeechScreeningModal } from '../components/camera/SpeechScreeningModal';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';

export const BeFastScreeningPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(searchParams.get('patient_id') || '');

  // Modals
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isArmModalOpen, setIsArmModalOpen] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);

  // BE-FAST State
  const [balanceResult, setBalanceResult] = useState<string>('normal');
  const [eyesResult, setEyesResult] = useState<string>('normal');

  const [faceData, setFaceData] = useState<{
    facial_asymmetry_score: number;
    facial_measurement_quality: number;
    mouth_asymmetry_score: number;
    eye_asymmetry_score: number;
    eyebrow_asymmetry_score: number;
    cheek_asymmetry_score: number;
    smile_asymmetry_score: number;
    frame_count: number;
    median_score: number;
    mean_score: number;
    standard_deviation: number;
    head_yaw: number;
    head_pitch: number;
    head_roll: number;
    ai_face_observation: string;
    doctor_face_confirmation: string;
    doctor_face_notes: string;
    screening_timestamp: string;
  }>({
    facial_asymmetry_score: 12.4,
    facial_measurement_quality: 94,
    mouth_asymmetry_score: 11.2,
    eye_asymmetry_score: 8.5,
    eyebrow_asymmetry_score: 6.2,
    cheek_asymmetry_score: 5.4,
    smile_asymmetry_score: 11.2,
    frame_count: 25,
    median_score: 12.4,
    mean_score: 12.1,
    standard_deviation: 2.1,
    head_yaw: 0.8,
    head_pitch: -1.2,
    head_roll: 0.4,
    ai_face_observation: 'Low geometric facial asymmetry observed — bilaterally balanced landmarks',
    doctor_face_confirmation: 'Normal',
    doctor_face_notes: '',
    screening_timestamp: new Date().toISOString(),
  });

  const [armData, setArmData] = useState<{
    aiObservation: string;
    doctorConfirmation: string;
    driftDeltaPx: number;
  }>({
    aiObservation: 'no_obvious_drift',
    doctorConfirmation: 'normal',
    driftDeltaPx: 2,
  });

  const [speechData, setSpeechData] = useState<{
    aiObservation: string;
    doctorConfirmation: string;
    transcript: string;
  }>({
    aiObservation: 'normal_speech_pattern',
    doctorConfirmation: 'normal',
    transcript: '',
  });

  // Time
  const [lastKnownWellTime, setLastKnownWellTime] = useState<string>('08:30');
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(45);

  useEffect(() => {
    api.get<PatientSummary[]>('/patients')
      .then((data) => {
        setPatients(data);
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(String(data[0].id));
        }
      })
      .catch(console.error);
  }, []);

  const handleProceedToVitalsAndAssessment = () => {
    if (!selectedPatientId) {
      alert('Please select a patient to perform BE-FAST screening.');
      return;
    }

    // Navigate to /assessment/new with pre-filled state
    navigate(`/assessment/new?patient_id=${selectedPatientId}`, {
      state: {
        befast: {
          balance_result: balanceResult,
          eyes_result: eyesResult,
          face_result: faceData.doctor_face_confirmation !== 'Normal' ? 'possible_abnormality' : 'normal',
          face_ai_observation: faceData.ai_face_observation,
          face_doctor_confirmation: faceData.doctor_face_confirmation,
          arm_result: armData.doctorConfirmation !== 'normal' ? 'possible_weakness' : 'normal',
          arm_ai_observation: armData.aiObservation,
          arm_doctor_confirmation: armData.doctorConfirmation,
          speech_result: speechData.doctorConfirmation === 'abnormal' ? 'possible_speech_difficulty' : 'normal',
          speech_ai_observation: speechData.aiObservation,
          speech_doctor_confirmation: speechData.doctorConfirmation,
          last_known_well_time: lastKnownWellTime,
          symptom_duration_minutes: elapsedMinutes,
          camera_assessment_data: {
            facial_asymmetry_score: faceData.facial_asymmetry_score,
            facial_measurement_quality: faceData.facial_measurement_quality,
            mouth_asymmetry_score: faceData.mouth_asymmetry_score,
            eye_asymmetry_score: faceData.eye_asymmetry_score,
            eyebrow_asymmetry_score: faceData.eyebrow_asymmetry_score,
            cheek_asymmetry_score: faceData.cheek_asymmetry_score,
            smile_asymmetry_score: faceData.smile_asymmetry_score,
            frame_count: faceData.frame_count,
            median_score: faceData.median_score,
            mean_score: faceData.mean_score,
            standard_deviation: faceData.standard_deviation,
            head_yaw: faceData.head_yaw,
            head_pitch: faceData.head_pitch,
            head_roll: faceData.head_roll,
            arm_drift_delta_px: armData.driftDeltaPx,
            snapshot_timestamp: faceData.screening_timestamp,
          },
        },
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-600" />
            <span>BE-FAST Camera & AI Screening Suite</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evidence-based acute neurological screening: Balance, Eyes, Face, Arms, Speech, and Last Known Well.
          </p>
        </div>

        {/* Patient Selector */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 font-bold text-slate-900"
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_id} — {p.name} ({p.age} yrs)
              </option>
            ))}
          </select>
        </div>
      </div>

      <MedicalDisclaimer variant="card" />

      {/* BE-FAST Interactive Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* B — Balance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm">
                B
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Balance / Gait Stability</h3>
                <p className="text-[11px] text-slate-500">Sudden loss of balance, ataxia, or dizziness</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setBalanceResult('normal')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                balanceResult === 'normal'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ✓ Normal
            </button>
            <button
              type="button"
              onClick={() => setBalanceResult('sudden_loss')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                balanceResult === 'sudden_loss'
                  ? 'bg-red-600 text-white border-red-600 shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚠️ Sudden Loss
            </button>
            <button
              type="button"
              onClick={() => setBalanceResult('unable_to_assess')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                balanceResult === 'unable_to_assess'
                  ? 'bg-slate-800 text-white border-slate-800 shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ❓ Unable
            </button>
          </div>
        </div>

        {/* E — Eyes */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                E
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Eyes / Visual Field</h3>
                <p className="text-[11px] text-slate-500">Sudden loss of vision, hemianopia, or diplopia</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setEyesResult('normal')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                eyesResult === 'normal'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ✓ Normal
            </button>
            <button
              type="button"
              onClick={() => setEyesResult('sudden_vision_changes')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                eyesResult === 'sudden_vision_changes'
                  ? 'bg-red-600 text-white border-red-600 shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚠️ Vision Deficit
            </button>
            <button
              type="button"
              onClick={() => setEyesResult('unable_to_assess')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                eyesResult === 'unable_to_assess'
                  ? 'bg-slate-800 text-white border-slate-800 shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ❓ Unable
            </button>
          </div>
        </div>

        {/* F — Face (Quantitative Facial Asymmetry Score) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-black text-sm">
                F
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Facial Asymmetry Score</h3>
                <p className="text-[11px] text-slate-500">Quantitative landmark & smile analysis</p>
              </div>
            </div>

            <button
              onClick={() => setIsFaceModalOpen(true)}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch Asymmetry Test</span>
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Measured Asymmetry Score:</span>
              <strong className="font-mono text-base font-black text-slate-900">
                {faceData.facial_asymmetry_score.toFixed(1)} / 100
              </strong>
              <span className="text-[10px] text-slate-500 block">Quality: {faceData.facial_measurement_quality}/100</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Doctor Confirmation:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                faceData.doctor_face_confirmation !== 'Normal' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {faceData.doctor_face_confirmation}
              </span>
            </div>
          </div>
        </div>

        {/* A — Arms (Camera Assisted) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
                A
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Arms Drift (Camera)</h3>
                <p className="text-[11px] text-slate-500">Unilateral downward drift or pronator weakness</p>
              </div>
            </div>

            <button
              onClick={() => setIsArmModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Launch 5s Drift Test</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">AI Observation:</span>
              <strong className={armData.aiObservation === 'possible_arm_drift' ? 'text-amber-700' : 'text-slate-800'}>
                {armData.aiObservation === 'possible_arm_drift' ? 'Possible Drift Detected' : 'No Obvious Drift'}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Doctor Verification:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                armData.doctorConfirmation !== 'normal' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {armData.doctorConfirmation.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* S — Speech */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-black text-sm">
                S
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Speech Repetition</h3>
                <p className="text-[11px] text-slate-500">Phonetic repetition test for dysarthria or slurring</p>
              </div>
            </div>

            <button
              onClick={() => setIsSpeechModalOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Launch Speech Test</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">AI Observation:</span>
              <strong className={speechData.aiObservation === 'possible_speech_mismatch' ? 'text-amber-700' : 'text-slate-800'}>
                {speechData.aiObservation === 'possible_speech_mismatch' ? 'Possible Mismatch' : 'Fluent Articulation'}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Doctor Verification:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                speechData.doctorConfirmation === 'abnormal' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {speechData.doctorConfirmation.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* T — Time / Last Known Well */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm">
              T
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Time / Last Known Well</h3>
              <p className="text-[11px] text-slate-500">Exact or approximate time patient was last at baseline</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Last Known Well Time</label>
              <input
                type="time"
                value={lastKnownWellTime}
                onChange={(e) => setLastKnownWellTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Elapsed Duration (Mins)</label>
              <input
                type="number"
                value={elapsedMinutes}
                onChange={(e) => setElapsedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Submit Action */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-slate-900">Complete Assessment with Vitals & AI Scoring</h4>
          <p className="text-xs text-slate-500">
            Carries forward camera screening landmarks, doctor verifications, and onset timing into the full triage calculation.
          </p>
        </div>

        <button
          onClick={handleProceedToVitalsAndAssessment}
          className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all"
        >
          <span>Continue to Vitals & AI Triage</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Screening Modals */}
      <FaceScreeningModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onConfirmResult={(res) => setFaceData(res)}
      />

      <ArmScreeningModal
        isOpen={isArmModalOpen}
        onClose={() => setIsArmModalOpen(false)}
        onConfirm={(res) => setArmData(res)}
      />

      <SpeechScreeningModal
        isOpen={isSpeechModalOpen}
        onClose={() => setIsSpeechModalOpen(false)}
        onConfirm={(res) => setSpeechData(res)}
      />
    </div>
  );
};
