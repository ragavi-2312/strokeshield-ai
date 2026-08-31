import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PatientSummary, Patient } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { AddPatientModal } from '../components/patient/AddPatientModal';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Activity, 
  ChevronRight, 
  ArrowUpDown, 
  UserCheck, 
  FileText, 
  Phone
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [riskFilter, setRiskFilter] = useState<string>(searchParams.get('risk') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (riskFilter) params.risk_level = riskFilter;
      const list = await api.get<PatientSummary[]>('/patients', params);
      setPatients(list);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            <span>Patient Registry & Longitudinal Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patient demographic records, cardiovascular baselines, and historical stroke assessments.
          </p>
        </div>

        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative w-full">
          <input
            type="text"
            placeholder="Search patient name, ID (e.g. P-1001), or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-semibold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Risk Level Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-700 w-full md:w-auto"
          >
            <option value="">All Urgency Tiers</option>
            <option value="HIGH">High Urgency / Emergency</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Patients Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Latest Urgency Level</th>
                <th className="py-3 px-4">Assessments</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading patient records...</span>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No matching patients found.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search criteria or register a new patient.</p>
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const lastDate = p.last_assessment_date
                    ? new Date(p.last_assessment_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'None';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{p.patient_id}</td>
                      <td className="py-3.5 px-4">
                        <Link to={`/patients/${p.id}`} className="font-bold text-slate-900 hover:text-brand-600">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {p.age} yrs • {p.gender}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {p.phone}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.last_risk_level ? (
                          <RiskBadge level={p.last_risk_level} score={p.last_risk_score} showScore size="sm" />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No assessment</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                          {p.total_assessments} record{p.total_assessments !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/assessment/new?patient_id=${p.id}`}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg transition-colors text-[11px]"
                        >
                          New FAST
                        </Link>
                        <Link
                          to={`/patients/${p.id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-[11px]"
                        >
                          Profile →
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

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientCreated={(newPatient) => {
          fetchPatients();
          navigate(`/patients/${newPatient.id}`);
        }}
      />
    </div>
  );
};
