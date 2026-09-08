import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Globe,
  Coins,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { ClientUser, MarketAsset } from '../../types';
import { StoreService } from '../../services/store';
import { currencyRates, translations } from '../../services/translations';

interface ClientAuthProps {
  onSuccessLogin: (user: ClientUser) => void;
  markets: MarketAsset[];
  initialMode?: 'login' | 'register';
}

export const ClientAuth: React.FC<ClientAuthProps> = ({
  onSuccessLogin,
  markets,
  initialMode = 'login'
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United States');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState<string | null>(null);

  const t = translations[language] || translations.en;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = StoreService.loginClient(email, password);
    if (user) {
      onSuccessLogin(user);
    } else {
      setError('Invalid email or password. Please verify your credentials or register an account.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required registration fields.');
      return;
    }

    try {
      const newUser = StoreService.registerClient({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || '+1 415 555 0199',
        country,
        currency,
        language
      });
      onSuccessLogin(newUser);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Ticker Ribbon */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 py-2 px-4 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Crypto Liquidity
            </div>
            {markets.slice(0, 5).map((m) => (
              <div key={m.symbol} className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">{m.symbol}</span>
                <span className="font-mono font-bold text-white">${m.price.toLocaleString()}</span>
                <span className={`text-[10px] font-bold ${m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {m.change24h >= 0 ? '+' : ''}{m.change24h}%
                </span>
              </div>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Tier-1 Broker Execution</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">SEC & FinCEN Registered</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/30 text-white font-black text-3xl mb-3">
              C
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>Craken</span>
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-blue-600 text-white tracking-wider">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Institutional Multi-Asset Trading Platform & Brokerage
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Tab switch: Sign In vs Register */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800">
              <button
                type="button"
                id="tab-auth-login"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isRegister
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-auth-register"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isRegister
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Open Account
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div>{error}</div>
                {error.includes('already registered') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError(null);
                    }}
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Click here to Sign In with your existing password</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {!isRegister ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Trading Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@trading.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5">
                    <span>Password</span>
                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-blue-400 hover:underline">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="client-signin-btn"
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Lock className="w-4 h-4" />
                  Sign In To Trading Terminal
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Michael Thorne"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. michael@investor.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Base Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {Object.keys(currencyRates).map((c) => (
                        <option key={c} value={c}>
                          {c} ({currencyRates[c].symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="pt">Português</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      id="reg-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="client-register-btn"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Create Institutional Trading Account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer (STRICTLY NO ADMIN LINK) */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>craken Pro Trading © 2026. All rights reserved.</div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Risk Disclosure</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>FinCEN & SEC Regulatory Notice</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
