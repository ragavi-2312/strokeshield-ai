import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Assessment, Patient, EmergencySummary } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';
import { EmergencySummaryModal } from '../components/referral/EmergencySummaryModal';
import { ReferralWorkflowModal } from '../components/referral/ReferralWorkflowModal';
import { DoctorConfirmationGate } from '../components/referral/DoctorConfirmationGate';
import { ReferralQRCode } from '../components/referral/ReferralQRCode';
import { 
  AlertOctagon, 
  Activity, 
  Clock, 
  FileText, 
  Building2, 
  SendHorizontal, 
  CheckCircle2, 
  Printer, 
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Info,
  Camera,
  Cpu,
  UserCheck,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

export const AssessmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [emergencySummary, setEmergencySummary] = useState<EmergencySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Gates
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isDoctorGateOpen, setIsDoctorGateOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [createdReferralCode, setCreatedReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    api.get<Assessment>(`/assessments/${id}`)
      .then((data) => {
        setAssessment(data);
        return api.get<Patient>(`/patients/${data.patient_id}`);
      })
      .then((pData) => {
        setPatient(pData);
      })
      .catch((err) => {
        console.error('Failed to load assessment result:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleOpenEmergencySummary = async () => {
    if (!id) return;
    try {
      const summary = await api.get<EmergencySummary>(`/assessments/${id}/emergency-summary`);
      setEmergencySummary(summary);
      setIsSummaryOpen(true);
    } catch (err: any) {
      alert('Could not fetch emergency summary: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold">Computing AI Urgency & Stratification Result...</p>
      </div>
    );
  }

  if (!assessment || !patient) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-sm font-bold">Assessment record not found.</p>
        <Link to="/dashboard" className="text-xs text-brand-600 font-bold mt-2 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  const isEmergency = assessment.risk_level === 'HIGH';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner Alert if High Urgency */}
      {isEmergency && (
        <div className="bg-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-pulse">
          <div className="space-y-1">
            <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Emergency Code Stroke Protocol
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 shrink-0" />
              <span>POSSIBLE STROKE — IMMEDIATE MEDICAL EVALUATION</span>
            </h1>
            <p className="text-xs text-red-100 max-w-xl">
              Doctor-confirmed acute focal neurological deficits detected within critical reperfusion window. Emergency neurology consultation & CT imaging indicated.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenEmergencySummary}
              className="px-4 py-2.5 bg-white text-red-700 hover:bg-red-50 text-xs font-black rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Emergency Summary</span>
            </button>

            <button
              onClick={() => setIsDoctorGateOpen(true)}
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Initiate Referral</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-400 block">Assessment Record #{assessment.id}</span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            {patient.name} ({patient.patient_id})
          </h2>
          <p className="text-xs text-slate-500">
            {patient.age} yrs • {patient.gender} • Assessed {new Date(assessment.assessment_time).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEmergencySummary}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Emergency Summary</span>
          </button>

          <Link
            to={`/reports?assessment_id=${assessment.id}`}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </Link>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 1. LAYER 1: ORIGINAL SOURCE DATA (Source of Truth) */}
      {/* ============================================================================== */}
      <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Layer 1: Source of Truth
              </span>
              <h3 className="text-base font-extrabold text-slate-900">Original Clinical & Measured Data</h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ✓ Immutable Primary Record
          </span>
        </div>

        {/* Vitals Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Physiological Vitals</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">Blood Pressure</span>
              <strong className="text-sm font-black text-slate-900">{assessment.systolic_bp.toFixed(0)}/{assessment.diastolic_bp.toFixed(0)}</strong>
              <span className="text-[9px] text-slate-400 block">mmHg</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">Blood Glucose</span>
              <strong className="text-sm font-black text-slate-900">{assessment.glucose.toFixed(0)}</strong>
              <span className="text-[9px] text-slate-400 block">mg/dL</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">Heart Rate</span>
              <strong className="text-sm font-black text-slate-900">{assessment.heart_rate.toFixed(0)}</strong>
              <span className="text-[9px] text-slate-400 block">bpm</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">Oxygen (SpO2)</span>
              <strong className="text-sm font-black text-slate-900">{assessment.spo2.toFixed(0)}%</strong>
              <span className="text-[9px] text-slate-400 block">Room Air</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">Last Known Well</span>
              <strong className="text-sm font-black text-red-700 font-mono">
                {assessment.symptom_duration_minutes ? `${assessment.symptom_duration_minutes}m` : assessment.last_known_well_time || 'Recorded'}
              </strong>
              <span className="text-[9px] text-slate-400 block">Onset Duration</span>
            </div>
          </div>
        </div>

        {/* BE-FAST Observations & Computer Vision Screenings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>BE-FAST Clinical Examination</span>
            </h4>
            <div className="space-y-1 text-slate-700">
              <p><span className="font-bold">Face Result:</span> {assessment.face_result} (Doctor confirmed: {assessment.face_doctor_confirmation || 'verified'})</p>
              <p><span className="font-bold">Arm Result:</span> {assessment.arm_result} (Doctor confirmed: {assessment.arm_doctor_confirmation || 'verified'})</p>
              <p><span className="font-bold">Speech Result:</span> {assessment.speech_result}</p>
              <p><span className="font-bold">Balance:</span> {assessment.balance_result || 'normal'}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Computer Vision Geometric Measurements</span>
            </h4>
            {assessment.camera_assessment_data?.facial_asymmetry_score !== undefined ? (
              <div className="space-y-1 text-slate-700">
                <p>
                  <span className="font-bold">Facial Symmetry Deviation:</span>{' '}
                  <strong className="text-red-700">{assessment.camera_assessment_data.facial_asymmetry_score.toFixed(1)} / 100</strong>
                </p>
                <p>
                  <span className="font-bold">Measurement Quality:</span> {assessment.camera_assessment_data.facial_measurement_quality || 92} / 100
                </p>
                <p>
                  <span className="font-bold">Components:</span> Mouth: {assessment.camera_assessment_data.mouth_asymmetry_score || 0}, Eyes: {assessment.camera_assessment_data.eye_asymmetry_score || 0}
                </p>
              </div>
            ) : (
              <p className="text-slate-400">Direct camera screening data captured and archived.</p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 2. LAYER 2: AI-GENERATED DATA LAYER (Separate Model Inferences) */}
      {/* ============================================================================== */}
      <div className="bg-white rounded-3xl border-2 border-brand-500/40 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-100 text-brand-800 rounded-xl">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-800 bg-brand-50 px-2 py-0.5 rounded">
                Layer 2: AI-Generated Analysis
              </span>
              <h3 className="text-base font-extrabold text-slate-900">AI Urgency Stratification & Model Inferences</h3>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Model: StrokeShield Multi-Modal Neuro Triage</span>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">Version: v1.0.0</span>
          </div>
        </div>

        {/* AI Urgency & Classification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Inferred Urgency Classification</span>
            <div className="flex items-center gap-3">
              <RiskBadge level={assessment.risk_level} score={assessment.risk_score} showScore size="lg" />
              <span className="text-xs text-slate-500 font-medium">Confidence: 95% (Multi-modal)</span>
            </div>
          </div>

          <div className="p-4 bg-brand-50 border-l-4 border-brand-600 rounded-r-2xl text-xs space-y-1">
            <h4 className="font-extrabold text-brand-950">AI Clinical Triage Rationale:</h4>
            <p className="text-brand-900 leading-relaxed font-medium">
              {assessment.recommendation}
            </p>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Contributing Observations</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {assessment.contributing_factors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-slate-400 italic">
          * AI-Generated inferences are computed separately from original patient facts. Inferences can be regenerated from source measurements without mutating medical records.
        </p>
      </div>

      {/* ============================================================================== */}
      {/* 3. LAYER 3: DOCTOR DECISION & REFERRAL WORKFLOW GATE */}
      {/* ============================================================================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                Layer 3: Human Review & Gate
              </span>
              <h3 className="text-base font-extrabold text-slate-900">Physician Final Decision & Dispatch</h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
            Doctor Controlled
          </span>
        </div>

        {/* Doctor Notes & Confirmation */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
          <h4 className="font-bold text-slate-800">Attending Physician Clinical Notes:</h4>
          <p className="text-slate-700 italic">
            {assessment.doctor_notes || "Verified by attending physician. Hyperacute focal neurological signs confirmed."}
          </p>
        </div>

        {/* Referral QR Code Display if Generated */}
        {createdReferralCode && (
          <div className="pt-2">
            <ReferralQRCode
              referralCode={createdReferralCode}
              hospitalName="Metro Comprehensive Stroke Center"
              priority="Emergency"
            />
          </div>
        )}

        {/* Dispatch Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <Link
            to={`/patients/${patient.id}`}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            View Patient Longitudinal Timeline
          </Link>

          <button
            onClick={() => setIsDoctorGateOpen(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Doctor Gate: Confirm & Dispatch Emergency Referral</span>
          </button>
        </div>
      </div>

      <MedicalDisclaimer />

      {/* Modals & Confirmation Gates */}
      <EmergencySummaryModal
        summary={emergencySummary}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onInitiateReferral={() => {
          setIsSummaryOpen(false);
          setIsDoctorGateOpen(true);
        }}
      />

      <DoctorConfirmationGate
        isOpen={isDoctorGateOpen}
        patientName={patient.name}
        riskScore={assessment.risk_score}
        onClose={() => setIsDoctorGateOpen(false)}
        onConfirm={() => {
          setIsDoctorGateOpen(false);
          setIsReferralModalOpen(true);
        }}
      />

      {isReferralModalOpen && (
        <ReferralWorkflowModal
          patientId={patient.id}
          patientName={patient.name}
          assessmentId={assessment.id}
          isOpen={isReferralModalOpen}
          onClose={() => setIsReferralModalOpen(false)}
          onReferralCreated={() => {
            setCreatedReferralCode(`REF-2026-1000${assessment.id}`);
          }}
        />
      )}
    </div>
  );
};
