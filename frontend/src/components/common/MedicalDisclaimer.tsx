import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface MedicalDisclaimerProps {
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ variant = 'banner', className = '' }) => {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 ${className}`}>
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Clinical decision-support prototype. Requires qualified medical evaluation & neuroimaging.</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm ${className}`}>
        <div className="flex items-start">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Clinical Decision Support Notice</h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              StrokeShield AI provides early risk stratification and triage assistance for qualified doctors.
              This system does <strong>not</strong> make a definitive medical diagnosis and must never replace clinical judgement,
              neurological examination, or diagnostic neuroimaging (CT/MRI).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-sm no-print ${className}`}>
      <div className="flex items-center space-x-2 max-w-5xl mx-auto text-center justify-center">
        <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
        <span>
          <strong>CLINICAL TRIAGE PROTOTYPE:</strong> Intended solely for licensed physician decision support. AI predictions indicate potential urgency and do not constitute a confirmed medical diagnosis.
        </span>
      </div>
    </div>
  );
};
