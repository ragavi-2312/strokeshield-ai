import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { api } from '../api/client';
import { PatientSummary, Assessment } from '../types';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  Smile, 
  Mic, 
  ShieldCheck, 
  User, 
  ChevronRight,
  ChevronLeft,
  Info,
  HeartPulse,
  Flame,
  FileText,
  AlertCircle
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

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>(
    initialPatientId ? parseInt(initialPatientId, 10) : ''
  );

  // Modals
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isArmModalOpen, setIsArmModalOpen] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);

  // Onset & Last Known Well
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
  const [immediateAction, setImmediateAction] = useState<string>('');
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
      setDiastolicBp(108);
      setGlucose(195);
      setHeartRate(88);
      setSpo2(96);
      setTemperature(37.1);
      setClinicalObservation('Acute onset right facial droop and right arm pronator drift verified via camera screening.');
      setImmediateAction('Activate Code Stroke. Emergency transfer to nearest Comprehensive Stroke Center.');
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
      setDiastolicBp(96);
      setGlucose(145);
      setHeartRate(78);
      setSpo2(97);
      setClinicalObservation('Dizziness and mild left arm paresthesia.');
      setImmediateAction('Stabilize vitals and obtain outpatient neuroimaging.');
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
      setClinicalObservation('Routine outpatient checkup.');
      setImmediateAction('Continue standard preventive care.');
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
          immediate_action: immediateAction,
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

  const selectedPatient = patients.find((p) => p.id === Number(selectedPatientId));

  const steps = [
    { num: 1, title: 'Patient Profile' },
    { num: 2, title: 'BE-FAST Neurological' },
    { num: 3, title: 'Time / Last Known Well' },
    { num: 4, title: 'Vitals Entry' },
    { num: 5, title: 'Review & AI Triage' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Top Header & Demo Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200/80 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Clinical Assessment
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-700" />
            <span>New Stroke Urgency Assessment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step patient triage, camera-assisted vision, and vital signs stratification.
          </p>
        </div>

        {/* Demo Preset Fillers */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demo Preset:</span>
          <button
            type="button"
            onClick={() => fillDemoCase('high')}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 rounded-xl text-xs font-bold border border-red-200 transition-colors cursor-pointer"
          >
            🚨 Acute Stroke (High)
          </button>
          <button
            type="button"
            onClick={() => fillDemoCase('moderate')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
          >
            ⚠️ Moderate
          </button>
          <button
            type="button"
            onClick={() => fillDemoCase('low')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
          >
            ✓ Low Risk
          </button>
        </div>
      </div>

      {/* STEP PROGRESS BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                  currentStep === s.num
                    ? 'text-teal-800'
                    : currentStep > s.num
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  currentStep === s.num
                    ? 'bg-teal-700 text-white'
                    : currentStep > s.num
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {s.num}
                </div>
                <span className="hidden md:inline">{s.title}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > s.num ? 'bg-teal-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: PATIENT SELECTION */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Step 1: Select Patient Record</h2>
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">SOURCE DATA</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an existing patient from the clinic registry.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Select Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
              required
              className="w-full px-4 py-3 text-xs sm:text-sm font-bold border border-slate-300 rounded-2xl bg-white focus:ring-2 focus:ring-teal-500/20 text-slate-900"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.patient_id}] {p.name} — {p.age} yrs • {p.gender}
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 font-bold">{selectedPatient.name}</strong>
                <span className="font-mono text-teal-800 font-black">{selectedPatient.patient_id}</span>
              </div>
              <p className="text-slate-600">
                Age: <strong>{selectedPatient.age}</strong> • Gender: <strong>{selectedPatient.gender}</strong>
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Next: BE-FAST Symptoms</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BE-FAST NEUROLOGICAL SCREENING */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Step 2: BE-FAST Neurological Screening
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Use camera vision or record attending physician observations.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
              AI SCREENING SUITE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* F — Face */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-700 text-white font-bold text-xs flex items-center justify-center">F</span>
                  <span className="font-bold text-slate-900 text-xs">Facial Asymmetry / Droop</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFaceModalOpen(true)}
                  className="px-2.5 py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-teal-200 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Face Camera</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setFaceResult('normal'); setFaceDoctorConfirmation('normal'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    faceResult === 'normal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ✓ Normal
                </button>
                <button
                  type="button"
                  onClick={() => { setFaceResult('possible_abnormality'); setFaceDoctorConfirmation('abnormal'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    faceResult === 'possible_abnormality' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ⚠️ Droop
                </button>
                <button
                  type="button"
                  onClick={() => { setFaceResult('unable_to_assess'); setFaceDoctorConfirmation('unable_to_assess'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
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
                  <span className="font-bold text-slate-900 text-xs">Arm Drift / Weakness</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArmModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-200 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>5s Drift Test</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setArmResult('normal'); setArmDoctorConfirmation('normal'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    armResult === 'normal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ✓ Normal
                </button>
                <button
                  type="button"
                  onClick={() => { setArmResult('possible_weakness'); setArmDoctorConfirmation('weakness_suspected'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    armResult === 'possible_weakness' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ⚠️ Weakness
                </button>
                <button
                  type="button"
                  onClick={() => { setArmResult('unable_to_assess'); setArmDoctorConfirmation('unable_to_assess'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
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
                  <span className="font-bold text-slate-900 text-xs">Speech Slurring</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSpeechModalOpen(true)}
                  className="px-2.5 py-1 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-200 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speech Test</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setSpeechResult('normal'); setSpeechDoctorConfirmation('normal'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    speechResult === 'normal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ✓ Normal
                </button>
                <button
                  type="button"
                  onClick={() => { setSpeechResult('possible_speech_difficulty'); setSpeechDoctorConfirmation('abnormal'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    speechResult === 'possible_speech_difficulty' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ⚠️ Slurred
                </button>
                <button
                  type="button"
                  onClick={() => { setSpeechResult('unable_to_assess'); setSpeechDoctorConfirmation('unable_to_assess'); }}
                  className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    speechResult === 'unable_to_assess' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ❓ Unable
                </button>
              </div>
            </div>

            {/* B & E — Balance & Eyes */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">BE</span>
                <span className="font-bold text-slate-900 text-xs">Balance & Visual Signs</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Balance</label>
                  <select
                    value={balanceResult}
                    onChange={(e) => setBalanceResult(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="sudden_loss">Sudden Loss / Ataxia</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Eyes / Vision</label>
                  <select
                    value={eyesResult}
                    onChange={(e) => setEyesResult(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="diplopia">Gaze Deviation / Diplopia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next: Last Known Well</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: TIME / LAST KNOWN WELL */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Step 3: Symptom Timing & Last Known Well (LKW)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact timing determines IV-thrombolysis (4.5h) and mechanical thrombectomy eligibility.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
              GOLDEN HOUR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Time Last Normal / Symptom Onset</label>
              <input
                type="time"
                value={lastKnownWellTime}
                onChange={(e) => setLastKnownWellTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
              <p className="text-[11px] text-slate-400">Timestamp when patient was last verified completely symptom-free.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Elapsed Minutes Since Onset</label>
              <input
                type="number"
                value={symptomDurationMinutes}
                onChange={(e) => setSymptomDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500">Therapeutic Window:</span>
                <span className={`font-black ${symptomDurationMinutes <= 270 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {symptomDurationMinutes <= 270 ? '🟢 Within 4.5h Window' : '🟡 Extended Window (>4.5h)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next: Vitals Entry</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: VITALS ENTRY (Section 8) */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Step 4: Hemodynamic Vital Signs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Measured at clinic triage. Abnormal values are highlighted for clinical review.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
              DEVICE MEASUREMENT
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">Systolic BP</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(Number(e.target.value))}
                  required
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">mmHg</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">Diastolic BP</label>
              <input
                type="number"
                value={diastolicBp}
                onChange={(e) => setDiastolicBp(Number(e.target.value))}
                required
                className="w-full px-2 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">mmHg</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">Blood Glucose</label>
              <input
                type="number"
                value={glucose}
                onChange={(e) => setGlucose(Number(e.target.value))}
                required
                className="w-full px-2 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">mg/dL</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">Heart Rate</label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                required
                className="w-full px-2 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">bpm</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">SpO2</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value))}
                required
                className="w-full px-2 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">Temp</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">°C</span>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next: Review & Submit</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CLINICAL NOTES & AI TRIAGE SUBMIT */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Step 5: Physician Clinical Notes & AI Triage
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review all source facts before generating the multi-modal AI urgency prediction.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
              READY FOR AI
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Physician Clinical Narrative</label>
              <textarea
                rows={2}
                value={clinicalObservation}
                onChange={(e) => setClinicalObservation(e.target.value)}
                placeholder="e.g. Acute right facial asymmetry and arm pronator drift observed during exam..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Immediate Action / Orders</label>
              <textarea
                rows={2}
                value={immediateAction}
                onChange={(e) => setImmediateAction(e.target.value)}
                placeholder="e.g. Initiate Stroke Protocol, notify nearest emergency department..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Submission Gate */}
          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-900 leading-relaxed">
              <strong>Clinical Decision Gate:</strong> Submitting this encounter will invoke the multi-modal AI urgency model (v1.0.0). Results will be stored in Layer 2 and require your final authorization before emergency dispatch.
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md shadow-teal-700/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>{isSubmitting ? 'Running AI Stratification...' : 'Assess Stroke Urgency & Triage'}</span>
            </button>
          </div>
        </div>
      )}

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
            facial_symmetry_score: res.facial_symmetry_score,
            facial_measurement_quality: res.facial_measurement_quality,
            analysis_quality_tier: res.analysis_quality_tier,
            mouth_asymmetry_score: res.mouth_asymmetry_score,
            eye_asymmetry_score: res.eye_asymmetry_score,
            eyebrow_asymmetry_score: res.eyebrow_asymmetry_score,
            cheek_asymmetry_score: res.cheek_asymmetry_score,
            jaw_asymmetry_score: res.jaw_asymmetry_score,
            highest_asymmetry_region: res.highest_asymmetry_region,
            frame_count: res.frame_count,
            valid_frame_count: res.valid_frame_count,
            rejected_frame_count: res.rejected_frame_count,
            median_score: res.median_score,
            mean_score: res.mean_score,
            standard_deviation: res.standard_deviation,
            head_yaw: res.head_yaw,
            head_pitch: res.head_pitch,
            head_roll: res.head_roll,
            model_name: res.model_name,
            model_version: res.model_version,
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
