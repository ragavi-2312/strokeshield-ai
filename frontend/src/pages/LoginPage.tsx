import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  Stethoscope, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Clock,
  Navigation,
  Brain
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDrRaha, loginAsDrVijay, loginAsDemoHospitalStaff } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (loginFn: () => Promise<void>, targetPath = '/dashboard') => {
    setError(null);
    setIsLoading(true);
    try {
      await loginFn();
      navigate(targetPath);
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-teal-500 selection:text-white">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* LEFT PANEL: Branding, Value Prop & Hackathon Demo Context */}
        <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Brand */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">StrokeShield</h1>
                  <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    AI
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Early Triage & Emergency Referral Platform</p>
              </div>
            </div>

            {/* Purpose Pitch */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Rapid Clinical Stroke Triage in the Golden Hour.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                StrokeShield AI assists emergency physicians and clinicians with computer-vision facial asymmetry analysis, BE-FAST testing, multi-modal urgency scoring, and road-navigated hospital dispatch.
              </p>
            </div>

            {/* 4 Clinical Pillars */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 mt-0.5 text-teal-300">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block font-bold">Quantitative Landmark Vision</strong>
                  <span className="text-slate-400 text-[11px]">Continuous 0–100 geometric facial deviation & arm pronator drift tracking.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 mt-0.5 text-teal-300">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block font-bold">Last Known Well Window</strong>
                  <span className="text-slate-400 text-[11px]">Calculates elapsed time against 4.5-hour thrombolysis window.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 mt-0.5 text-teal-300">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white block font-bold">Exact GPS & Road Routing</strong>
                  <span className="text-slate-400 text-[11px]">Ranks stroke-capable CT/MRI hospitals with turn-by-turn navigation.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Notice Footer */}
          <div className="pt-6 mt-6 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hackathon Prototype Demo • 100% Synthetic Fictional Identities</span>
          </div>
        </div>

        {/* RIGHT PANEL: Clean Physician Login Form & 1-Click Demo Profiles */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            
            {/* Form Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                Healthcare Provider Access
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Doctor Login</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select an AI-generated demo profile or sign in with authorized credentials.
              </p>
            </div>

            {/* 1-CLICK DEMO ACCOUNTS (Section 21) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Demo Accounts (1-Click Login):
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                  DEMO ONLY
                </span>
              </div>

              {/* Dr. Raha */}
              <button
                type="button"
                onClick={() => handleQuickLogin(loginAsDrRaha)}
                disabled={isLoading}
                className="w-full p-3 bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    DR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 group-hover:text-teal-900">Dr. Raha</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">Neurologist</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Demo Stroke Care Hospital • Chennai (+91 98765 43210)
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Dr. Vijay */}
              <button
                type="button"
                onClick={() => handleQuickLogin(loginAsDrVijay)}
                disabled={isLoading}
                className="w-full p-3 bg-slate-50 hover:bg-cyan-50/80 border border-slate-200 hover:border-cyan-300 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    DV
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-900">Dr. Vijay</span>
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded font-bold">Emergency Specialist</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Demo Neuro Emergency Hospital • Chennai (+91 87654 32109)
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Hospital Staff */}
              <button
                type="button"
                onClick={() => handleQuickLogin(loginAsDemoHospitalStaff, '/hospital/dashboard')}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Login as Receiving Hospital Staff (Metro Stroke Center)</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                or sign in with password
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="raha@demo-strokeshield.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-800"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md shadow-slate-900/10 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating Provider...</span>
                  </>
                ) : (
                  <span>Sign In with Password</span>
                )}
              </button>
            </form>
          </div>

          {/* Medical Safety Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong>Clinical Safety Notice:</strong> StrokeShield AI provides clinical decision support and triage assistance. It does not replace diagnostic neuroimaging (CT/MRI) or certified clinical diagnosis.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
