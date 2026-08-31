import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  AlertOctagon, 
  Building2, 
  SendHorizontal, 
  FileText, 
  User, 
  Camera, 
  ShieldCheck, 
  Ambulance,
  LogOut
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { role, doctor, hospitalStaff, logout } = useAuth();

  const doctorNavItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patient Registry', icon: Users },
    { to: '/assessment/new', label: 'New Assessment', icon: Activity },
    { to: '/befast', label: 'BE-FAST Camera Suite', icon: Camera, highlight: true },
    { to: '/emergency', label: 'Emergency Alerts', icon: AlertOctagon },
    { to: '/hospitals', label: 'Stroke Hospitals', icon: Building2 },
    { to: '/referrals', label: 'Referrals & Dispatch', icon: SendHorizontal },
    { to: '/audit-logs', label: 'Compliance Audit Log', icon: ShieldCheck },
    { to: '/reports', label: 'Clinical Reports', icon: FileText },
    { to: '/profile', label: 'Doctor Profile', icon: User },
  ];

  const hospitalNavItems: NavItem[] = [
    { to: '/hospital/dashboard', label: 'Inbound Referrals', icon: Ambulance },
    { to: '/hospital/dashboard', label: 'Active Emergencies', icon: AlertOctagon },
    { to: '/referrals', label: 'Referral History', icon: SendHorizontal },
    { to: '/audit-logs', label: 'Audit Trail', icon: ShieldCheck },
    { to: '/profile', label: 'Hospital Profile', icon: Building2 },
  ];

  const navItems: NavItem[] = role === 'hospital_staff' ? hospitalNavItems : doctorNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col justify-between py-6 px-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Role Badge Indicator */}
        <div className="px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200 space-y-0.5">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
            Active Portal Mode:
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${role === 'hospital_staff' ? 'bg-purple-500' : 'bg-brand-500'}`} />
            <strong className="text-xs font-bold text-slate-900">
              {role === 'hospital_staff' ? 'Receiving Stroke Center' : 'Physician Clinical Portal'}
            </strong>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-xs border border-brand-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${item.highlight ? 'ring-1 ring-brand-400/40 bg-brand-50/40' : ''}`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-[9px] bg-brand-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Sign Out */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="truncate">
            <p className="font-bold text-slate-800 text-xs truncate">
              {role === 'hospital_staff' ? hospitalStaff?.name : doctor?.name || 'Dr. Sarah Chen, MD'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {role === 'hospital_staff' ? 'Triage Coordinator' : 'Attending Neurologist'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
