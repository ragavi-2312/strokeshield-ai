import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Referral } from '../types';
import { 
  SendHorizontal, 
  Ambulance, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Filter, 
  FileText, 
  MapPin, 
  Phone 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReferralsPage: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status_filter = statusFilter;
      const list = await api.get<Referral[]>('/referrals', params);
      setReferrals(list);
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  const handleUpdateStatus = async (referralId: number, nextStatus: string) => {
    setUpdatingId(referralId);
    try {
      await api.patch<Referral>(`/referrals/${referralId}/status`, {
        status: nextStatus,
        note: `Handover status updated to ${nextStatus}`,
      });
      await fetchReferrals();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Created':
      case 'Sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Acknowledged':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'In Transit':
        return 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse';
      case 'Arrived':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const nextStatusOptions: Record<string, string[]> = {
    Created: ['Sent', 'Acknowledged', 'In Transit'],
    Sent: ['Acknowledged', 'In Transit', 'Arrived'],
    Acknowledged: ['In Transit', 'Arrived'],
    'In Transit': ['Arrived', 'Closed'],
    Arrived: ['Closed'],
    Closed: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-brand-600" />
            <span>Emergency Referral & Hospital Dispatch Tracking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ambulance dispatch status, receiving stroke team acknowledgments, and hospital handovers.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 text-slate-700 font-medium"
          >
            <option value="">All Referral Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="In Transit">In Transit</option>
            <option value="Arrived">Arrived</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Referrals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading active referral queue...</span>
          </div>
        ) : referrals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 space-y-2">
            <Ambulance className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Referrals in Queue</h3>
            <p className="text-xs text-slate-400">Perform a stroke assessment to initiate emergency patient transfers.</p>
          </div>
        ) : (
          referrals.map((ref) => {
            const availableTransitions = nextStatusOptions[ref.status] || [];

            return (
              <div
                key={ref.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        Referral #{ref.id} — {ref.patient_name} ({ref.patient_identifier})
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          ref.priority === 'Emergency'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {ref.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Dispatched on {new Date(ref.created_at).toLocaleString()} • Transport: {ref.ambulance_requested}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-extrabold rounded-full border ${getStatusColor(ref.status)}`}>
                      {ref.status}
                    </span>
                  </div>
                </div>

                {/* Destination Hospital & Timeline Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Destination Info */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                      Receiving Stroke Center
                    </span>
                    <strong className="text-slate-900 text-sm block">{ref.hospital?.name || 'Comprehensive Stroke Center'}</strong>
                    <div className="text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ref.hospital?.address}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-red-600" />
                        <span>Emergency Line: {ref.hospital?.emergency_phone || ref.hospital?.phone}</span>
                      </p>
                    </div>

                    {ref.dispatch_notes && (
                      <div className="pt-2 border-t border-slate-200 text-slate-700">
                        <span className="font-semibold block text-slate-900">Handover Notes:</span>
                        <p className="italic">{ref.dispatch_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Live Stepper & Status Updates */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-2">
                        Transit Stepper
                      </span>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span className={ref.status !== 'Created' ? 'text-brand-600' : ''}>Sent</span>
                        <span>→</span>
                        <span className={['Acknowledged', 'In Transit', 'Arrived', 'Closed'].includes(ref.status) ? 'text-purple-600' : ''}>
                          Acknowledged
                        </span>
                        <span>→</span>
                        <span className={['In Transit', 'Arrived', 'Closed'].includes(ref.status) ? 'text-amber-600' : ''}>
                          In Transit
                        </span>
                        <span>→</span>
                        <span className={['Arrived', 'Closed'].includes(ref.status) ? 'text-emerald-600' : ''}>
                          Arrived
                        </span>
                      </div>
                    </div>

                    {/* Progression Action Buttons */}
                    {availableTransitions.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">
                          Advance Referral Pipeline:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {availableTransitions.map((nextSt) => (
                            <button
                              key={nextSt}
                              onClick={() => handleUpdateStatus(ref.id, nextSt)}
                              disabled={updatingId === ref.id}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Mark as "{nextSt}"</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Event Log */}
                {ref.timeline_events && ref.timeline_events.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Latest Update:</span>
                    <strong className="text-slate-700">
                      {ref.timeline_events[ref.timeline_events.length - 1].event}
                    </strong>
                    <span>({ref.timeline_events[ref.timeline_events.length - 1].time})</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
