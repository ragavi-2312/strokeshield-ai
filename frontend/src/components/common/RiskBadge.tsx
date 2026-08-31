import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  level?: 'LOW' | 'MODERATE' | 'HIGH' | string | null;
  score?: number | null;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = false,
  size = 'md',
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  if (normLevel === 'HIGH' || normLevel === 'EMERGENCY') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-red-100 text-red-800 border border-red-300 shadow-sm animate-pulse-subtle ${sizeClasses}`}
      >
        <AlertOctagon className={size === 'lg' ? 'w-4 h-4 text-red-600' : 'w-3.5 h-3.5 text-red-600'} />
        <span>HIGH URGENCY</span>
        {showScore && score !== undefined && score !== null && (
          <span className="ml-1 bg-red-200 text-red-900 px-1.5 py-0.2 rounded text-[11px]">
            {score.toFixed(0)}/100
          </span>
        )}
      </span>
    );
  }

  if (normLevel === 'MODERATE') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-amber-100 text-amber-900 border border-amber-300 ${sizeClasses}`}
      >
        <AlertTriangle className={size === 'lg' ? 'w-4 h-4 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
        <span>MODERATE RISK</span>
        {showScore && score !== undefined && score !== null && (
          <span className="ml-1 bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded text-[11px]">
            {score.toFixed(0)}/100
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
    >
      <CheckCircle2 className={size === 'lg' ? 'w-4 h-4 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
      <span>LOW RISK</span>
      {showScore && score !== undefined && score !== null && (
        <span className="ml-1 bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded text-[11px]">
          {score.toFixed(0)}/100
        </span>
      )}
    </span>
  );
};
