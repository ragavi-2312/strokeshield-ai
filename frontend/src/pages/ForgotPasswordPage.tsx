import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('dr.sarah@strokeshield.ai');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<any>('/auth/forgot-password', { email });
      setMessage(res.message);
      setSubmitted(true);
    } catch {
      setMessage('Password reset request logged.');
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-slate-900 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Reset Doctor Credentials</h2>
          <p className="text-xs text-slate-500">Enter registered email for password recovery dispatch</p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-emerald-900">{message}</p>
            <p className="text-[11px] text-emerald-700">
              For demo testing, login with <strong>dr.sarah@strokeshield.ai</strong> / <strong>Doctor@123</strong>.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Send Reset Link
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Doctor Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
