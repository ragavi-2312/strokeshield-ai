import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { EmergencyAlert } from '../../types';
import { 
  Activity, 
  Bell, 
  User, 
  LogOut, 
  AlertOctagon, 
  Building2, 
  Repeat,
  Menu,
  X,
  Stethoscope,
  ChevronDown,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, isMobileMenuOpen = false }) => {
  const { doctor, hospitalStaff, role, logout, loginAsDrRaha, loginAsDemoHospitalStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  }, [role, location.pathname]);

  const handleRoleSwitch = async () => {
    if (role === 'doctor') {
      await loginAsDemoHospitalStaff();
      navigate('/hospital/dashboard');
    } else {
      await loginAsDrRaha();
      navigate('/dashboard');
    }
  };

  const doctorName = doctor?.name || 'Dr. Raha';
  const doctorSpecialty = doctor?.specialization || 'Neurologist';
  const hospitalName = doctor?.hospital || 'Demo Stroke Care Hospital';

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Platform Name */}
          <Link 
            to={role === 'hospital_staff' ? '/hospital/dashboard' : '/dashboard'} 
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  StrokeShield
                </span>
                <span className="bg-teal-50 text-teal-700 border border-teal-200/80 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-1 hidden sm:block">
                Clinical Stroke Triage & Emergency Referral
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Role Switcher, Alert Bell & Doctor Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Demo Identity Badge */}
          <div className="hidden xl:flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>🟡 AI-GENERATED DEMO PROFILE</span>
          </div>

          {/* Role Portal Switcher Button */}
          <button
            type="button"
            onClick={handleRoleSwitch}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              role === 'hospital_staff'
                ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
            }`}
            title="Switch between Physician and Receiving Hospital Staff views"
          >
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">
              Switch to {role === 'doctor' ? 'Hospital Staff' : 'Doctor View'}
            </span>
          </button>

          {/* Emergency Alert Bell (Physician Mode) */}
          {role === 'doctor' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden"
                aria-label="Emergency Alerts"
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Emergency Alert Dropdown */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-3 space-y-2 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-red-600" />
                      <span>Active Emergency Alerts ({alerts.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No active emergency stroke alerts.</p>
                    ) : (
                      alerts.map((a) => (
                        <Link
                          key={a.assessment_id}
                          to={`/assessment/result/${a.assessment_id}`}
                          onClick={() => setIsAlertsOpen(false)}
                          className="p-2.5 bg-red-50 hover:bg-red-100/80 rounded-xl border border-red-200 text-xs block transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-red-950 font-bold">{a.patient_name}</strong>
                            <span className="font-mono text-[10px] bg-red-200 text-red-900 px-1.5 py-0.5 rounded font-black">
                              {a.risk_score.toFixed(0)}/100
                            </span>
                          </div>
                          <p className="text-[11px] text-red-700 truncate mt-0.5">{a.symptom_duration_text}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Physician / Hospital Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 ${
                role === 'hospital_staff' ? 'bg-purple-700' : 'bg-teal-700'
              }`}>
                {role === 'hospital_staff' ? 'H' : 'Dr'}
              </div>
              <div className="text-left hidden md:block leading-tight max-w-[140px]">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {role === 'hospital_staff' ? hospitalStaff?.name || 'Hospital Team' : doctorName}
                </span>
                <span className="text-[10px] text-slate-500 block truncate font-medium">
                  {role === 'hospital_staff' ? 'Demo Stroke Center' : doctorSpecialty}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-700 uppercase tracking-wider mb-0.5">
                    <span>🟡 DEMO ACCOUNT</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {role === 'hospital_staff' ? hospitalStaff?.name : doctorName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate font-medium">
                    {role === 'hospital_staff' ? hospitalStaff?.email : doctor?.email}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {hospitalName}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Doctor Profile & Credentials</span>
                  </Link>

                  <button
                    type="button"
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
