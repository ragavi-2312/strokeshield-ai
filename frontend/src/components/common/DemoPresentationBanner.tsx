import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  ChevronRight, 
  PlayCircle, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  HelpCircle,
  X,
  Camera,
  MapPin,
  Ambulance,
  Building2,
  Repeat
} from 'lucide-react';

interface DemoPresentationBannerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DemoPresentationBanner: React.FC<DemoPresentationBannerProps> = ({ 
  isOpen = false, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { loginAsDemoDoctor, loginAsDemoHospitalStaff, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'flow' | 'scenarios' | 'roles'>('flow');

  if (!isOpen) return null;

  const demoSteps = [
    { num: 1, title: 'Physician Authentication', desc: 'Secure login as Dr. Sarah Chen, MD (Vascular Neurology) with saved clinic GPS' },
    { num: 2, title: 'Patient Registry', desc: 'Auto-generated ID (P-1001), longitudinal vitals history & clinical risk factors' },
    { num: 3, title: 'BE-FAST Camera Suite', desc: 'Normalized Facial Symmetry Deviation, 5s Arm Drift holding test, and Speech repetition' },
    { num: 4, title: 'AI Urgency Stratification', desc: 'Calculates Urgency Score (0-100), Last Known Well elapsed window, and contributing factors' },
    { num: 5, title: 'Doctor Confirmation Gate', desc: 'Mandatory physician authorization checkbox before referral creation' },
    { num: 6, title: 'GPS Stroke Hospital Discovery', desc: 'Smart capability matching (Comprehensive Stroke Centers > 24/7 ER > Distance)' },
    { num: 7, title: 'Leaflet Emergency Route & Maps', desc: 'Interactive route polyline with 1-click turn-by-turn navigation deep links' },
    { num: 8, title: 'Secure Referral Token QR', desc: 'Encrypted QR token transmitting EMS emergency summary to receiving center' },
    { num: 9, title: 'Hospital Staff Receiving Portal', desc: 'Stroke center team 1-click updates (Accepted -> Preparing CT -> Patient Arrived)' },
    { num: 10, title: 'Compliance Audit Ledger', desc: 'Permanent immutable audit trail logging all clinical actions and logins' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-6 rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Hackathon Demonstration & Judging Guide</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">StrokeShield AI End-to-End Presentation Flow</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            From in-browser camera facial symmetry analysis and AI urgency scoring to GPS hospital discovery, Leaflet mapping, turn-by-turn navigation, and hospital staff coordination.
          </p>

          {/* Tab Selector */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setActiveTab('flow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'flow'
                  ? 'bg-brand-500 text-white shadow'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              10-Step Journey
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scenarios'
                  ? 'bg-brand-500 text-white shadow'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Pre-Loaded Clinical Scenarios
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roles'
                  ? 'bg-brand-500 text-white shadow'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Role Switcher (Doctor ↔ Hospital)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'flow' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {demoSteps.map((step) => (
                  <div 
                    key={step.num}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3 hover:border-brand-300 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{step.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500 italic">
                  * Prototype geometric scores & demo hospital data for healthcare decision support.
                </p>
                <button
                  onClick={() => {
                    onClose?.();
                    navigate('/befast');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl shadow-md shadow-brand-500/20"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Launch BE-FAST Camera Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : activeTab === 'scenarios' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Click any scenario below to explore pre-configured synthetic clinical presentations:
              </p>

              {/* Scenario 1 */}
              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-900">Scenario A: Acute Code Stroke Presentation (High Urgency)</span>
                    <span className="bg-red-200 text-red-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded">FAST +</span>
                  </div>
                  <p className="text-xs text-red-800 mt-1">
                    Robert Jenkins (P-1001) • 68M • Right facial droop & arm drift (Onset ~65 min) • BP 188/108
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose?.();
                    navigate('/patients/1');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shrink-0 shadow-sm"
                >
                  View Profile & Summary
                </button>
              </div>

              {/* Scenario 2 */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900">Scenario B: Moderate Risk Followup</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded">Moderate</span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Maria Rodriguez (P-1002) • 59F • Hypertension & Diabetes • BP 156/96 • FAST Normal
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose?.();
                    navigate('/patients/2');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shrink-0 shadow-sm"
                >
                  View Profile & Vitals
                </button>
              </div>

              {/* Scenario 3 */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900">Scenario C: Routine Low-Risk Screening</span>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded">Low Risk</span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    Linda Chang (P-1004) • 45F • Normal vitals (BP 118/76) • Tobacco use counseling
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose?.();
                    navigate('/patients/4');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shrink-0 shadow-sm"
                >
                  View Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Switch between the Physician Portal and Receiving Stroke Center Portal to test live two-way coordination:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-brand-50/50 space-y-3">
                  <span className="text-xs font-extrabold text-brand-900 block">👨‍⚕️ Physician Portal</span>
                  <p className="text-xs text-slate-600">
                    Dr. Sarah Chen, MD • Full patient registry, camera BE-FAST assessments, GPS hospital search, and referral dispatch.
                  </p>
                  <button
                    onClick={async () => {
                      await loginAsDemoDoctor();
                      onClose?.();
                      navigate('/dashboard');
                    }}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl shadow-xs"
                  >
                    Switch to Doctor Portal
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-3">
                  <span className="text-xs font-extrabold text-purple-900 block">🏥 Receiving Stroke Center Portal</span>
                  <p className="text-xs text-slate-600">
                    Metro Comprehensive Stroke Center • Inbound ambulance queue, 1-click status updates (Accept, Prepare, Arrived).
                  </p>
                  <button
                    onClick={async () => {
                      await loginAsDemoHospitalStaff();
                      onClose?.();
                      navigate('/hospital/dashboard');
                    }}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-xs"
                  >
                    Switch to Hospital Staff Portal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
