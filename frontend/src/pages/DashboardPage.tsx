import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DashboardOverview, EmergencySummary, Patient, Hospital } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';
import { EmergencySummaryModal } from '../components/referral/EmergencySummaryModal';
import { ReferralWorkflowModal } from '../components/referral/ReferralWorkflowModal';
import { AddPatientModal } from '../components/patient/AddPatientModal';
import { EmergencyMap } from '../components/map/EmergencyMap';
import { DEFAULT_DOCTOR_LOCATION } from '../utils/geolocation';
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
  Navigation,
  Search,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  SendHorizontal
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { doctor, role } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');

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
    setError(null);
    try {
      const [overview, hospitalsList] = await Promise.all([
        api.get<DashboardOverview>('/dashboard/statistics'),
        api.get<Hospital[]>('/hospitals/nearby'),
      ]);
      setData(overview);
      setHospitals(hospitalsList);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to clinical backend service.');
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

  // Doctor greeting time calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const doctorName = doctor?.name || 'Dr. Raha';
  const clinicHospital = doctor?.hospital || 'Demo Stroke Care Hospital';

  // Filtered recent assessments
  const filteredAssessments = data?.recent_assessments.filter((item) => {
    const matchesQuery = 
      item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient_id_str.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || item.risk_level.toUpperCase() === riskFilter;
    return matchesQuery && matchesRisk;
  }) || [];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & MAIN CTAs (Section 5) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200/80 font-bold px-2 py-0.5 rounded-full">
              {clinicHospital} • Chennai
            </span>
            <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-full hidden sm:inline">
              🟡 DEMO MODE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {getGreeting()}, {doctorName}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            AI-Assisted Stroke Screening Dashboard • Multi-Modal Triage & Rapid Dispatch
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/assessment/new"
            className="px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl text-xs font-black shadow-md shadow-teal-700/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Patient Assessment</span>
          </Link>
          
          <Link
            to="/patients"
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-2xl text-xs font-bold transition-colors"
          >
            View Patients
          </Link>

          <Link
            to="/referrals"
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <SendHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>View Referrals</span>
          </Link>
        </div>
      </div>

      {/* 2. 30-SECOND HACKATHON EXPLAINER BOX (Section 32) */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-teal-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>What is StrokeShield AI?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              StrokeShield AI helps doctors perform AI-assisted stroke screening using patient symptoms, vitals, facial/arm/speech screening, and emergency referral support with live road GPS navigation.
            </p>
          </div>

          <Link
            to="/befast"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl shadow-xs shrink-0 transition-all hover:scale-105"
          >
            <Camera className="w-4 h-4" />
            <span>Try BE-FAST Camera Suite</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3. 4 KEY SUMMARY KPI CARDS (Section 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Patients Today */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patients Today</span>
            <div className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : data?.stats.total_patients || 0}
            </div>
            <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Registered in clinic
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Assessments */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Assessments</span>
            <div className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : data?.stats.assessments_today || 0}
            </div>
            <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3" /> BE-FAST & Vitals Triage
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* High Priority Cases */}
        <div className="bg-white rounded-3xl p-5 border border-red-200/80 shadow-xs flex items-center justify-between bg-red-50/20 hover:border-red-300 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">High Priority</span>
            <div className="text-3xl font-black text-red-700">
              {isLoading ? '...' : data?.stats.high_risk_patients || 0}
            </div>
            <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Urgent evaluation alert
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Referrals */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Referrals</span>
            <div className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : data?.stats.active_referrals || 0}
            </div>
            <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
              <Ambulance className="w-3 h-3" /> Active emergency transit
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Ambulance className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. ACTIVE EMERGENCY ALERT BANNER (If high risk cases exist) */}
      {data && data.emergency_alerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-100/70 rounded-3xl border border-red-300 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-red-950 uppercase tracking-wider flex items-center gap-2">
                  <span>Emergency Stroke Alerts</span>
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.2 rounded-full">
                    {data.emergency_alerts.length} Active
                  </span>
                </h2>
                <p className="text-xs text-red-800">
                  Acute neurological focal signs detected within therapeutic time window.
                </p>
              </div>
            </div>

            <Link
              to="/emergency"
              className="text-xs text-red-800 hover:text-red-950 font-extrabold flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {data.emergency_alerts.slice(0, 2).map((alert) => (
              <div
                key={alert.assessment_id}
                className="bg-white rounded-2xl p-4 border border-red-200/90 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-black text-slate-900">{alert.patient_name}</strong>
                      <span className="font-mono text-xs text-slate-500 font-semibold">{alert.patient_id_str}</span>
                    </div>
                    <RiskBadge level={alert.risk_level} score={alert.risk_score} showScore size="sm" />
                  </div>

                  <p className="text-xs text-red-700 font-semibold mt-1">
                    {alert.symptom_duration_text}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {alert.contributing_factors.map((factor, i) => (
                      <span key={i} className="text-[10px] bg-red-50 text-red-800 px-2 py-0.5 rounded-md border border-red-200">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEmergencySummary(alert.assessment_id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Summary</span>
                  </button>

                  {alert.has_referral ? (
                    <Link
                      to="/referrals"
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-1"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>{alert.referral_status || 'In Transit'}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenReferral(alert.patient_id, alert.patient_name, alert.assessment_id)}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>Dispatch Referral</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MAIN CLINICAL SECTION: RECENT ASSESSMENTS & NEARBY STROKE HOSPITALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Filterable Recent Assessments */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Recent Patient Assessments</h2>
              <p className="text-xs text-slate-500">Live clinical triage feed across all registered patients</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                to="/patients"
                className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
              >
                <span>All Patients</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Search & Urgency Filter Chips */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name or ID (e.g. P-1001)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 w-full sm:w-auto">
              {(['ALL', 'HIGH', 'MODERATE', 'LOW'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRiskFilter(filter)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    riskFilter === filter
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Table (Desktop) / Cards (Mobile) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-200">
                  <th className="py-2.5 px-3">Patient Code</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Encounter Time</th>
                  <th className="py-2.5 px-3">AI Urgency</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        <span>Loading clinical assessments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <p className="text-xs font-semibold">No assessments match your filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((item) => {
                    const date = new Date(item.assessment_date);
                    const formattedDate = date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-3 font-mono font-bold text-teal-800">{item.patient_id_str}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{item.patient_name}</td>
                        <td className="py-3 px-3 text-slate-500">{formattedDate}</td>
                        <td className="py-3 px-3">
                          <RiskBadge level={item.risk_level} score={item.risk_score} showScore size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <Link
                            to={`/assessment/result/${item.id}`}
                            className="text-xs font-bold text-teal-700 hover:text-teal-800"
                          >
                            View Result
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEmergencySummary(item.id)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Summary
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Nearby Stroke Centers Directory & Map */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Emergency Map Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Nearby Stroke Centers (Chennai)</span>
              </h3>
              <Link 
                to="/hospitals" 
                className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
              >
                <span>All 5 Centers</span>
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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Origin: Clinic GPS (Chennai)</span>
              <span className="font-bold text-teal-700">5 Centers 24/7 CT Ready</span>
            </div>
          </div>

          {/* Camera Screening Suite Quick Launcher */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span>AI Screening Suite</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/befast"
                className="p-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100/80 text-teal-900 border border-teal-200/80 font-bold text-xs flex flex-col justify-between space-y-2 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Camera className="w-5 h-5 text-teal-700 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] bg-teal-700 text-white font-black px-1.5 py-0.2 rounded">VISION</span>
                </div>
                <div>
                  <span className="block font-black">BE-FAST Camera</span>
                  <span className="text-[10px] text-teal-700 font-medium">Face, Arm & Speech</span>
                </div>
              </Link>

              <Link
                to="/assessment/new"
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex flex-col justify-between space-y-2 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Activity className="w-5 h-5 text-teal-300 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] bg-teal-400 text-slate-950 font-black px-1.5 py-0.2 rounded">+ NEW</span>
                </div>
                <div>
                  <span className="block font-black">New Triage</span>
                  <span className="text-[10px] text-slate-300 font-medium">Full 5-Step Wizard</span>
                </div>
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
