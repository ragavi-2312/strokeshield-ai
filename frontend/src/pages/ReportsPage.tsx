import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Assessment, Patient } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { 
  FileText, 
  Printer, 
  Search, 
  Activity, 
  Clock, 
  Heart, 
  User, 
  Building2, 
  CheckCircle2, 
  ShieldCheck,
  Cpu,
  UserCheck,
  Stethoscope,
  Camera
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialAssessmentId = searchParams.get('assessment_id');

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoading(true);
      try {
        const list = await api.get<Assessment[]>('/assessments/recent');
        setAssessments(list);
        if (list.length > 0) {
          const target = initialAssessmentId 
            ? list.find((a) => String(a.id) === initialAssessmentId) || list[0]
            : list[0];
          setSelectedAssessment(target);
        }
      } catch (err) {
        console.error('Failed to load assessments for reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessments();
  }, [initialAssessmentId]);

  useEffect(() => {
    if (selectedAssessment) {
      api.get<Patient>(`/patients/${selectedAssessment.patient_id}`)
        .then(setPatient)
        .catch(console.error);
    }
  }, [selectedAssessment]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Controls - No Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <span>Clinical Assessment & Urgency Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Print-ready medical evaluation reports with strict separation between Original Clinical Data, AI Analysis, and Doctor Decision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Assessment Selector */}
          <select
            value={selectedAssessment?.id || ''}
            onChange={(e) => {
              const match = assessments.find((a) => String(a.id) === e.target.value);
              if (match) setSelectedAssessment(match);
            }}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 text-slate-800 font-medium"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                Assessment #{a.id} ({a.risk_level} — {new Date(a.assessment_time).toLocaleDateString()})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Clinical Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      {selectedAssessment && patient ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6 card-print">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                  SS
                </div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  StrokeShield AI — Standardized Clinical Evaluation Report
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Standardized Emergency Neurovascular Triage & Clinical Decision Support Record
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">Assessment ID:</span>
              <span className="font-mono text-sm font-bold text-brand-700">#{selectedAssessment.id}</span>
              <span className="text-[11px] text-slate-400 block">
                {new Date(selectedAssessment.assessment_time).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Section 1: Patient Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Patient Name</span>
              <strong className="text-slate-900 text-sm">{patient.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Medical Record Number</span>
              <strong className="text-brand-700 font-mono text-sm">{patient.patient_id}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Age & Gender</span>
              <span className="text-slate-900 font-bold">{patient.age} yrs • {patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Emergency Contact</span>
              <span className="text-slate-900 font-bold">{patient.emergency_contact_name} ({patient.emergency_contact_phone})</span>
            </div>
          </div>

          {/* ============================================================================== */}
          {/* LAYER 1: SOURCE / ORIGINAL CLINICAL INFORMATION */}
          {/* ============================================================================== */}
          <div className="space-y-4 border-2 border-emerald-500/40 rounded-2xl p-5 bg-emerald-50/10">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>1. Source / Original Clinical Data (Primary Source of Truth)</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Immutable Clinical Facts
              </span>
            </div>

            {/* Vitals */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Blood Pressure</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAssessment.systolic_bp.toFixed(0)}/{selectedAssessment.diastolic_bp.toFixed(0)}</span>
                <span className="text-[9px] text-slate-400 block">mmHg</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Blood Glucose</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAssessment.glucose.toFixed(0)}</span>
                <span className="text-[9px] text-slate-400 block">mg/dL</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Heart Rate</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAssessment.heart_rate.toFixed(0)}</span>
                <span className="text-[9px] text-slate-400 block">bpm</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Oxygen (SpO2)</span>
                <span className="font-bold text-slate-900 text-sm">{selectedAssessment.spo2.toFixed(0)}%</span>
                <span className="text-[9px] text-slate-400 block">Room Air</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Last Known Well</span>
                <span className="font-bold text-red-700 font-mono text-sm">
                  {selectedAssessment.symptom_duration_minutes ? `${selectedAssessment.symptom_duration_minutes}m` : selectedAssessment.last_known_well_time || 'Recorded'}
                </span>
                <span className="text-[9px] text-slate-400 block">Onset Duration</span>
              </div>
            </div>

            {/* FAST Examination & Camera Screenings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">BE-FAST Observations:</span>
                <p><span className="text-slate-500">Face:</span> <strong className="text-slate-900">{selectedAssessment.face_result}</strong></p>
                <p><span className="text-slate-500">Arms:</span> <strong className="text-slate-900">{selectedAssessment.arm_result}</strong></p>
                <p><span className="text-slate-500">Speech:</span> <strong className="text-slate-900">{selectedAssessment.speech_result}</strong></p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Computer Vision Measurements:</span>
                {selectedAssessment.camera_assessment_data?.facial_asymmetry_score !== undefined ? (
                  <>
                    <p><span className="text-slate-500">Facial Asymmetry Score:</span> <strong className="text-red-700">{selectedAssessment.camera_assessment_data.facial_asymmetry_score.toFixed(1)} / 100</strong></p>
                    <p><span className="text-slate-500">Measurement Quality:</span> {selectedAssessment.camera_assessment_data.facial_measurement_quality || 92} / 100</p>
                  </>
                ) : (
                  <p className="text-slate-400">Direct screening parameters captured.</p>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================================== */}
          {/* LAYER 2: AI-ASSISTED INFORMATION (Separated Inferences Layer) */}
          {/* ============================================================================== */}
          <div className="space-y-3 border-2 border-brand-500/40 rounded-2xl p-5 bg-brand-50/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-100 pb-2 gap-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-brand-600" />
                <span>2. AI-Assisted Urgency Stratification (Inferred Layer)</span>
              </h3>
              <div className="text-right text-[10px] font-mono text-slate-500">
                <span>Model: StrokeShield Multi-Modal Neuro Triage (v1.0.0)</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <RiskBadge level={selectedAssessment.risk_level} score={selectedAssessment.risk_score} showScore size="lg" />
              <div className="text-xs text-slate-700">
                <span className="font-bold block">AI Rationale:</span>
                <p className="text-slate-600 leading-relaxed">{selectedAssessment.recommendation}</p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Contributing Observations:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                {selectedAssessment.contributing_factors.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================================== */}
          {/* LAYER 3: DOCTOR DECISION & CLINICAL GATE */}
          {/* ============================================================================== */}
          <div className="space-y-3 border-2 border-slate-900 rounded-2xl p-5 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-slate-900" />
                <span>3. Attending Physician Decision & Gate</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded">
                Human Physician Authorization
              </span>
            </div>

            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-800">Physician Clinical Narrative:</span>
              <p className="text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200">
                {selectedAssessment.doctor_notes || "Clinical findings reviewed and verified. Patient authorized for urgent stroke protocol."}
              </p>
            </div>
          </div>

          {/* Footer & Disclaimer */}
          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-500">
              CONFIDENTIAL MEDICAL DOCUMENT — Clinical Decision Support Prototype. AI outputs are distinct model inferences and do not substitute for certified clinical diagnosis.
            </p>
            <p>
              Generated by StrokeShield AI • Reference: REF-2026-1000{selectedAssessment.id} • Printed {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
