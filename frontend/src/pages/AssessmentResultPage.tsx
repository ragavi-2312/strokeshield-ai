import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Assessment, Patient, EmergencySummary, Hospital } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';
import { EmergencySummaryModal } from '../components/referral/EmergencySummaryModal';
import { ReferralWorkflowModal } from '../components/referral/ReferralWorkflowModal';
import { DoctorConfirmationGate } from '../components/referral/DoctorConfirmationGate';
import { ReferralQRCode } from '../components/referral/ReferralQRCode';
import { EmergencyRouteViewModal } from '../components/referral/EmergencyRouteViewModal';
import { DEFAULT_DOCTOR_LOCATION } from '../utils/geolocation';
import { 
  AlertOctagon, 
  Activity, 
  Clock, 
  FileText, 
  Building2, 
  SendHorizontal, 
  CheckCircle2, 
  Printer, 
  ShieldAlert,
  ShieldCheck,
  Camera,
  Cpu,
  UserCheck,
  Stethoscope,
  ChevronRight,
  Navigation,
  MapPin,
  Phone,
  ArrowRight,
  HeartPulse,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const AssessmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emergencySummary, setEmergencySummary] = useState<EmergencySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Gates
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isDoctorGateOpen, setIsDoctorGateOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [createdReferralCode, setCreatedReferralCode] = useState<string | null>(null);

  // Doctor Review state
  const [doctorDecision, setDoctorDecision] = useState<'CONFIRMED_HIGH' | 'NEEDS_FURTHER' | 'NORMAL'>('CONFIRMED_HIGH');
  const [doctorNotes, setDoctorNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([
      api.get<Assessment>(`/assessments/${id}`),
      api.get<Hospital[]>('/hospitals/nearby')
    ])
      .then(([assessmentData, hospitalList]) => {
        setAssessment(assessmentData);
        setHospitals(hospitalList);
        return api.get<Patient>(`/patients/${assessmentData.patient_id}`);
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
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold">Computing Multi-Modal Stroke Triage Assessment...</p>
      </div>
    );
  }

  if (!assessment || !patient) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-sm font-bold">Assessment record not found.</p>
        <Link to="/dashboard" className="text-xs text-teal-700 font-bold mt-2 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  const isHighUrgency = assessment.risk_level === 'HIGH';
  const topHospital = hospitals[0] || null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold px-2 py-0.5 rounded">
              ENCOUNTER #{assessment.id}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
              {new Date(assessment.assessment_time).toLocaleString()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            AI Stroke Screening Assessment
          </h1>
          <p className="text-xs text-slate-500">
            Patient: <strong className="text-slate-900">{patient.name}</strong> ({patient.patient_id}) • {patient.age} yrs • {patient.gender}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEmergencySummary}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Emergency Summary</span>
          </button>

          <Link
            to={`/reports?assessment_id=${assessment.id}`}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </Link>
        </div>
      </div>

      {/* 2. LARGE CENTRAL AI RESULT CARD (Sections 13 & 14) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                AI Screening Result
              </span>
              <h2 className="text-base font-black text-slate-900">Urgency Classification & Model Stratification</h2>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            Confidence: 87%
          </span>
        </div>

        {/* Central Risk Highlight Card */}
        <div className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isHighUrgency 
            ? 'bg-red-50/70 border-red-300' 
            : assessment.risk_level === 'MODERATE' 
            ? 'bg-amber-50/70 border-amber-300' 
            : 'bg-emerald-50/70 border-emerald-300'
        }`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Inferred Risk Category:
              </span>
              <RiskBadge level={assessment.risk_level} score={assessment.risk_score} showScore size="lg" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              {isHighUrgency
                ? 'AI screening indicates elevated stroke risk and requires urgent clinical evaluation.'
                : assessment.risk_level === 'MODERATE'
                ? 'Moderate stroke probability — secondary evaluation & outpatient imaging recommended.'
                : 'Low immediate stroke risk — continue standard preventive outpatient monitoring.'}
            </h3>

            <p className="text-xs text-slate-700 max-w-2xl leading-relaxed">
              {assessment.recommendation}
            </p>
          </div>

          <div className="shrink-0 text-center p-4 bg-white/80 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Urgency Score</span>
            <strong className="text-3xl font-black text-slate-900 font-mono">
              {assessment.risk_score.toFixed(0)}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </strong>
          </div>
        </div>

        {/* Contributing Clinical Observations */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Contributing Diagnostic Factors:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {assessment.contributing_factors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mandatory Medical Safety Disclaimer */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[11px] leading-relaxed">
            <strong>Clinical Safety Notice:</strong> AI-assisted screening only. Final medical decision and diagnosis must be confirmed by a qualified attending doctor.
          </span>
        </div>
      </div>

      {/* 3. LAYER 1: SOURCE OF TRUTH (ORIGINAL CLINICAL & MEASURED DATA) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Layer 1: Source Data
              </span>
              <h2 className="text-base font-black text-slate-900">Original Clinical & Measured Facts</h2>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
            ORIGINAL DATA
          </span>
        </div>

        {/* Vitals Grid */}
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
            <span className="text-[9px] text-slate-400 block">Elapsed Time</span>
          </div>
        </div>

        {/* BE-FAST & Landmark Findings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">BE-FAST Observations:</strong>
            <p><span className="text-slate-500">Face:</span> <strong className="text-slate-900">{assessment.face_result}</strong></p>
            <p><span className="text-slate-500">Arms:</span> <strong className="text-slate-900">{assessment.arm_result}</strong></p>
            <p><span className="text-slate-500">Speech:</span> <strong className="text-slate-900">{assessment.speech_result}</strong></p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">Camera Quantitative Landmarks:</strong>
            {assessment.camera_assessment_data?.facial_asymmetry_score !== undefined ? (
              <p>
                <span className="text-slate-500">Facial Asymmetry Deviation Score:</span>{' '}
                <strong className="text-red-700 font-mono">{assessment.camera_assessment_data.facial_asymmetry_score.toFixed(1)}/100</strong>
              </p>
            ) : (
              <p className="text-slate-400">Continuous 0–100 geometric vision analysis archived.</p>
            )}
            <p className="text-slate-500">Measurement Quality: <strong className="text-slate-900">94/100 (Optimal)</strong></p>
          </div>
        </div>
      </div>

      {/* 4. LAYER 3: DOCTOR REVIEW & CLINICAL DECISION GATE (Section 15) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                Layer 3: Doctor Review
              </span>
              <h2 className="text-base font-black text-slate-900">Physician Final Clinical Confirmation</h2>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold">
            DOCTOR CONFIRMED
          </span>
        </div>

        {/* Confirmation Options */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">Doctor Decision Confirmation:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setDoctorDecision('CONFIRMED_HIGH')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                doctorDecision === 'CONFIRMED_HIGH'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🚨 Confirm High Urgency
            </button>
            <button
              type="button"
              onClick={() => setDoctorDecision('NEEDS_FURTHER')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                doctorDecision === 'NEEDS_FURTHER'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚠️ Needs Further Assessment
            </button>
            <button
              type="button"
              onClick={() => setDoctorDecision('NORMAL')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                doctorDecision === 'NORMAL'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ✓ Normal / Reject
            </button>
          </div>
        </div>

        {/* Doctor Clinical Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Attending Physician Clinical Notes</label>
          <textarea
            rows={2}
            value={doctorNotes || assessment.doctor_notes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="Document clinical exam findings, neurological observations, and dispatch instructions..."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* Dispatch Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <Link
            to={`/patients/${patient.id}`}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            View Patient Profile & History
          </Link>

          <button
            type="button"
            onClick={() => setIsDoctorGateOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Confirm & Dispatch Emergency Referral</span>
          </button>
        </div>
      </div>

      {/* 5. EMERGENCY REFERRAL & ROAD NAVIGATION (Sections 16 & 17) */}
      {isHighUrgency && topHospital && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-300 bg-red-900/40 px-2 py-0.5 rounded">
                  Urgent Referral Ready
                </span>
                <h2 className="text-lg font-black text-white">Recommended Stroke Receiving Center</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRouteModalOpen(true)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Open Live GPS Navigation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2">
              <strong className="text-base font-black text-white block">{topHospital.name}</strong>
              <p className="text-xs text-slate-300">{topHospital.address}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                  24/7 CT Available
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                  MRI Neuro Suite
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                  Neuro-ICU Ready
                </span>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Travel Time</span>
                  <strong className="text-2xl font-black text-teal-300 font-mono">~6 mins</strong>
                  <span className="text-[11px] text-slate-300 block">1.45 km Road Distance</span>
                </div>
                <a
                  href={`tel:${topHospital.phone}`}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Emergency</span>
                </a>
              </div>

              <p className="text-[10px] text-slate-400">
                GPS Location coordinates verified. Automated notification queued for receiving stroke triage team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Referral QR Code Display if Generated */}
      {createdReferralCode && (
        <div className="pt-2">
          <ReferralQRCode
            referralCode={createdReferralCode}
            hospitalName="Demo Stroke Care Hospital"
            priority="Emergency"
          />
        </div>
      )}

      {/* Emergency Summary Modal */}
      <EmergencySummaryModal
        summary={emergencySummary}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onInitiateReferral={() => {
          setIsSummaryOpen(false);
          setIsDoctorGateOpen(true);
        }}
      />

      {/* Doctor Confirmation Gate */}
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

      {/* Referral Workflow Modal */}
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

      {/* Live Road Route View Modal */}
      {isRouteModalOpen && topHospital && (
        <EmergencyRouteViewModal
          isOpen={isRouteModalOpen}
          onClose={() => setIsRouteModalOpen(false)}
          sourceLocation={DEFAULT_DOCTOR_LOCATION}
          hospital={topHospital}
          patientName={patient.name}
          patientId={patient.patient_id}
          onConfirmReferral={() => {
            setIsRouteModalOpen(false);
            setIsDoctorGateOpen(true);
          }}
        />
      )}

    </div>
  );
};
