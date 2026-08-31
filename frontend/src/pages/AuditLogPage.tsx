import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AuditLog } from '../types';
import { 
  ShieldCheck, 
  History, 
  Search, 
  Filter, 
  Clock, 
  User, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Lock 
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      const list = await api.get<AuditLog[]>('/audit-logs', params);
      setLogs(list);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    const term = searchFilter.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.user_name.toLowerCase().includes(term) ||
      log.user_type.toLowerCase().includes(term) ||
      JSON.stringify(log.details).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <span>Clinical Audit & Compliance Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable healthcare compliance trail tracking physician actions, camera screenings, and referral dispatches.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search audit trail by actor, patient ID, or action..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 text-slate-700 font-medium w-full sm:w-auto"
        >
          <option value="">All Action Types</option>
          <option value="Sign In">Authentication / Logins</option>
          <option value="Assessment">Clinical Assessments</option>
          <option value="Screening">Camera & Voice Screenings</option>
          <option value="Referral">Emergency Referrals</option>
          <option value="Patient">Patient Registrations</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Retrieving audit event ledger...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-1">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="font-bold text-xs">No matching audit events recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor / Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Metadata & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          log.user_type === 'Doctor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {log.user_type}
                        </span>
                        <strong className="text-slate-800">{log.user_name}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900">{log.action}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {Object.keys(log.details || {}).length > 0 ? (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {JSON.stringify(log.details)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
