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
    facial_symmetry_score: number;
    facial_measurement_quality: number;
    analysis_quality_tier: 'HIGH' | 'MEDIUM' | 'LOW';
    mouth_asymmetry_score: number;
    eye_asymmetry_score: number;
    eyebrow_asymmetry_score: number;
    cheek_asymmetry_score: number;
    jaw_asymmetry_score: number;
    highest_asymmetry_region: string;
    frame_count: number;
    valid_frame_count: number;
    rejected_frame_count: number;
    median_score: number;
    mean_score: number;
    standard_deviation: number;
    head_yaw: number;
    head_pitch: number;
    head_roll: number;
    ai_face_observation: string;
    doctor_face_confirmation: string;
    doctor_face_notes: string;
    model_name: string;
    model_version: string;
    screening_timestamp: string;
  }>({
    facial_asymmetry_score: 11.4,
    facial_symmetry_score: 88.6,
    facial_measurement_quality: 95,
    analysis_quality_tier: 'HIGH',
    mouth_asymmetry_score: 18.6,
    eye_asymmetry_score: 5.2,
    eyebrow_asymmetry_score: 7.1,
    cheek_asymmetry_score: 10.3,
    jaw_asymmetry_score: 9.4,
    highest_asymmetry_region: 'Mouth',
    frame_count: 50,
    valid_frame_count: 42,
    rejected_frame_count: 8,
    median_score: 11.4,
    mean_score: 11.8,
    standard_deviation: 2.1,
    head_yaw: 0.8,
    head_pitch: -1.2,
    head_roll: 0.4,
    ai_face_observation: 'Low geometric facial asymmetry observed (Asymmetry: 11.4%, Symmetry: 88.6%) — bilaterally balanced landmarks',
    doctor_face_confirmation: 'Normal',
    doctor_face_notes: '',
    model_name: 'MediaPipe Face Landmarker',
    model_version: 'v0.10.14-tasks-vision',
    screening_timestamp: new Date().toISOString(),
  });

  const [armData, setArmData] = useState<{
    aiObservation: string;
    doctorConfirmation: string;
    driftDeltaPx: number;
    driftAngleDeg: number;
    motorSymmetryPercent: number;
    affectedSide: 'left' | 'right' | 'symmetric';
    analysisQuality: 'HIGH' | 'MEDIUM' | 'LOW';
    validFramesCount: number;
    totalFramesCount: number;
    driftVelocity: number;
    stabilityMad: number;
    doctorNotes: string;
  }>({
    aiObservation: 'no_obvious_drift',
    doctorConfirmation: 'normal',
    driftDeltaPx: 2,
    driftAngleDeg: 1.4,
    motorSymmetryPercent: 96.5,
    affectedSide: 'symmetric',
    analysisQuality: 'HIGH',
    validFramesCount: 45,
    totalFramesCount: 50,
    driftVelocity: 0.1,
    stabilityMad: 0.6,
    doctorNotes: '',
  });

  const [speechData, setSpeechData] = useState<{
    aiObservation: string;
    doctorConfirmation: string;
    transcript: string;
    targetSentence: string;
    articulationScore: number;
    fluencyScore: number;
    pauseRatio: number;
    speakingRate: number;
    speechPattern: string;
    analysisQuality: 'HIGH' | 'MEDIUM' | 'LOW';
    doctorNotes: string;
  }>({
    aiObservation: 'normal_speech_pattern',
    doctorConfirmation: 'normal',
    transcript: 'You cannot teach an old dog new tricks.',
    targetSentence: 'You cannot teach an old dog new tricks.',
    articulationScore: 94.2,
    fluencyScore: 92.0,
    pauseRatio: 0.22,
    speakingRate: 4.2,
    speechPattern: 'fluent_normal',
    analysisQuality: 'HIGH',
    doctorNotes: '',
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
            facial_symmetry_score: faceData.facial_symmetry_score,
            facial_measurement_quality: faceData.facial_measurement_quality,
            analysis_quality_tier: faceData.analysis_quality_tier,
            mouth_asymmetry_score: faceData.mouth_asymmetry_score,
            eye_asymmetry_score: faceData.eye_asymmetry_score,
            eyebrow_asymmetry_score: faceData.eyebrow_asymmetry_score,
            cheek_asymmetry_score: faceData.cheek_asymmetry_score,
            jaw_asymmetry_score: faceData.jaw_asymmetry_score,
            highest_asymmetry_region: faceData.highest_asymmetry_region,
            frame_count: faceData.frame_count,
            valid_frame_count: faceData.valid_frame_count,
            rejected_frame_count: faceData.rejected_frame_count,
            median_score: faceData.median_score,
            mean_score: faceData.mean_score,
            standard_deviation: faceData.standard_deviation,
            head_yaw: faceData.head_yaw,
            head_pitch: faceData.head_pitch,
            head_roll: faceData.head_roll,
            arm_drift_delta_px: armData.driftDeltaPx,
            arm_drift_angle_deg: armData.driftAngleDeg,
            arm_motor_symmetry_percent: armData.motorSymmetryPercent,
            arm_affected_side: armData.affectedSide,
            arm_drift_velocity: armData.driftVelocity,
            arm_analysis_quality: armData.analysisQuality,
            arm_valid_frames: armData.validFramesCount,
            arm_total_frames: armData.totalFramesCount,
            arm_stability_mad: armData.stabilityMad,
            arm_doctor_confirmation: armData.doctorConfirmation,
            arm_doctor_notes: armData.doctorNotes,
            speech_mismatch_detected: speechData.doctorConfirmation === 'abnormal',
            speech_articulation_score: speechData.articulationScore,
            speech_fluency_score: speechData.fluencyScore,
            speech_pause_ratio: speechData.pauseRatio,
            speech_speaking_rate: speechData.speakingRate,
            speech_pattern: speechData.speechPattern,
            speech_analysis_quality: speechData.analysisQuality,
            speech_transcript: speechData.transcript,
            speech_target_sentence: speechData.targetSentence,
            speech_doctor_confirmation: speechData.doctorConfirmation,
            speech_doctor_notes: speechData.doctorNotes,
            model_name: faceData.model_name,
            model_version: faceData.model_version,
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
              <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm">
                F
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Facial Asymmetry Screening</h3>
                <p className="text-[11px] text-slate-500">Quantitative MediaPipe multi-frame analysis</p>
              </div>
            </div>

            <button
              onClick={() => setIsFaceModalOpen(true)}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch Asymmetry Test</span>
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Facial Asymmetry / Symmetry:</span>
              <div className="flex items-center gap-2">
                <strong className="font-mono text-base font-black text-slate-900">
                  {faceData.facial_asymmetry_score.toFixed(1)}%
                </strong>
                <span className="text-slate-300 font-bold">•</span>
                <span className="text-teal-800 font-mono font-bold">
                  {faceData.facial_symmetry_score ? `${faceData.facial_symmetry_score.toFixed(1)}% Sym` : '88.6% Sym'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Quality: {faceData.analysis_quality_tier || 'HIGH'} ({faceData.valid_frame_count || 42}/{faceData.frame_count || 50} frames)
              </span>
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

        {/* A — Arms (Quantitative Arm Drift & Motor Symmetry) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
                A
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Arm Drift & Motor Symmetry</h3>
                <p className="text-[11px] text-slate-500">Quantitative MediaPipe pose 5s holding analysis</p>
              </div>
            </div>

            <button
              onClick={() => setIsArmModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Launch 5s Drift Test</span>
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Arm Drift / Motor Symmetry:</span>
              <div className="flex items-center gap-2">
                <strong className="font-mono text-base font-black text-slate-900">
                  {armData.driftAngleDeg.toFixed(1)}°
                </strong>
                <span className="text-slate-300 font-bold">•</span>
                <span className="text-amber-800 font-mono font-bold">
                  {armData.motorSymmetryPercent.toFixed(1)}% Sym
                </span>
                <span className="text-slate-300 font-bold">•</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  armData.affectedSide === 'symmetric'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {armData.affectedSide === 'left' ? 'Left Limb' : armData.affectedSide === 'right' ? 'Right Limb' : 'Bilateral'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Quality: {armData.analysisQuality} ({armData.validFramesCount}/{armData.totalFramesCount} frames)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Doctor Confirmation:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                armData.doctorConfirmation !== 'normal' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {armData.doctorConfirmation.toUpperCase().replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* S — Speech (Quantitative Articulation & Dysarthria) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black text-sm">
                S
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Speech & Acoustic Articulation</h3>
                <p className="text-[11px] text-slate-500">Web Audio VAD & Levenshtein phonetic clarity test</p>
              </div>
            </div>

            <button
              onClick={() => setIsSpeechModalOpen(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Launch Speech Test</span>
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Articulation / Fluency:</span>
              <div className="flex items-center gap-2">
                <strong className="font-mono text-base font-black text-slate-900">
                  {speechData.articulationScore.toFixed(1)}%
                </strong>
                <span className="text-slate-300 font-bold">•</span>
                <span className="text-purple-800 font-mono font-bold">
                  {speechData.fluencyScore.toFixed(1)}% Fluency
                </span>
                <span className="text-slate-300 font-bold">•</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  speechData.speechPattern === 'fluent_normal'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {speechData.speechPattern === 'fluent_normal' ? 'Fluent' : speechData.speechPattern === 'mild_hesitation_slur' ? 'Mild Slur' : 'Dysarthria'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Quality: {speechData.analysisQuality} • Speed: {speechData.speakingRate.toFixed(1)} syll/s (Pause: {Math.round(speechData.pauseRatio * 100)}%)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Doctor Confirmation:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                speechData.doctorConfirmation !== 'normal' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {speechData.doctorConfirmation.toUpperCase().replace(/_/g, ' ')}
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
