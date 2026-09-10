import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Building2,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  Camera,
  FileCheck,
  SendHorizontal
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDrRaha, loginAsDrVijay, loginAsDemoHospitalStaff } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validate and submit credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      setSuccessMessage('Welcome back, Doctor! 👋');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: any) {
      const errorStr = (err?.message || '').toLowerCase();
      if (!navigator.onLine || errorStr.includes('network') || errorStr.includes('failed to fetch')) {
        setErrorMessage("We couldn't connect right now. Please check your internet connection.");
      } else if (errorStr.includes('401') || errorStr.includes('invalid') || errorStr.includes('unauthorized')) {
        setErrorMessage("Email or password doesn't look right. Please check and try again.");
      } else {
        setErrorMessage('Something went wrong on our side. Please try again in a moment.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Demo 1-Click Access
  const handleDemoLogin = async (
    loginFn: () => Promise<void>, 
    doctorDisplayName: string, 
    targetPath = '/dashboard'
  ) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await loginFn();
      setSuccessMessage(`Welcome back, ${doctorDisplayName}! 👋`);
      setTimeout(() => {
        navigate(targetPath);
      }, 700);
    } catch (err: any) {
      setErrorMessage('Something went wrong on our side. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Top Bar on Mobile */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between lg:hidden mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base text-slate-900">StrokeShield AI</span>
        </div>
        <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
          DEMO ACCESS
        </span>
      </div>

      {/* Main Two-Section Grid Container */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT SECTION: WELCOMING INTRODUCTION (Sections 1, 2, 3) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 bg-slate-900 text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8 relative overflow-hidden order-2 lg:order-1">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Brand & Introduction */}
          <div className="space-y-6 relative z-10">
            {/* Logo + Platform Badge */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">StrokeShield</h1>
                  <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    AI
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">AI-Assisted Stroke Screening</p>
              </div>
            </div>

            {/* Prominent Friendly Greeting */}
            <div className="space-y-2 pt-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, Doctor 👋
              </h2>
              <p className="text-sm font-bold text-teal-300">
                Screen. Assess. Act faster.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-normal pt-1">
                StrokeShield AI supports doctors with AI-assisted analysis of patient symptoms, vitals, facial movement, arm movement and speech.
              </p>
            </div>

            {/* WHAT HAPPENS AFTER YOU SIGN IN? (Section 11) */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 block">
                What happens after you sign in?
              </span>

              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700/60 font-bold text-[10px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>Add patient details</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700/60 font-bold text-[10px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>Record symptoms and vitals</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700/60 font-bold text-[10px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>Perform AI-assisted screening (Face, Arm, Speech)</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700/60 font-bold text-[10px] flex items-center justify-center shrink-0">
                    4
                  </span>
                  <span>Review the results & confirm clinical decision</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700/60 font-bold text-[10px] flex items-center justify-center shrink-0">
                    5
                  </span>
                  <span>Refer urgent cases to nearby stroke centers with GPS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Note */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Designed for emergency stroke triage in the golden hour.</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SECTION: CLEAN LOGIN CARD & DEMO ACCESS (Sections 4, 5, 6, 7) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6 order-1 lg:order-2">
          
          <div className="space-y-6">
            
            {/* Card Header */}
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome back 👋
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to continue to your doctor dashboard.
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !successMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Standard Login Form (Section 4) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors text-slate-900"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password Field with Show/Hide Toggle (Section 9) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors text-slate-900"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  
                  {/* Show/Hide Password Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded focus:outline-hidden"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Sign In Button (Section 5) */}
              <button
                type="submit"
                disabled={isLoading || !!successMessage}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* DEMO ACCESS SECTION (Sections 6 & 7) */}
            <div className="pt-2 space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">
                  DEMO ACCESS
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <div className="space-y-1 text-center">
                <p className="text-[11px] text-slate-500 font-medium">
                  Try the demo without creating an account.
                </p>
              </div>

              {/* Demo Profile Cards */}
              <div className="space-y-2">
                
                {/* Dr. Raha */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin(loginAsDrRaha, 'Dr. Raha')}
                  disabled={isLoading || !!successMessage}
                  className="w-full p-3 bg-slate-50 hover:bg-teal-50/80 border border-slate-200 hover:border-teal-300 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      DR
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-teal-900">
                          Continue as Dr. Raha
                        </span>
                        <span className="text-[9px] bg-teal-100 text-teal-800 font-black px-1.5 py-0.2 rounded">
                          DEMO
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Neurologist • Demo Stroke Care Hospital
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* Dr. Vijay */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin(loginAsDrVijay, 'Dr. Vijay')}
                  disabled={isLoading || !!successMessage}
                  className="w-full p-3 bg-slate-50 hover:bg-cyan-50/80 border border-slate-200 hover:border-cyan-300 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      DV
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-900">
                          Continue as Dr. Vijay
                        </span>
                        <span className="text-[9px] bg-cyan-100 text-cyan-800 font-black px-1.5 py-0.2 rounded">
                          DEMO
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Emergency Medicine Specialist • Demo Neuro Emergency Hospital
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* Hospital Staff Demo */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin(loginAsDemoHospitalStaff, 'Hospital Team', '/hospital/dashboard')}
                  disabled={isLoading || !!successMessage}
                  className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>Continue as Receiving Hospital Staff</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <span className="text-[10px] text-slate-400 block font-medium">
                  AI-GENERATED DEMO PROFILE • Fictional account for demonstration only.
                </span>
              </div>
            </div>

          </div>

          {/* TRUST MESSAGE & MEDICAL DISCLAIMER (Sections 12 & 13) */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-center text-slate-400 text-[10px] leading-relaxed">
            <p>
              Your patient information should be handled securely and only used for authorized clinical workflows.
            </p>
            <p className="text-[9.5px] text-slate-400">
              StrokeShield AI provides AI-assisted screening support and does not replace professional medical diagnosis or emergency medical care.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
