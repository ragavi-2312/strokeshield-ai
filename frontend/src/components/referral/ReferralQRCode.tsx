import React from 'react';
import { QrCode, ShieldCheck, Lock, Copy, Check } from 'lucide-react';

interface ReferralQRCodeProps {
  referralCode: string;
  hospitalName: string;
  priority: string;
  secureToken?: string;
  issuedAt?: string;
}

export const ReferralQRCode: React.FC<ReferralQRCodeProps> = ({
  referralCode,
  hospitalName,
  priority,
  secureToken = 'sec-tok-991048201',
  issuedAt = new Date().toLocaleTimeString(),
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 text-center max-w-sm mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Referral Handover Token</span>
        </div>
        <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
          {priority}
        </span>
      </div>

      {/* Styled High-Density QR Canvas Mock */}
      <div className="p-4 bg-slate-900 rounded-2xl inline-block shadow-inner">
        <div className="w-48 h-48 bg-white rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Simulated 2D Matrix Matrix Pattern */}
          <div className="grid grid-cols-6 gap-1 w-full h-full p-1 opacity-90">
            {Array.from({ length: 36 }).map((_, i) => {
              const isCorner = [0, 1, 6, 7, 4, 5, 10, 11, 24, 25, 30, 31].includes(i);
              const isFilled = isCorner || (i * 7 + 3) % 3 === 0 || i % 5 === 0;
              return (
                <div
                  key={i}
                  className={`rounded-xs ${
                    isCorner ? 'bg-slate-950 ring-2 ring-slate-900' : isFilled ? 'bg-slate-900' : 'bg-slate-100'
                  }`}
                />
              );
            })}
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-white shadow-md border-2 border-brand-600 flex items-center justify-center">
              <span className="text-[10px] font-black text-brand-700">SS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral ID and Token */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">Referral Identifier</span>
        <div className="flex items-center justify-center gap-2">
          <strong className="font-mono text-base font-black text-slate-900">{referralCode}</strong>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Copy Referral ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs font-medium text-brand-700">{hospitalName}</p>
      </div>

      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 leading-normal">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
        <span>Receiving emergency neurology team can scan this token to open the authorized patient handover chart.</span>
      </div>
    </div>
  );
};
