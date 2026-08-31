import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { EmergencyAlert } from '../../types';
import { 
  Activity, 
  Bell, 
  ShieldCheck, 
  User, 
  LogOut, 
  Search, 
  AlertOctagon, 
  Building2, 
  Sparkles,
  RefreshCw,
  Repeat,
  AlertCircle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { doctor, hospitalStaff, role, logout, loginAsDrRaha, loginAsDrVijay, loginAsDemoHospitalStaff } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (role === 'doctor') {
      api.get<any>('/dashboard/statistics')
        .then((res) => {
          setAlerts(res.emergency_alerts || []);
        })
        .catch(console.error);
    }
  }, [role]);

  const handleRoleSwitch = async () => {
    if (role === 'doctor') {
      await loginAsDemoHospitalStaff();
      navigate('/hospital/dashboard');
    } else {
      await loginAsDrRaha();
      navigate('/dashboard');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to={role === 'hospital_staff' ? '/hospital/dashboard' : '/dashboard'} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">StrokeShield</span>
                <span className="bg-brand-100 text-brand-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Early Triage & Emergency Referral</p>
            </div>
          </Link>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* AI-Generated Demo Profile Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>🟡 AI-GENERATED DEMO PROFILE</span>
          </div>

          {/* Quick Role Switcher Button */}
          <button
            onClick={handleRoleSwitch}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              role === 'hospital_staff'
                ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                : 'bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100'
            }`}
            title="Switch between Physician and Receiving Hospital views"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Switch to {role === 'doctor' ? 'Hospital Staff Portal' : 'Doctor Portal'}
            </span>
          </button>

          {/* Emergency Alert Bell (for Doctor role) */}
          {role === 'doctor' && (
            <div className="relative">
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Alert Dropdown */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-3 space-y-2 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-red-600" />
                      <span>Active Emergency Stroke Alerts ({alerts.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No active emergency alerts.</p>
                    ) : (
                      alerts.map((a) => (
                        <Link
                          key={a.assessment_id}
                          to="/emergency"
                          onClick={() => setIsAlertsOpen(false)}
                          className="p-2 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 text-xs block transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-red-950 font-bold">{a.patient_name}</strong>
                            <span className="font-mono text-[10px] text-red-700">{a.risk_score.toFixed(0)}/100</span>
                          </div>
                          <p className="text-[11px] text-red-700 truncate">{a.symptom_duration_text}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black ${
                role === 'hospital_staff' ? 'bg-purple-600' : 'bg-brand-600'
              }`}>
                {role === 'hospital_staff' ? 'H' : 'Dr'}
              </div>
              <div className="text-left hidden md:block leading-tight">
                <span className="text-xs font-bold text-slate-900 block">
                  {role === 'hospital_staff' ? hospitalStaff?.name || 'Hospital Staff' : doctor?.name || 'Dr. Raha'}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {role === 'hospital_staff' ? 'Demo Stroke Center' : doctor?.specialization || 'Neurologist'}
                </span>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-700 uppercase tracking-wider mb-0.5">
                    <span>🟡 DEMO ACCOUNT</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {role === 'hospital_staff' ? hospitalStaff?.name : doctor?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {role === 'hospital_staff' ? hospitalStaff?.email : doctor?.email}
                  </p>
                  {doctor?.phone && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {doctor.phone} • {doctor.location || 'Chennai, Tamil Nadu'}
                    </p>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Demo Profile & Registration</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
