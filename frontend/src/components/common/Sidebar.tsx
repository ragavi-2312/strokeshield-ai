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
  LogOut,
  X,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: string;
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const { role, doctor, hospitalStaff, logout } = useAuth();

  const doctorNavItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patient Registry', icon: Users },
    { to: '/assessment/new', label: 'New Assessment', icon: Activity, highlight: true },
    { to: '/befast', label: 'BE-FAST Camera Suite', icon: Camera, badge: 'AI' },
    { to: '/emergency', label: 'Emergency Alerts', icon: AlertOctagon },
    { to: '/hospitals', label: 'Stroke Hospitals', icon: Building2 },
    { to: '/referrals', label: 'Referrals & Dispatch', icon: SendHorizontal },
    { to: '/audit-logs', label: 'Compliance Audit Log', icon: ShieldCheck },
    { to: '/reports', label: 'Clinical Reports', icon: FileText },
    { to: '/profile', label: 'Doctor Profile', icon: User },
  ];

  const hospitalNavItems: NavItem[] = [
    { to: '/hospital/dashboard', label: 'Inbound Referrals', icon: Ambulance },
    { to: '/emergency', label: 'Active Emergencies', icon: AlertOctagon },
    { to: '/referrals', label: 'Referral History', icon: SendHorizontal },
    { to: '/audit-logs', label: 'Audit Trail', icon: ShieldCheck },
    { to: '/profile', label: 'Hospital Profile', icon: Building2 },
  ];

  const navItems: NavItem[] = role === 'hospital_staff' ? hospitalNavItems : doctorNavItems;
  const doctorName = doctor?.name || 'Dr. Raha';

  const NavContent = () => (
    <div className="flex flex-col justify-between h-full py-5 px-3">
      <div className="space-y-5">
        
        {/* Active Portal Mode Card */}
        <div className="px-3.5 py-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
              Active Portal:
            </span>
            <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded-full">
              DEMO
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${role === 'hospital_staff' ? 'bg-purple-600' : 'bg-teal-600'}`} />
            <strong className="text-xs font-bold text-slate-900 truncate">
              {role === 'hospital_staff' ? 'Receiving Center' : 'Physician Triage Portal'}
            </strong>
          </div>
        </div>

        {/* Navigation Link List */}
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                  } ${item.highlight ? 'ring-1 ring-teal-400/30 bg-teal-50/40 text-teal-900' : ''}`
                }
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[9px] bg-teal-700 text-white font-black px-1.5 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !item.badge && (
                  <span className="ml-auto text-[9px] bg-teal-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">
                    + NEW
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card & Sign Out */}
      <div className="pt-4 border-t border-slate-100 mt-6">
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="truncate mr-2">
            <p className="font-bold text-slate-900 text-xs truncate">
              {role === 'hospital_staff' ? hospitalStaff?.name : doctorName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {role === 'hospital_staff' ? 'Triage Coordinator' : doctor?.specialization || 'Neurologist'}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 shrink-0 hidden md:block min-h-[calc(100vh-4rem)]">
        <NavContent />
      </aside>

      {/* Mobile Drawer (Slide-out) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
          />
          {/* Drawer Menu */}
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-xs">
                  SS
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">StrokeShield AI</h3>
                  <p className="text-[10px] text-slate-400">Clinical Navigation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <NavContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
