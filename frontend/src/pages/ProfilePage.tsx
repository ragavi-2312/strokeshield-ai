import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  LogOut, 
  Lock,
  MapPin,
  Award,
  AlertCircle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { doctor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDrRaha = doctor?.email?.includes('raha') || doctor?.name?.includes('Raha');
  const regNumber = doctor?.registration_number || (isDrRaha ? 'DEMO-REG-RAHA' : 'DEMO-REG-VIJAY');
  const expYears = doctor?.experience_years || 6;
  const location = doctor?.location || 'Chennai, Tamil Nadu';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200/80 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Physician Credentials
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-teal-700" />
          <span>Doctor Profile & Clinical Credentials</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          AI-generated physician identity for hackathon stroke triage and emergency navigation demonstrations.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-800 via-teal-700 to-cyan-500 flex items-center justify-center text-white text-2xl font-black shadow-sm shrink-0">
            {doctor?.name ? doctor.name.replace('Dr. ', '').charAt(0) : 'R'}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-black text-slate-900">{doctor?.name || 'Dr. Raha'}</h2>
              <span className="bg-amber-50 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                🟡 AI-GENERATED DEMO PROFILE
              </span>
            </div>
            <p className="text-xs text-teal-700 font-bold flex items-center justify-center sm:justify-start gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{doctor?.specialization || 'Neurologist'}</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{doctor?.hospital || 'Demo Stroke Care Hospital'}</span>
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{location}</span>
            </p>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </span>
            <strong className="text-slate-900 block text-sm font-mono">{doctor?.email || 'raha@demo-strokeshield.com'}</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Indian Mobile Contact (Fictional)</span>
            </span>
            <strong className="text-slate-900 block text-sm font-mono">{doctor?.phone || '+91 98765 43210'}</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Clinical Experience</span>
            </span>
            <strong className="text-slate-900 block text-sm">{expYears} Years Specialist Experience</strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Medical Registration (Demo Only)</span>
            </span>
            <div className="flex items-center gap-2">
              <strong className="text-teal-800 font-mono text-sm">{regNumber}</strong>
              <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded">DEMO ONLY</span>
            </div>
          </div>
        </div>

        {/* AI Demo Transparency Callout */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>AI-Generated Demo Identity Transparency</span>
          </div>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            This profile is an AI-generated fictional identity (<code>data_type: DEMO</code>, <code>data_source: AI_GENERATED</code>) used exclusively for hackathon demonstration. It does not correspond to any real physician or personal data.
          </p>
        </div>

        {/* Security & Sign Out */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>Authenticated Demo Session</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
