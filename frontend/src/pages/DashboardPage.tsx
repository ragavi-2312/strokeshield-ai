import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DashboardOverview, EmergencySummary, Patient, Hospital } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';
import { EmergencySummaryModal } from '../components/referral/EmergencySummaryModal';
import { ReferralWorkflowModal } from '../components/referral/ReferralWorkflowModal';
import { AddPatientModal } from '../components/patient/AddPatientModal';
import { EmergencyMap } from '../components/map/EmergencyMap';
import { DEFAULT_DOCTOR_LOCATION } from '../utils/geolocation';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  AlertOctagon, 
  Clock, 
  Ambulance, 
  Plus, 
  FileText, 
  ArrowRight, 
  ChevronRight, 
  Sparkles,
  MapPin,
  Camera,
  Building2,
  Navigation
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedSummary, setSelectedSummary] = useState<EmergencySummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [referralModalData, setReferralModalData] = useState<{
    patientId: number;
    patientName: string;
    assessmentId: number;
  } | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [overview, hospitalsList] = await Promise.all([
        api.get<DashboardOverview>('/dashboard/statistics'),
        api.get<Hospital[]>('/hospitals/nearby'),
      ]);
      setData(overview);
      setHospitals(hospitalsList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenEmergencySummary = async (assessmentId: number) => {
    try {
      const summary = await api.get<EmergencySummary>(`/assessments/${assessmentId}/emergency-summary`);
      setSelectedSummary(summary);
      setIsSummaryOpen(true);
    } catch (err: any) {
      alert('Could not generate emergency summary: ' + err.message);
    }
  };

  const handleOpenReferral = (patientId: number, patientName: string, assessmentId: number) => {
    setReferralModalData({ patientId, patientName, assessmentId });
  };

  return (
    <div className="space-y-6">
      {/* Top Clinical Disclaimer Card */}
      <MedicalDisclaimer variant="card" />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</span>
            <div className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : data?.stats.total_patients || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Registered in clinic</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Assessments Today */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assessments Today</span>
            <div className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : data?.stats.assessments_today || 0}
            </div>
            <span className="text-[11px] text-brand-600 font-medium">BE-FAST & Vitals Triage</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk Cases */}
        <div className="bg-white rounded-3xl p-5 border border-red-200/80 shadow-sm flex items-center justify-between bg-red-50/20 hover:border-red-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">High Risk Patients</span>
            <div className="text-2xl font-extrabold text-red-700">
              {isLoading ? '...' : data?.stats.high_risk_patients || 0}
            </div>
            <span className="text-[11px] text-red-600 font-medium">Urgent evaluation alert</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Active Referrals */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Hospital Referrals</span>
            <div className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : data?.stats.active_referrals || 0}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">In Transit / Preparing</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Ambulance className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Emergency Alerts Banner Section */}
      {data && data.emergency_alerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-100/60 rounded-3xl border-2 border-red-300 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-red-950 uppercase tracking-wide">
                  Active Emergency Stroke Alerts ({data.emergency_alerts.length})
                </h2>
                <p className="text-xs text-red-800">
                  Patients with acute BE-FAST focal signs requiring immediate speciality stroke center transfer.
                </p>
              </div>
            </div>
            <Link
              to="/emergency"
              className="text-xs text-red-800 hover:text-red-950 font-extrabold flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Emergency Alert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {data.emergency_alerts.slice(0, 2).map((alert) => (
              <div
                key={alert.assessment_id}
                className="bg-white rounded-2xl p-4 border border-red-200 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-slate-900">{alert.patient_name}</strong>
                      <span className="font-mono text-xs text-slate-500 font-semibold">{alert.patient_id_str}</span>
                    </div>
                    <RiskBadge level={alert.risk_level} score={alert.risk_score} showScore size="sm" />
                  </div>

                  <p className="text-xs text-red-700 font-medium mt-1">
                    Urgent evaluation recommended • {alert.symptom_duration_text}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {alert.contributing_factors.map((factor, i) => (
                      <span key={i} className="text-[10px] bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <button
                    onClick={() => handleOpenEmergencySummary(alert.assessment_id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Summary</span>
                  </button>

                  {alert.has_referral ? (
                    <Link
                      to="/referrals"
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>{alert.referral_status || 'Referred'}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleOpenReferral(alert.patient_id, alert.patient_name, alert.assessment_id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm shadow-red-500/20"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>Start Referral</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: Recent Assessments & Map Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Recent Patient Assessments */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Patient Assessments</h2>
              <p className="text-xs text-slate-500">Live clinical triage feed across all registered patients</p>
            </div>
            <Link
              to="/patients"
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Patients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-3">Patient ID</th>
                  <th className="py-3 px-3">Patient Name</th>
                  <th className="py-3 px-3">Assessment Date</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading recent assessments...
                    </td>
                  </tr>
                ) : !data || data.recent_assessments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No assessments recorded yet. Click "New Assessment" to begin.
                    </td>
                  </tr>
                ) : (
                  data.recent_assessments.map((item) => {
                    const date = new Date(item.assessment_date);
                    const formattedDate = date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-brand-700">{item.patient_id_str}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{item.patient_name}</td>
                        <td className="py-3 px-3 text-slate-500">{formattedDate}</td>
                        <td className="py-3 px-3">
                          <RiskBadge level={item.risk_level} score={item.risk_score} showScore size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenEmergencySummary(item.id)}
                            className="text-xs text-brand-600 hover:text-brand-800 font-semibold mr-2"
                          >
                            Summary
                          </button>
                          <Link
                            to={`/reports?assessment_id=${item.id}`}
                            className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                          >
                            Report
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Emergency Map & Quick Navigation Widget */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map Widget */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Nearby Stroke Centers Map</span>
              </h3>
              <Link to="/hospitals" className="text-xs text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1">
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <EmergencyMap
              sourceLocation={DEFAULT_DOCTOR_LOCATION}
              hospitals={hospitals}
              height="240px"
              showRoute={true}
              selectedHospitalId={hospitals[0]?.id}
            />
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Doctor Quick Clinical Suite</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/befast"
                className="p-3 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 font-bold text-xs flex flex-col justify-between space-y-2 transition-all"
              >
                <Camera className="w-5 h-5 text-brand-600" />
                <span>BE-FAST Camera Suite</span>
              </Link>

              <Link
                to="/assessment/new"
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex flex-col justify-between space-y-2 transition-all"
              >
                <Activity className="w-5 h-5 text-white" />
                <span>New Stroke Assessment</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Summary Modal */}
      <EmergencySummaryModal
        summary={selectedSummary}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        onInitiateReferral={() => {
          if (selectedSummary) {
            const match = data?.recent_assessments.find((a) => a.patient_id_str === selectedSummary.patient_id);
            if (match) {
              handleOpenReferral(match.id, selectedSummary.patient_name, match.id);
            }
          }
        }}
      />

      {/* Referral Workflow Modal */}
      {referralModalData && (
        <ReferralWorkflowModal
          patientId={referralModalData.patientId}
          patientName={referralModalData.patientName}
          assessmentId={referralModalData.assessmentId}
          isOpen={!!referralModalData}
          onClose={() => setReferralModalData(null)}
          onReferralCreated={() => {
            fetchDashboardData();
            navigate('/referrals');
          }}
        />
      )}

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientCreated={(p) => {
          fetchDashboardData();
          navigate(`/patients/${p.id}`);
        }}
      />
    </div>
  );
};
