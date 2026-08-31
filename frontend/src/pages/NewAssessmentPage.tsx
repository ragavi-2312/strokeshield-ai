import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { PatientSummary, Assessment } from '../types';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Camera, 
  Smile, 
  Mic, 
  ShieldCheck, 
  User, 
  ChevronRight,
  Info
} from 'lucide-react';
import { FaceScreeningModal } from '../components/camera/FaceScreeningModal';
import { ArmScreeningModal } from '../components/camera/ArmScreeningModal';
import { SpeechScreeningModal } from '../components/camera/SpeechScreeningModal';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';

export const NewAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patient_id');

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>(
    initialPatientId ? parseInt(initialPatientId, 10) : ''
  );

  // Modals
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isArmModalOpen, setIsArmModalOpen] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);

  // Onset & Last Known Well
  const [onsetCategory, setOnsetCategory] = useState<'exact' | 'approx' | 'unknown'>('exact');
  const [lastKnownWellTime, setLastKnownWellTime] = useState<string>('08:30');
  const [symptomDurationMinutes, setSymptomDurationMinutes] = useState<number>(45);

  // FAST & BE-FAST Assessment state
  const [faceResult, setFaceResult] = useState<string>('normal');
  const [faceAiObservation, setFaceAiObservation] = useState<string>('no_obvious_asymmetry');
  const [faceDoctorConfirmation, setFaceDoctorConfirmation] = useState<string>('normal');

  const [armResult, setArmResult] = useState<string>('normal');
  const [armAiObservation, setArmAiObservation] = useState<string>('no_obvious_drift');
  const [armDoctorConfirmation, setArmDoctorConfirmation] = useState<string>('normal');

  const [speechResult, setSpeechResult] = useState<string>('normal');
  const [speechAiObservation, setSpeechAiObservation] = useState<string>('normal_speech_pattern');
  const [speechDoctorConfirmation, setSpeechDoctorConfirmation] = useState<string>('normal');

  const [balanceResult, setBalanceResult] = useState<string>('normal');
  const [eyesResult, setEyesResult] = useState<string>('normal');

  // Vitals
  const [systolicBp, setSystolicBp] = useState<number>(120);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [glucose, setGlucose] = useState<number>(100);
  const [heartRate, setHeartRate] = useState<number>(75);
  const [spo2, setSpo2] = useState<number>(98);
  const [temperature, setTemperature] = useState<number>(37.0);

  // Structured Doctor Notes
  const [clinicalObservation, setClinicalObservation] = useState<string>('');
  const [additionalSymptoms, setAdditionalSymptoms] = useState<string>('');
  const [immediateAction, setImmediateAction] = useState<string>('');
  const [followUp, setFollowUp] = useState<string>('');

  const [cameraMetrics, setCameraMetrics] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get<PatientSummary[]>('/patients')
      .then((data) => {
        setPatients(data);
        if (!selectedPatientId && data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Hydrate prefilled state if navigating from BE-FAST Center
  useEffect(() => {
    const passedBefast = (location.state as any)?.befast;
    if (passedBefast) {
      if (passedBefast.balance_result) setBalanceResult(passedBefast.balance_result);
      if (passedBefast.eyes_result) setEyesResult(passedBefast.eyes_result);
      if (passedBefast.face_result) setFaceResult(passedBefast.face_result);
      if (passedBefast.face_ai_observation) setFaceAiObservation(passedBefast.face_ai_observation);
      if (passedBefast.face_doctor_confirmation) setFaceDoctorConfirmation(passedBefast.face_doctor_confirmation);
      if (passedBefast.arm_result) setArmResult(passedBefast.arm_result);
      if (passedBefast.arm_ai_observation) setArmAiObservation(passedBefast.arm_ai_observation);
      if (passedBefast.arm_doctor_confirmation) setArmDoctorConfirmation(passedBefast.arm_doctor_confirmation);
      if (passedBefast.speech_result) setSpeechResult(passedBefast.speech_result);
      if (passedBefast.speech_ai_observation) setSpeechAiObservation(passedBefast.speech_ai_observation);
      if (passedBefast.speech_doctor_confirmation) setSpeechDoctorConfirmation(passedBefast.speech_doctor_confirmation);
      if (passedBefast.last_known_well_time) setLastKnownWellTime(passedBefast.last_known_well_time);
      if (passedBefast.symptom_duration_minutes) setSymptomDurationMinutes(passedBefast.symptom_duration_minutes);
      if (passedBefast.camera_assessment_data) setCameraMetrics(passedBefast.camera_assessment_data);
    }
  }, [location.state]);

  const fillDemoCase = (type: 'high' | 'moderate' | 'low') => {
    if (type === 'high') {
      setLastKnownWellTime('08:15');
      setSymptomDurationMinutes(45);
      setFaceResult('possible_abnormality');
      setFaceAiObservation('possible_facial_asymmetry');
      setFaceDoctorConfirmation('abnormal');
      setArmResult('possible_weakness');
      setArmAiObservation('possible_arm_drift');
      setArmDoctorConfirmation('weakness_suspected');
      setSpeechResult('possible_speech_difficulty');
      setSpeechAiObservation('possible_speech_mismatch');
      setSpeechDoctorConfirmation('abnormal');
      setBalanceResult('sudden_loss');
      setEyesResult('normal');
      setSystolicBp(188);
      setDiastolicBp(110);
      setGlucose(195);
      setHeartRate(88);
      setSpo2(96);
      setTemperature(37.1);
      setClinicalObservation('Acute onset right facial droop and right arm pronator drift verified via camera screening.');
      setImmediateAction('Activate Code Stroke. Emergency transfer to Metro Comprehensive Stroke Center.');
    } else if (type === 'moderate') {
      setLastKnownWellTime('04:00');
      setSymptomDurationMinutes(300);
      setFaceResult('normal');
      setFaceAiObservation('no_obvious_asymmetry');
      setFaceDoctorConfirmation('normal');
      setArmResult('possible_numbness');
      setArmAiObservation('no_obvious_drift');
      setArmDoctorConfirmation('weakness_suspected');
      setSpeechResult('normal');
      setSpeechAiObservation('normal_speech_pattern');
      setSpeechDoctorConfirmation('normal');
      setBalanceResult('sudden_loss');
      setEyesResult('normal');
      setSystolicBp(158);
      setDiastolicBp(95);
      setGlucose(145);
      setHeartRate(78);
      setSpo2(97);
      setClinicalObservation('Dizziness and mild left arm paresthesia.');
      setImmediateAction('Stabilize vitals and obtain outpatient MRI.');
    } else {
      setLastKnownWellTime('10:00');
      setSymptomDurationMinutes(15);
      setFaceResult('normal');
      setFaceAiObservation('no_obvious_asymmetry');
      setFaceDoctorConfirmation('normal');
      setArmResult('normal');
      setArmAiObservation('no_obvious_drift');
      setArmDoctorConfirmation('normal');
      setSpeechResult('normal');
      setSpeechAiObservation('normal_speech_pattern');
      setSpeechDoctorConfirmation('normal');
      setBalanceResult('normal');
      setEyesResult('normal');
      setSystolicBp(120);
      setDiastolicBp(80);
      setGlucose(95);
      setHeartRate(72);
      setSpo2(99);
      setClinicalObservation('Routine wellness follow-up.');
      setImmediateAction('Continue lifestyle modification.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patient_id: Number(selectedPatientId),
        symptom_onset: new Date().toISOString(),
        last_known_well_time: lastKnownWellTime,
        symptom_duration_minutes: symptomDurationMinutes,
        face_result: faceResult,
        face_ai_observation: faceAiObservation,
        face_doctor_confirmation: faceDoctorConfirmation,
        arm_result: armResult,
        arm_ai_observation: armAiObservation,
        arm_doctor_confirmation: armDoctorConfirmation,
        speech_result: speechResult,
        speech_ai_observation: speechAiObservation,
        speech_doctor_confirmation: speechDoctorConfirmation,
        balance_result: balanceResult,
        eyes_result: eyesResult,
        systolic_bp: Number(systolicBp),
        diastolic_bp: Number(diastolicBp),
        glucose: Number(glucose),
        heart_rate: Number(heartRate),
        spo2: Number(spo2),
        temperature: Number(temperature),
        doctor_notes: clinicalObservation || 'Comprehensive stroke triage assessment.',
        structured_notes: {
          clinical_observation: clinicalObservation,
          additional_symptoms: additionalSymptoms,
          immediate_action: immediateAction,
          follow_up: followUp,
        },
        camera_assessment_data: cameraMetrics,
      };

      const result = await api.post<Assessment>('/assessments', payload);
      navigate(`/assessment/result/${result.id}`);
    } catch (err: any) {
      alert('Failed to save assessment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Demo Shortcut Pre-fillers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            <span>New Stroke Urgency Assessment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured FAST & BE-FAST screening with optional camera landmark detection and hemodynamic vitals stratification.
          </p>
        </div>

        {/* Demo Fast Fill Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400">Demo Fill:</span>
          <button
            type="button"
            onClick={() => fillDemoCase('high')}
            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold border border-red-200 transition-colors"
          >
            🚨 Acute Stroke Case
          </button>
          <button
            type="button"
            onClick={() => fillDemoCase('moderate')}
            className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors"
          >
            ⚠️ Moderate Risk
          </button>
          <button
            type="button"
            onClick={() => fillDemoCase('low')}
            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
          >
            ✓ Low Risk
          </button>
        </div>
      </div>

      <MedicalDisclaimer variant="card" />

      {/* Patient Selection Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" />
          <span>Select Target Patient Record:</span>
        </label>
        
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(Number(e.target.value))}
          required
          className="w-full px-4 py-3 text-sm font-bold border border-slate-300 rounded-2xl bg-white focus:ring-2 focus:ring-brand-500/20 text-slate-900"
        >
          <option value="">-- Choose Patient --</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.patient_id} — {p.name} ({p.age} yrs • {p.gender})
            </option>
          ))}
        </select>
      </div>

      {/* Section 1: BE-FAST Assessment Suite */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              1. BE-FAST Acute Neurological Screening
            </h2>
            <p className="text-xs text-slate-500">
              Use camera computer vision or enter direct manual clinical findings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* F — Face */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">F</span>
                <span className="font-extrabold text-slate-900 text-xs">Facial Asymmetry / Droop</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFaceModalOpen(true)}
                className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-brand-200"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Check</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setFaceResult('normal'); setFaceDoctorConfirmation('normal'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  faceResult === 'normal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ✓ Normal
              </button>
              <button
                type="button"
                onClick={() => { setFaceResult('possible_abnormality'); setFaceDoctorConfirmation('abnormal'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  faceResult === 'possible_abnormality' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ⚠️ Droop
              </button>
              <button
                type="button"
                onClick={() => { setFaceResult('unable_to_assess'); setFaceDoctorConfirmation('unable_to_assess'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  faceResult === 'unable_to_assess' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ❓ Unable
              </button>
            </div>
          </div>

          {/* A — Arms */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center">A</span>
                <span className="font-extrabold text-slate-900 text-xs">Arm Drift / Weakness</span>
              </div>
              <button
                type="button"
                onClick={() => setIsArmModalOpen(true)}
                className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-200"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>5s Drift Test</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setArmResult('normal'); setArmDoctorConfirmation('normal'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  armResult === 'normal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ✓ Normal
              </button>
              <button
                type="button"
                onClick={() => { setArmResult('possible_weakness'); setArmDoctorConfirmation('weakness_suspected'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  armResult === 'possible_weakness' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ⚠️ Weakness
              </button>
              <button
                type="button"
                onClick={() => { setArmResult('unable_to_assess'); setArmDoctorConfirmation('unable_to_assess'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  armResult === 'unable_to_assess' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ❓ Unable
              </button>
            </div>
          </div>

          {/* S — Speech */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center">S</span>
                <span className="font-extrabold text-slate-900 text-xs">Speech Slurring / Articulation</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSpeechModalOpen(true)}
                className="px-2.5 py-1 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-200"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Speech Test</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setSpeechResult('normal'); setSpeechDoctorConfirmation('normal'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  speechResult === 'normal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ✓ Normal
              </button>
              <button
                type="button"
                onClick={() => { setSpeechResult('possible_speech_difficulty'); setSpeechDoctorConfirmation('abnormal'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  speechResult === 'possible_speech_difficulty' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ⚠️ Slurred
              </button>
              <button
                type="button"
                onClick={() => { setSpeechResult('unable_to_assess'); setSpeechDoctorConfirmation('unable_to_assess'); }}
                className={`py-2 px-2 rounded-xl font-bold border transition-all ${
                  speechResult === 'unable_to_assess' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ❓ Unable
              </button>
            </div>
          </div>

          {/* T — Time / Last Known Well */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">T</span>
              <span className="font-extrabold text-slate-900 text-xs">Last Known Well Timing</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Time Last Normal</label>
                <input
                  type="time"
                  value={lastKnownWellTime}
                  onChange={(e) => setLastKnownWellTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Elapsed Mins</label>
                <input
                  type="number"
                  value={symptomDurationMinutes}
                  onChange={(e) => setSymptomDurationMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Vital Signs Input */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          2. Hemodynamic Vital Signs
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Systolic BP (mmHg)</label>
            <input
              type="number"
              value={systolicBp}
              onChange={(e) => setSystolicBp(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Diastolic BP (mmHg)</label>
            <input
              type="number"
              value={diastolicBp}
              onChange={(e) => setDiastolicBp(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Blood Glucose (mg/dL)</label>
            <input
              type="number"
              value={glucose}
              onChange={(e) => setGlucose(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Heart Rate (bpm)</label>
            <input
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">SpO2 (%)</label>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Structured Doctor Notes */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          3. Physician Clinical Narrative & Orders
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Clinical Observation</label>
            <textarea
              rows={2}
              value={clinicalObservation}
              onChange={(e) => setClinicalObservation(e.target.value)}
              placeholder="e.g. Right facial droop with pronator weakness..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Immediate Action / Orders</label>
            <textarea
              rows={2}
              value={immediateAction}
              onChange={(e) => setImmediateAction(e.target.value)}
              placeholder="e.g. Code Stroke pre-notification, CTA ordered..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all disabled:bg-slate-400"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSubmitting ? 'Calculating Urgency...' : 'Assess Stroke Urgency & Triage'}</span>
        </button>
      </div>

      {/* Camera Screening Modals */}
      <FaceScreeningModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onConfirmResult={(res) => {
          setFaceAiObservation(res.ai_face_observation);
          setFaceDoctorConfirmation(res.doctor_face_confirmation);
          setFaceResult(res.doctor_face_confirmation !== 'Normal' ? 'possible_abnormality' : 'normal');
          if (res.doctor_face_notes) {
            setClinicalObservation((prev) => prev ? `${prev}\nFace Screening Notes: ${res.doctor_face_notes}` : `Face Screening Notes: ${res.doctor_face_notes}`);
          }
          setCameraMetrics((prev) => ({
            ...prev,
            facial_asymmetry_score: res.facial_asymmetry_score,
            facial_measurement_quality: res.facial_measurement_quality,
            mouth_asymmetry_score: res.mouth_asymmetry_score,
            eye_asymmetry_score: res.eye_asymmetry_score,
            eyebrow_asymmetry_score: res.eyebrow_asymmetry_score,
            cheek_asymmetry_score: res.cheek_asymmetry_score,
            smile_asymmetry_score: res.smile_asymmetry_score,
            frame_count: res.frame_count,
            median_score: res.median_score,
            mean_score: res.mean_score,
            standard_deviation: res.standard_deviation,
            head_yaw: res.head_yaw,
            head_pitch: res.head_pitch,
            head_roll: res.head_roll,
            snapshot_timestamp: res.screening_timestamp,
          }));
        }}
      />

      <ArmScreeningModal
        isOpen={isArmModalOpen}
        onClose={() => setIsArmModalOpen(false)}
        onConfirm={(res) => {
          setArmAiObservation(res.aiObservation);
          setArmDoctorConfirmation(res.doctorConfirmation);
          setArmResult(res.doctorConfirmation !== 'normal' ? 'possible_weakness' : 'normal');
          setCameraMetrics((prev) => ({ ...prev, arm_drift_delta_px: res.driftDeltaPx }));
        }}
      />

      <SpeechScreeningModal
        isOpen={isSpeechModalOpen}
        onClose={() => setIsSpeechModalOpen(false)}
        onConfirm={(res) => {
          setSpeechAiObservation(res.aiObservation);
          setSpeechDoctorConfirmation(res.doctorConfirmation);
          setSpeechResult(res.doctorConfirmation === 'abnormal' ? 'possible_speech_difficulty' : 'normal');
        }}
      />
    </form>
  );
};
