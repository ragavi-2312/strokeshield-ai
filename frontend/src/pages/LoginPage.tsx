import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Stethoscope,
  Ambulance,
  AlertCircle
} from 'lucide-react';
import { MedicalDisclaimer } from '../components/common/MedicalDisclaimer';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDrRaha, loginAsDrVijay, loginAsDemoHospitalStaff } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.message || 'Invalid physician or hospital credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrRahaLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDrRaha();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login as Dr. Raha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrVijayLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDrVijay();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login as Dr. Vijay');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoHospitalLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDemoHospitalStaff();
      navigate('/hospital/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login as hospital staff');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>StrokeShield</span>
              <span className="text-[10px] bg-brand-500/20 border border-brand-400/30 text-brand-300 px-1.5 py-0.5 rounded font-mono">
                AI
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Clinical Triage & Emergency Referral System</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-bold">🟡 AI-GENERATED DEMO MODE</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8 space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6">
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
              🟡 Hackathon Prototype Access
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Doctor Login
            </h2>
            <p className="text-xs text-slate-500">
              Select an AI-generated demo doctor profile or sign in with email.
            </p>
          </div>

          {/* Quick Demo Access Buttons */}
          <div className="space-y-2.5">
            {/* Dr. Raha */}
            <button
              type="button"
              onClick={handleDrRahaLogin}
              disabled={isLoading}
              className="w-full p-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white rounded-2xl text-left shadow-md shadow-brand-600/20 flex items-center justify-between transition-all group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs">Dr. Raha</span>
                  <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">Neurologist</span>
                </div>
                <p className="text-[11px] text-brand-100">
                  Demo Stroke Care Hospital • Chennai (+91 98765 43210)
                </p>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Dr. Vijay */}
            <button
              type="button"
              onClick={handleDrVijayLogin}
              disabled={isLoading}
              className="w-full p-3.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white rounded-2xl text-left shadow-md shadow-teal-600/20 flex items-center justify-between transition-all group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs">Dr. Vijay</span>
                  <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">Emergency Specialist</span>
                </div>
                <p className="text-[11px] text-teal-100">
                  Demo Neuro Emergency Hospital • Chennai (+91 87654 32109)
                </p>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Hospital Staff */}
            <button
              type="button"
              onClick={handleDemoHospitalLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Login as Hospital Staff (Demo Stroke Center)</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              or enter credentials
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="raha@demo-strokeshield.com or vijay@demo-strokeshield.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Password</label>
                <span className="text-[10px] text-slate-400 font-mono">Demo: Doctor@123</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow transition-colors flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In with Password'}</span>
            </button>
          </form>
        </div>

        {/* Demo Transparency Disclaimer */}
        <div className="text-center bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
          <p className="text-[11px] text-slate-300 leading-relaxed flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Demo Notice:</strong> Dr. Raha and Dr. Vijay are synthetic AI-generated demo identities for testing. No real doctor credentials or private data are used.</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-500 text-xs py-2">
        <p>StrokeShield AI © 2026 • Advanced Clinical Triage & Emergency Referral Engine</p>
      </footer>
    </div>
  );
};
