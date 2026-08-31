import React, { useState } from 'react';
import { EmergencySummary } from '../../types';
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  X, 
  AlertOctagon, 
  Building2, 
  Activity, 
  Clock, 
  Heart,
  Phone,
  SendHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmergencySummaryModalProps {
  summary: EmergencySummary | null;
  isOpen: boolean;
  onClose: () => void;
  onInitiateReferral?: () => void;
}

export const EmergencySummaryModal: React.FC<EmergencySummaryModalProps> = ({
  summary,
  isOpen,
  onClose,
  onInitiateReferral,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !summary) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `
EMERGENCY STROKE PATIENT SUMMARY — STROKESHIELD AI
==================================================
Patient ID: ${summary.patient_id}
Name: ${summary.patient_name}
Age/Gender: ${summary.age} years / ${summary.gender}
Assessment Time: ${summary.assessment_time}

SYMPTOM ONSET & TIMING
----------------------
Onset Time: ${summary.symptom_onset}
Elapsed Duration: ${summary.symptom_duration_text}

FAST FINDINGS
-------------
Face: ${summary.fast_findings.face}
Arm: ${summary.fast_findings.arm}
Speech: ${summary.fast_findings.speech}
BE-FAST Balance: ${summary.befast_findings.balance}
BE-FAST Eyes: ${summary.befast_findings.eyes}

VITAL SIGNS
-----------
Blood Pressure: ${summary.vital_signs.blood_pressure}
Blood Glucose: ${summary.vital_signs.blood_glucose}
Heart Rate: ${summary.vital_signs.heart_rate}
SpO2: ${summary.vital_signs.spo2}
Temperature: ${summary.vital_signs.temperature}

RELEVANT MEDICAL HISTORY
------------------------
${summary.relevant_medical_history.join('\n')}

AI TRIAGE ASSESSMENT
--------------------
Urgency Tier: ${summary.risk_level} URGENCY (Score: ${summary.risk_score}/100)
Recommendation: ${summary.urgency_recommendation}

DOCTOR NOTES
------------
${summary.doctor_notes || 'None recorded'}

Assessing Doctor: ${summary.assessing_doctor} (${summary.hospital_affiliation})
Notice: ${summary.disclaimer}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200">
        {/* Header - No print */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-red-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">EMERGENCY PATIENT SUMMARY</h2>
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                  HIGH URGENCY
                </span>
              </div>
              <p className="text-xs text-red-200">Standardized protocol summary for emergency medical services & stroke team</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 font-sans card-print">
          {/* Official Document Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">Emergency Stroke Referral Record</h1>
              <p className="text-xs text-slate-600 font-medium">StrokeShield AI Clinical Decision Support Network</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">Patient Identifier:</span>
              <p className="text-lg font-mono font-bold text-red-600">{summary.patient_id}</p>
            </div>
          </div>

          {/* Patient Demographics & Onset Timing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Patient Name</span>
              <strong className="text-slate-900 text-sm">{summary.patient_name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Age / Gender</span>
              <strong className="text-slate-900 text-sm">{summary.age} yrs / {summary.gender}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Symptom Onset</span>
              <strong className="text-red-700 text-sm font-semibold">{summary.symptom_onset}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Elapsed Window</span>
              <strong className="text-red-700 text-sm font-semibold">{summary.symptom_duration_text}</strong>
            </div>
          </div>

          {/* FAST & BE-FAST Evaluation */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              <span>FAST & BE-FAST Clinical Findings</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
                <span className="font-bold text-red-900 block">F — Face Droop</span>
                <span className="text-slate-800 font-medium">{summary.fast_findings.face}</span>
              </div>
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
                <span className="font-bold text-red-900 block">A — Arm Weakness</span>
                <span className="text-slate-800 font-medium">{summary.fast_findings.arm}</span>
              </div>
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
                <span className="font-bold text-red-900 block">S — Speech Deficit</span>
                <span className="text-slate-800 font-medium">{summary.fast_findings.speech}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">B — Balance (BE-FAST)</span>
                <span className="text-slate-700 font-medium">{summary.befast_findings.balance}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">E — Eyes/Vision (BE-FAST)</span>
                <span className="text-slate-700 font-medium">{summary.befast_findings.eyes}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-900 block">T — Critical Time Frame</span>
                <span className="text-slate-800 font-medium">{summary.symptom_duration_text}</span>
              </div>
            </div>
          </div>

          {/* Vital Signs Grid */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-brand-600" />
              <span>Admission Vital Signs</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Blood Pressure</span>
                <strong className="text-slate-900 text-sm font-mono">{summary.vital_signs.blood_pressure}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Blood Glucose</span>
                <strong className="text-slate-900 text-sm font-mono">{summary.vital_signs.blood_glucose}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Heart Rate</span>
                <strong className="text-slate-900 text-sm font-mono">{summary.vital_signs.heart_rate}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">SpO2</span>
                <strong className="text-slate-900 text-sm font-mono">{summary.vital_signs.spo2}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Temperature</span>
                <strong className="text-slate-900 text-sm font-mono">{summary.vital_signs.temperature}</strong>
              </div>
            </div>
          </div>

          {/* Relevant Medical History */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Documented Medical History & Factors</h3>
            <div className="flex flex-wrap gap-2">
              {summary.relevant_medical_history.map((hist, i) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium border border-slate-200">
                  {hist}
                </span>
              ))}
            </div>
          </div>

          {/* Decision Support Recommendation */}
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-900">
              Clinical Urgency: {summary.risk_level} (Calculated Score: {summary.risk_score}/100)
            </h4>
            <p className="text-xs text-red-800 mt-1 font-medium leading-relaxed">
              {summary.urgency_recommendation}
            </p>
          </div>

          {/* Doctor Notes & Signature Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-900 block">Doctor Clinical Notes:</span>
              <p className="text-slate-700 italic mt-0.5">{summary.doctor_notes || 'Emergency stroke code activated.'}</p>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-900 block">Assessing Physician:</span>
              <p className="text-slate-800 font-bold">{summary.assessing_doctor}</p>
              <p className="text-slate-500 text-[11px]">{summary.hospital_affiliation}</p>
            </div>
          </div>

          {/* Mandatory Medical Disclaimer Footer */}
          <div className="p-3 bg-slate-100 rounded-lg text-[10px] text-slate-500 leading-normal text-center border border-slate-200">
            <strong>CLINICAL DECISION SUPPORT NOTICE:</strong> {summary.disclaimer} Final clinical diagnosis requires neuroimaging (CT Angiography / MRI) and certified stroke team evaluation.
          </div>
        </div>

        {/* Modal Actions - No Print */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Summary
          </button>
          <div className="flex gap-2">
            {onInitiateReferral && (
              <button
                onClick={() => {
                  onClose();
                  onInitiateReferral();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 shadow-sm shadow-red-500/20 transition-all"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Initiate Hospital Referral</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
