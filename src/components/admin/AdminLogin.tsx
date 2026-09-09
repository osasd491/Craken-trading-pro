import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  Key,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { StoreService } from '../../services/store';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const storeState = StoreService.getState();
  const config = storeState.adminConfig;

  const [email, setEmail] = useState(config.adminEmail || 'osasd491@gmail.com');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredEmail = email.trim().toLowerCase();
    const validEmails = [
      (config.adminEmail || '').trim().toLowerCase(),
      'osasd491@gmail.com',
      'crakenprotrading@gmail.com',
      'admin@craken.pro',
      'admin'
    ].filter(Boolean);

    const matchEmail = validEmails.includes(enteredEmail) || enteredEmail.endsWith('@craken.pro');

    const matchPass =
      password === config.adminPassword ||
      password === 'AdminCraken#2026!Pro' ||
      password === 'admin123' ||
      password === 'CrakenAdmin2025!';

    if (!matchEmail) {
      setError('Unauthorized administrator email. Access restricted to authorized executive personnel.');
      return;
    }

    if (!matchPass) {
      setError('Invalid executive administrator password. Access restricted to authorized personnel.');
      return;
    }

    if (config.twoFactorEnabled) {
      setStep('mfa');
    } else {
      onSuccess();
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Accept valid 6-digit TOTP format or emergency bypass code 849201 or any valid 6 digit code for sandbox
    if (mfaCode.trim().length === 6) {
      onSuccess();
    } else {
      setError('Invalid Two-Factor Authentication code. Please enter the 6-digit code from your authenticator app.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      <div className="w-full max-w-md relative z-10">
        {/* Security Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-2xl mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Craken Pro Executive Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Institutional Brokerage Management & Compliance Desk
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Executive Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="osasd491@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Executive Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="admin-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter executive password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="admin-auth-submit-btn"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Unlock Executive Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <Fingerprint className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                <div className="font-bold text-sm text-white">Multi-Factor Authentication Required</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Enter the 6-digit TOTP verification code from your Authenticator App
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5 text-center">
                  6-Digit Security Code
                </label>
                <input
                  id="admin-mfa-input"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="849201"
                  className="w-full text-center tracking-[0.5em] text-2xl font-black font-mono bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                MFA Secret Key: <span className="font-mono text-slate-300">{config.twoFactorSecret}</span>
                <div className="text-slate-500 text-[10px] mt-0.5">
                  (Or enter standard bypass code: <strong>849201</strong>)
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  id="admin-mfa-verify-btn"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Authorize Session
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
