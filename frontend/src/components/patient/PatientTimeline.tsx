import React from 'react';
import { TimelineItem } from '../../types';
import { 
  UserPlus, 
  Activity, 
  Ambulance, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PatientTimelineProps {
  items: TimelineItem[];
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium">No timeline events recorded.</p>
      </div>
    );
  }

  const getIcon = (type: string, badge: string) => {
    if (type === 'REGISTRATION') return <UserPlus className="w-4 h-4 text-brand-600" />;
    if (type === 'REFERRAL') return <Ambulance className="w-4 h-4 text-red-600" />;
    if (type === 'ASSESSMENT') {
      if (badge === 'Emergency') return <AlertOctagon className="w-4 h-4 text-red-600" />;
      if (badge === 'Warning') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      return <Activity className="w-4 h-4 text-emerald-600" />;
    }
    return <Clock className="w-4 h-4 text-slate-500" />;
  };

  const getBadgeClass = (badge: string) => {
    if (badge === 'Emergency') return 'bg-red-100 text-red-800 border-red-200';
    if (badge === 'Warning') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (badge === 'Success') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
        <Clock className="w-4 h-4 text-brand-600" />
        <span>Chronological Patient Longitudinal History</span>
      </h3>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
        {items.map((item, idx) => {
          const date = new Date(item.timestamp);
          const dateStr = date.toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          });

          return (
            <div key={idx} className="relative pl-6 group">
              {/* Timeline Dot with Icon */}
              <div className="absolute -left-[17px] top-0.5 w-8 h-8 rounded-full bg-white border-2 border-slate-200 group-hover:border-brand-500 flex items-center justify-center shadow-sm transition-colors">
                {getIcon(item.type, item.badge)}
              </div>

              {/* Event Content */}
              <div className="bg-slate-50/70 group-hover:bg-slate-50 rounded-xl p-4 border border-slate-200/80 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getBadgeClass(item.badge)}`}>
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-slate-400">{dateStr}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.description}</p>

                {/* Quick actions for assessment or referral */}
                <div className="mt-3 flex gap-2">
                  {item.assessment_id && (
                    <Link
                      to={`/reports?assessment_id=${item.assessment_id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-semibold"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>View Assessment Report</span>
                    </Link>
                  )}
                  {item.referral_id && (
                    <Link
                      to={`/referrals`}
                      className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-semibold"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>Track Referral Status</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
