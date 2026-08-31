import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertOctagon, X, UserCheck } from 'lucide-react';

interface DoctorConfirmationGateProps {
  isOpen: boolean;
  patientName: string;
  riskScore: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const DoctorConfirmationGate: React.FC<DoctorConfirmationGateProps> = ({
  isOpen,
  patientName,
  riskScore,
  onClose,
  onConfirm,
}) => {
  const [isReviewed, setIsReviewed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Doctor Confirmation Gate</h2>
              <p className="text-xs text-slate-500">Emergency Stroke Protocol Authorization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Card */}
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-800">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            <span>High Urgency Clinical Threshold Reached</span>
          </div>
          <p className="leading-relaxed">
            Patient <strong>{patientName}</strong> has an AI Urgency Score of <strong>{riskScore.toFixed(0)}/100</strong> with acute neurological findings.
          </p>
          <p className="text-[11px] text-red-700">
            Emergency referrals activate prioritized ambulance dispatch and alert the receiving Comprehensive Stroke Center's neurovascular team.
          </p>
        </div>

        {/* Mandatory Physician Confirmation Checkbox */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isReviewed}
              onChange={(e) => setIsReviewed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-900 leading-snug">
              I have personally reviewed this clinical assessment, confirmed the neurological signs, and authorize emergency speciality hospital dispatch.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isReviewed}
            onClick={() => {
              if (isReviewed) {
                onConfirm();
              }
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>Confirm & Continue to Referral</span>
          </button>
        </div>
      </div>
    </div>
  );
};
