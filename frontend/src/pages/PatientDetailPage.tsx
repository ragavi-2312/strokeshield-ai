import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Patient, Assessment, Referral, TimelineItem, VitalsPoint, EmergencySummary } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { PatientVitalsChart } from '../components/patient/PatientVitalsChart';
import { PatientTimeline } from '../components/patient/PatientTimeline';
import { EmergencySummaryModal } from '../components/referral/EmergencySummaryModal';
import { ReferralWorkflowModal } from '../components/referral/ReferralWorkflowModal';
import { 
  User, 
  Phone, 
  Calendar, 
  Heart, 
  Activity, 
  SendHorizontal, 
  Clock, 
  FileText, 
  ArrowLeft, 
  Plus, 
  AlertOctagon, 
  CheckCircle2, 
  MapPin, 
  Shield, 
  Building2,
  Stethoscope
} from 'lucide-react';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<VitalsPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessments' | 'vitals' | 'referrals' | 'timeline' | 'notes'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedSummary, setSelectedSummary] = useState<EmergencySummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  const fetchPatientData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [pData, aData, rData, tData, vData] = await Promise.all([
        api.get<Patient>(`/patients/${id}`),
        api.get<Assessment[]>(`/assessments/patient/${id}`),
        api.get<Referral[]>('/referrals'),
        api.get<TimelineItem[]>(`/patients/${id}/timeline`),
        api.get<VitalsPoint[]>(`/patients/${id}/vitals-history`),
      ]);

      setPatient(pData);
      setAssessments(aData);
      // filter referrals for this patient
      setReferrals(rData.filter((r) => r.patient_id === Number(id)));
      setTimeline(tData);
      setVitalsHistory(vData);
    } catch (err) {
      console.error('Failed to load patient profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleOpenEmergencySummary = async (assessmentId: number) => {
    try {
      const summary = await api.get<EmergencySummary>(`/assessments/${assessmentId}/emergency-summary`);
      setSelectedSummary(summary);
      setIsSummaryOpen(true);
    } catch (err: any) {
      alert('Could not generate emergency summary: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading patient longitudinal medical record...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 space-y-3">
        <p className="font-bold text-slate-800">Patient profile not found.</p>
        <Link to="/patients" className="text-xs text-brand-600 font-semibold underline">
          Return to Patients List
        </Link>
      </div>
    );
  }

  const latestAssessment = assessments[0];
  const medHist = patient.medical_history || {};

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Patient Registry</span>
      </Link>

      {/* Top Patient Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          {/* Avatar Placeholder */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 to-teal-500 flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0">
            {patient.name.charAt(0)}
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900">{patient.name}</h1>
              <span className="font-mono bg-brand-50 text-brand-700 border border-brand-200 text-xs px-2 py-0.5 rounded-md font-bold">
                {patient.patient_id}
              </span>
              {latestAssessment && (
                <RiskBadge level={latestAssessment.risk_level} score={latestAssessment.risk_score} showScore size="sm" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
              <span>
                <strong>Age/Gender:</strong> {patient.age} yrs • {patient.gender}
              </span>
              <span>
                <strong>DOB:</strong> {patient.dob}
              </span>
              <span>
                <strong>Phone:</strong> {patient.phone}
              </span>
            </div>

            <div className="text-xs text-slate-500 pt-0.5">
              <span className="text-red-700 font-semibold">Emergency Contact:</span> {patient.emergency_contact_name} ({patient.emergency_contact_phone})
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link
            to={`/assessment/new?patient_id=${patient.id}`}
            className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span>New Stroke Assessment</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Medical History & Factors' },
          { key: 'assessments', label: `Assessments (${assessments.length})` },
          { key: 'vitals', label: 'Vitals & Urgency Trends' },
          { key: 'referrals', label: `Hospital Referrals (${referrals.length})` },
          { key: 'timeline', label: 'Longitudinal Timeline' },
          { key: 'notes', label: 'Doctor Notes' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-brand-600 border-t-2 border-brand-600 shadow-sm border-x border-slate-200 -mb-1'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-brand-600" />
                <span>Cardiovascular & Stroke Risk Factors</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border text-xs ${medHist.hypertension ? 'bg-red-50/70 border-red-200 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <strong>Hypertension:</strong> {medHist.hypertension ? 'Documented' : 'No'}
                </div>
                <div className={`p-3 rounded-xl border text-xs ${medHist.diabetes ? 'bg-red-50/70 border-red-200 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <strong>Diabetes Mellitus:</strong> {medHist.diabetes ? 'Documented' : 'No'}
                </div>
                <div className={`p-3 rounded-xl border text-xs ${medHist.previous_stroke ? 'bg-red-100 border-red-300 text-red-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <strong>Prior Stroke / TIA:</strong> {medHist.previous_stroke ? 'YES (High Baseline)' : 'No'}
                </div>
                <div className={`p-3 rounded-xl border text-xs ${medHist.heart_disease ? 'bg-red-50/70 border-red-200 text-red-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <strong>Heart Disease / AFib:</strong> {medHist.heart_disease ? 'Documented' : 'No'}
                </div>
                <div className={`p-3 rounded-xl border text-xs ${medHist.high_cholesterol ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <strong>Hyperlipidemia:</strong> {medHist.high_cholesterol ? 'Documented' : 'No'}
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs">
                  <strong>Tobacco Status:</strong> {medHist.smoking || 'never'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Current Medications</span>
                <p className="text-xs text-slate-900 font-medium">{medHist.current_medications || 'None recorded'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Known Drug Allergies</span>
                <p className="text-xs text-slate-900 font-medium">{medHist.known_allergies || 'NKDA'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Prior Neurological History</span>
                <p className="text-xs text-slate-900 font-medium">{medHist.previous_neuro_conditions || 'None recorded'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assessments */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Historical assessments are immutable and permanently recorded for longitudinal medical tracking.
              </p>
              <Link
                to={`/assessment/new?patient_id=${patient.id}`}
                className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Assessment</span>
              </Link>
            </div>

            <div className="space-y-3">
              {assessments.map((a) => {
                const date = new Date(a.assessment_time).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Assessment #{a.id}</span>
                        <span className="text-xs text-slate-500">• {date}</span>
                      </div>
                      <RiskBadge level={a.risk_level} score={a.risk_score} showScore size="sm" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">FAST Findings</span>
                        <strong className="text-slate-900">
                          F: {a.face_result} | A: {a.arm_result} | S: {a.speech_result}
                        </strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Blood Pressure</span>
                        <strong className="text-slate-900">{a.systolic_bp.toFixed(0)}/{a.diastolic_bp.toFixed(0)} mmHg</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Glucose & SpO2</span>
                        <strong className="text-slate-900">{a.glucose.toFixed(0)} mg/dL • {a.spo2.toFixed(0)}%</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Onset Window</span>
                        <strong className="text-slate-900">
                          {a.symptom_duration_minutes ? `${a.symptom_duration_minutes} mins` : a.symptom_onset || 'N/A'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <p className="text-[11px] text-slate-600 italic">
                        {a.doctor_notes || 'Routine triage assessment.'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEmergencySummary(a.id)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-bold"
                        >
                          Emergency Summary
                        </button>
                        <Link
                          to={`/reports?assessment_id=${a.id}`}
                          className="text-xs text-slate-600 hover:text-slate-900 font-bold"
                        >
                          Full Report
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Vitals History Charts */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <PatientVitalsChart data={vitalsHistory} />
          </div>
        )}

        {/* Tab 4: Referrals */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            {referrals.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No hospital referrals initiated for this patient.</p>
              </div>
            ) : (
              referrals.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{r.hospital?.name || 'Comprehensive Stroke Center'}</h4>
                      <p className="text-[11px] text-slate-500">Priority: {r.priority} • Transport: {r.ambulance_requested}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Status: {r.status}
                    </span>
                  </div>

                  {r.dispatch_notes && (
                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong>Dispatch Handover Notes:</strong> {r.dispatch_notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Timeline */}
        {activeTab === 'timeline' && (
          <PatientTimeline items={timeline} />
        )}

        {/* Tab 6: Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {assessments.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">Assessment #{a.id} Clinical Entry</span>
                    <span>{new Date(a.assessment_time).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {a.doctor_notes || 'No specific clinical narrative recorded for this assessment.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Summary Modal */}
      <EmergencySummaryModal
        summary={selectedSummary}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onInitiateReferral={() => {
          if (latestAssessment) {
            setSelectedAssessmentId(latestAssessment.id);
            setIsReferralOpen(true);
          }
        }}
      />

      {/* Referral Workflow Modal */}
      {isReferralOpen && (
        <ReferralWorkflowModal
          patientId={patient.id}
          patientName={patient.name}
          assessmentId={selectedAssessmentId || latestAssessment?.id || 1}
          isOpen={isReferralOpen}
          onClose={() => setIsReferralOpen(false)}
          onReferralCreated={() => {
            fetchPatientData();
            navigate('/referrals');
          }}
        />
      )}
    </div>
  );
};
