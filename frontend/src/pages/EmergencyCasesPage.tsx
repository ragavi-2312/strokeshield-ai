import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { EmergencyAlert, EmergencySummary, Referral, Hospital } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';
import { EmergencySummaryModal } from '../components/referral/EmergencySummaryModal';
import { ReferralWorkflowModal } from '../components/referral/ReferralWorkflowModal';
import { EmergencyRouteViewModal } from '../components/referral/EmergencyRouteViewModal';
import { DEFAULT_DOCTOR_LOCATION, GeolocationService } from '../utils/geolocation';
import { Link } from 'react-router-dom';
import { 
  AlertOctagon, 
  Clock, 
  Ambulance, 
  FileText, 
  User, 
  Activity, 
  Navigation,
  ChevronRight,
  Phone,
  RefreshCw
} from 'lucide-react';

export const EmergencyCasesPage: React.FC = () => {
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedSummary, setSelectedSummary] = useState<EmergencySummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [referralModalData, setReferralModalData] = useState<{
    patientId: number;
    patientName: string;
    assessmentId: number;
  } | null>(null);

  const [routeModalData, setRouteModalData] = useState<{
    hospital: Hospital;
    patientName: string;
    patientId: string;
  } | null>(null);

  const fetchEmergencyData = async () => {
    setIsLoading(true);
    try {
      const [statsData, refsData] = await Promise.all([
        api.get<any>('/dashboard/statistics'),
        api.get<Referral[]>('/referrals'),
      ]);
      setEmergencyAlerts(statsData.emergency_alerts || []);
      setReferrals(refsData);
    } catch (err) {
      console.error('Failed to load emergency cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyData();
  }, []);

  const handleOpenEmergencySummary = async (assessmentId: number) => {
    try {
      const summary = await api.get<EmergencySummary>(`/assessments/${assessmentId}/emergency-summary`);
      setSelectedSummary(summary);
      setIsSummaryOpen(true);
    } catch (err: any) {
      alert('Could not fetch emergency summary: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <span>Emergency Stroke Cases & Active Hospital Transfers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time emergency stroke alerts, GPS destination tracking, and rapid ambulance navigation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmergencyData}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Alerts</span>
          </button>
          <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-300 animate-pulse">
            {emergencyAlerts.length} High Urgency Case{emergencyAlerts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <MedicalDisclaimer variant="card" />

      {/* Emergency Cases Table & Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Scanning active emergency cases & routes...</span>
          </div>
        ) : emergencyAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Active High Urgency Cases</h3>
            <p className="text-xs text-slate-400">All recent patient assessments are currently within low or moderate risk ranges.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Patient / ID</th>
                  <th className="py-3.5 px-4">Urgency & FAST Signs</th>
                  <th className="py-3.5 px-4">Destination Hospital</th>
                  <th className="py-3.5 px-4">Distance & ETA</th>
                  <th className="py-3.5 px-4">Referral Status</th>
                  <th className="py-3.5 px-4 text-right">Emergency Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {emergencyAlerts.map((item) => {
                  const matchRef = referrals.find((r) => r.patient_id === item.patient_id);
                  const destinationHosp = matchRef?.hospital;

                  return (
                    <tr key={item.assessment_id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <Link
                            to={`/patients/${item.patient_id}`}
                            className="font-extrabold text-slate-900 hover:text-brand-600 text-sm block"
                          >
                            {item.patient_name}
                          </Link>
                          <span className="font-mono text-[11px] text-red-700 font-bold block">
                            {item.patient_id_str} • {item.age} yrs • {item.gender}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 space-y-1">
                        <RiskBadge level={item.risk_level} score={item.risk_score} showScore size="sm" />
                        <span className="text-[11px] text-red-800 font-medium block">
                          ⏱️ {item.symptom_duration_text}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {destinationHosp ? (
                          <div className="space-y-0.5">
                            <strong className="text-slate-900 block text-xs">{destinationHosp.name}</strong>
                            <span className="text-[10px] text-brand-700 font-bold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                              {destinationHosp.stroke_capability}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No hospital dispatched</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {destinationHosp ? (
                          <div className="space-y-0.5">
                            <strong className="font-mono text-slate-900 block">{destinationHosp.estimated_distance_km} km</strong>
                            <span className="text-[11px] text-blue-700 font-bold block">~{destinationHosp.estimated_travel_time_min} mins ETA</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {item.has_referral ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            {item.referral_status}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                            Pending Dispatch
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEmergencySummary(item.assessment_id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Summary</span>
                        </button>

                        {destinationHosp ? (
                          <a
                            href={GeolocationService.getNavigationUrl(
                              DEFAULT_DOCTOR_LOCATION.latitude,
                              DEFAULT_DOCTOR_LOCATION.longitude,
                              destinationHosp.latitude,
                              destinationHosp.longitude,
                              destinationHosp.name
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>🗺️ Navigate</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setReferralModalData({
                                patientId: item.patient_id,
                                patientName: item.patient_name,
                                assessmentId: item.assessment_id,
                              })
                            }
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Ambulance className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <EmergencySummaryModal
        summary={selectedSummary}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onInitiateReferral={() => {
          if (selectedSummary) {
            const match = emergencyAlerts.find((a) => a.patient_id_str === selectedSummary.patient_id);
            if (match) {
              setReferralModalData({
                patientId: match.patient_id,
                patientName: match.patient_name,
                assessmentId: match.assessment_id,
              });
            }
          }
        }}
      />

      {referralModalData && (
        <ReferralWorkflowModal
          patientId={referralModalData.patientId}
          patientName={referralModalData.patientName}
          assessmentId={referralModalData.assessmentId}
          isOpen={!!referralModalData}
          onClose={() => setReferralModalData(null)}
          onReferralCreated={() => {
            fetchEmergencyData();
          }}
        />
      )}

      {routeModalData && (
        <EmergencyRouteViewModal
          isOpen={!!routeModalData}
          onClose={() => setRouteModalData(null)}
          hospital={routeModalData.hospital}
          sourceLocation={DEFAULT_DOCTOR_LOCATION}
          patientName={routeModalData.patientName}
          patientId={routeModalData.patientId}
          onConfirmReferral={() => setRouteModalData(null)}
        />
      )}
    </div>
  );
};
