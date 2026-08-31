import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Referral, Hospital } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Ambulance, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Activity, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  QrCode,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ReferralQRCode } from '../../components/referral/ReferralQRCode';

export const HospitalDashboardPage: React.FC = () => {
  const { hospitalStaff } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState<Referral | null>(null);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const list = await api.get<Referral[]>('/referrals');
      setReferrals(list);
      if (list.length > 0 && !selectedReferral) {
        setSelectedReferral(list[0]);
      }
    } catch (err) {
      console.error('Failed to load incoming referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleUpdateStatus = async (referralId: number, nextStatus: string, note?: string) => {
    setUpdatingId(referralId);
    try {
      const updated = await api.patch<Referral>(`/referrals/${referralId}/status`, {
        status: nextStatus,
        note: note || `Receiving team updated status to ${nextStatus}`,
      });
      await fetchReferrals();
      setSelectedReferral(updated);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeEmergencies = referrals.filter((r) => r.status !== 'Closed' && r.status !== 'Patient Arrived');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-brand-500/20 text-brand-300 border border-brand-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Receiving Stroke Center Portal
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Live Ambulance Telemetry
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {hospitalStaff?.hospital_name || 'Metro Comprehensive Stroke Center'}
          </h1>
          <p className="text-xs text-slate-300">
            Emergency triage dashboard for incoming acute ischemic/hemorrhagic stroke transfers and rapid trauma team activations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReferrals}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
          <div className="bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-xl text-center">
            <span className="text-xl font-black text-red-400 block">{activeEmergencies.length}</span>
            <span className="text-[10px] font-bold uppercase text-red-200">Active Inbounds</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Inbound Referrals, Right Authorized Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Referrals List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-brand-600" />
              <span>Incoming Emergency Referrals ({referrals.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading incoming referrals...</span>
            </div>
          ) : referrals.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-800 text-xs">No active referrals routed to this hospital.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref) => {
                const isSelected = selectedReferral?.id === ref.id;
                const isEmergency = ref.priority === 'Emergency';

                return (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedReferral(ref)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-50/50 border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-brand-700">
                            {ref.referral_code || `REF-#${ref.id}`}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            isEmergency ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {ref.priority}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">
                          {ref.patient_name || 'Patient'} ({ref.patient_identifier || 'P-1001'})
                        </h3>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        ref.status === 'Sent' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        ref.status === 'Accepted' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        ref.status === 'Preparing' ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' :
                        ref.status === 'Patient Arrived' || ref.status === 'Arrived' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {ref.status}
                      </span>
                    </div>

                    <div className="pt-2 text-xs text-slate-500 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dispatched: {new Date(ref.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ETA: ~{ref.estimated_eta_minutes || 15}m</span>
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                        "{ref.dispatch_notes || 'Code stroke emergency dispatch'}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Authorized Emergency Handover Record (7 cols) */}
        <div className="lg:col-span-7">
          {selectedReferral ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-brand-700">
                      {selectedReferral.referral_code || `REF-#${selectedReferral.id}`}
                    </span>
                    <span className="bg-red-100 text-red-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                      {selectedReferral.priority}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedReferral.patient_name} ({selectedReferral.patient_identifier})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Authorized Medical Handover Record • Dispatched by Attending Neurologist
                  </p>
                </div>

                {/* QR Code Action */}
                <button
                  onClick={() => setShowQRModal(selectedReferral)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <QrCode className="w-4 h-4 text-slate-600" />
                  <span>View Security QR</span>
                </button>
              </div>

              {/* Status Action Buttons for Receiving Stroke Team */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Receiving Hospital Emergency Actions:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedReferral.id, 'Accepted', 'Stroke Team Accepted Referral')}
                    disabled={updatingId === selectedReferral.id || ['Accepted', 'Preparing', 'Patient Arrived', 'Closed'].includes(selectedReferral.status)}
                    className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. Accept Referral</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReferral.id, 'Preparing', 'CT Angiography & Neuro-ICU Ready')}
                    disabled={updatingId === selectedReferral.id || ['Preparing', 'Patient Arrived', 'Closed'].includes(selectedReferral.status)}
                    className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Activity className="w-4 h-4" />
                    <span>2. Preparing Suite</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedReferral.id, 'Patient Arrived', 'Ambulance arrived at Trauma Bay 1')}
                    disabled={updatingId === selectedReferral.id || ['Patient Arrived', 'Closed'].includes(selectedReferral.status)}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>3. Patient Arrived</span>
                  </button>
                </div>
              </div>

              {/* Patient Snapshot Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Age & Gender</span>
                  <strong className="text-slate-900">{selectedReferral.patient_summary_snapshot?.age || 68} yrs • {selectedReferral.patient_summary_snapshot?.gender || 'Male'}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Last Known Well</span>
                  <strong className="text-red-700">{selectedReferral.patient_summary_snapshot?.last_known_well || '08:30 AM'}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                  <strong className="text-slate-900 font-mono">{selectedReferral.patient_summary_snapshot?.vitals?.bp || '188/108'} mmHg</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Transport Mode</span>
                  <strong className="text-slate-900 text-[11px] truncate block">{selectedReferral.ambulance_requested}</strong>
                </div>
              </div>

              {/* Handover Clinical Findings */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  FAST & Camera Triage Findings Snapshot
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Face Symmetry:</span>
                    <strong className="text-red-600">Possible Droop (Confirmed)</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Arm Drift:</span>
                    <strong className="text-red-600">Pronator Weakness (Confirmed)</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Speech:</span>
                    <strong className="text-red-600">Slurring / Aphasia (Confirmed)</strong>
                  </div>
                </div>
              </div>

              {/* Handover Dispatch Notes */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-900 block">Doctor Handover & Dispatch Narrative:</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 italic">
                  "{selectedReferral.dispatch_notes || 'Code Stroke activation. Immediate neuroimaging recommended.'}"
                </p>
              </div>

              {/* Live Timeline Events */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block">Referral Action Trail:</span>
                <div className="space-y-1.5">
                  {(selectedReferral.timeline_events || []).map((ev, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-mono text-slate-400">{ev.time}</span>
                      <span>•</span>
                      <strong className="text-slate-800">{ev.event}</strong>
                      <span className="text-slate-400">({ev.actor})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              Select an incoming referral from the list to view the authorized clinical handover.
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowQRModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
            <ReferralQRCode
              referralCode={showQRModal.referral_code || `REF-#${showQRModal.id}`}
              hospitalName={showQRModal.hospital?.name || 'Metro Stroke Center'}
              priority={showQRModal.priority}
            />
          </div>
        </div>
      )}
    </div>
  );
};
