import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  TrendingUp,
  Globe,
  DollarSign,
  ShieldCheck,
  Bell,
  LogOut,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Coins,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldAlert,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { ClientUser, MarketAsset } from '../../types';
import { currencyRates, formatCurrency, translations } from '../../services/translations';

interface ClientNavbarProps {
  user: ClientUser;
  activeTab: 'dashboard' | 'trading' | 'portfolio' | 'deposit' | 'withdraw' | 'kyc';
  setActiveTab: (tab: 'dashboard' | 'trading' | 'portfolio' | 'deposit' | 'withdraw' | 'kyc') => void;
  onLogout: () => void;
  currentCurrency: string;
  onSelectCurrency: (curr: string) => void;
  currentLanguage: string;
  onSelectLanguage: (lang: string) => void;
  markets: MarketAsset[];
  unreadNotificationsCount: number;
}

export const ClientNavbar: React.FC<ClientNavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  currentCurrency,
  onSelectCurrency,
  currentLanguage,
  onSelectLanguage,
  markets,
  unreadNotificationsCount
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const t = translations[currentLanguage] || translations.en;

  const languagesList = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'zh', label: '中文 (简体)', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ar', label: 'العربية', flag: '🇦🇪' }
  ];

  const handleNavClick = (tab: 'dashboard' | 'trading' | 'portfolio' | 'deposit' | 'withdraw' | 'kyc') => {
    setActiveTab(tab);
    setShowSettingsMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070d19]/95 border-b border-slate-800/80 backdrop-blur-md w-full max-w-full">
      {/* Live Market Ticker Sub-bar (Strictly constrained within container) */}
      <div className="w-full max-w-full bg-slate-900/90 border-b border-slate-800/50 py-1.5 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 text-xs whitespace-nowrap min-w-max">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wider uppercase text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Tier-1 Live Feed
          </div>
          {markets.map((m) => {
            const isUp = m.change24h >= 0;
            return (
              <div key={m.symbol} className="flex items-center gap-2">
                <span className="font-medium text-slate-300">{m.symbol}</span>
                <span className={`font-mono font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${m.price > 10 ? m.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : m.price.toFixed(4)}
                </span>
                <span
                  className={`flex items-center text-[10px] px-1 py-0.2 rounded ${
                    isUp ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                  {Math.abs(m.change24h).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleNavClick('dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-xl tracking-tighter">
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">Craken</span>
              <span className="text-xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-blue-600 text-white tracking-wider">
                PRO v8.3
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">Institutional Brokerage</div>
          </div>
        </div>

        {/* Right Controls: Balance Pill, Currency Quick Switch, and Primary Settings ≡ Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Balance Pill */}
          <div
            onClick={() => handleNavClick('dashboard')}
            className="cursor-pointer flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">{t.availableBalance || 'Balance'}</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-white">
                {formatCurrency(user.balance || 0, currentCurrency)}
              </div>
            </div>
          </div>

          {/* Currency Switcher */}
          <div className="relative hidden sm:block">
            <button
              id="currency-switch-btn"
              onClick={() => {
                setShowCurrencyMenu(!showCurrencyMenu);
                setShowLanguageMenu(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentCurrency}</span>
            </button>

            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in">
                <div className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider font-semibold">
                  {t.currency || 'Currency'}
                </div>
                {Object.keys(currencyRates).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      onSelectCurrency(code);
                      setShowCurrencyMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      currentCurrency === code
                        ? 'bg-blue-600/30 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{currencyRates[code].name}</span>
                    <span className="font-mono text-slate-400">({currencyRates[code].symbol})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Language Switcher */}
          <div className="relative">
            <button
              id="language-switch-btn"
              onClick={() => {
                setShowLanguageMenu(!showLanguageMenu);
                setShowCurrencyMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{languagesList.find((l) => l.code === currentLanguage)?.flag || '🇺🇸'}</span>
              <span className="hidden sm:inline uppercase text-[11px] font-bold">{currentLanguage}</span>
            </button>

            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in max-h-80 overflow-y-auto">
                <div className="text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider font-semibold">
                  {t.language || 'Language'}
                </div>
                {languagesList.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      currentLanguage === lang.code
                        ? 'bg-cyan-600/30 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                    {currentLanguage === lang.code && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= PRIMARY SETTINGS ≡ BUTTON ================= */}
          <button
            id="settings-menu-toggle-btn"
            title="Open Platform Settings & Navigation (≡)"
            onClick={() => setShowSettingsMenu(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-black/40 hover:border-blue-500/60 transition-all active:scale-95 cursor-pointer"
          >
            <div className="w-4 h-3.5 flex flex-col justify-between py-0.5">
              <span className="w-full h-0.5 bg-white rounded-full" />
              <span className="w-full h-0.5 bg-white rounded-full" />
              <span className="w-full h-0.5 bg-white rounded-full" />
            </div>
            <span>{t.settings}</span>
            {user.kycStatus !== 'verified' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ================= SLIDE-OVER SETTINGS ≡ DRAWER (EXPANDED WIDE FORMAT) ================= */}
      {showSettingsMenu &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex justify-end animate-in fade-in duration-200">
            {/* Backdrop (tap to close) */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => setShowSettingsMenu(false)}
            />

            {/* Drawer Panel - Made Wide with cleanly anchored header & footer */}
            <div className="relative w-full max-w-xl sm:max-w-2xl lg:max-w-3xl bg-[#0b1325] border-l border-[#162238] shadow-2xl h-full flex flex-col z-10">
              
              {/* Drawer Header (Fixed at top, shrink-0) */}
              <div className="p-4 sm:p-5 border-b border-[#162238] flex items-center justify-between bg-[#080d1a] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base sm:text-lg">{user.name}</h3>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-400">
                        {user.accountTier || (user.withdrawalClearance?.accountUpgraded ? 'Institutional VIP Tier 8.3' : 'Tier-1 Pro v8.3')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span>{user.email}</span>
                      <span>•</span>
                      <span className="text-slate-500">ID: {user.id.slice(0, 12)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsMenu(false)}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    title="Close Settings Panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Content Area in Wide Drawer (Scrollable body with min-h-0) */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 min-h-0">
                
                {/* 1. PROMINENT KYC VERIFICATION SECTION */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#101b33] p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        user.kycStatus === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : user.kycStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                            Identity & KYC Verification
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Anti-Money Laundering (AML) & Institutional Clearance
                        </p>
                      </div>
                    </div>

                    <div>
                      {user.kycStatus === 'verified' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fully Verified
                        </span>
                      )}
                      {user.kycStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> Verification In Review
                        </span>
                      )}
                      {(user.kycStatus === 'unverified' || !user.kycStatus) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
                          <AlertCircle className="w-3.5 h-3.5" /> Verification Required
                        </span>
                      )}
                      {user.kycStatus === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
                          <X className="w-3.5 h-3.5" /> Verification Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KYC Action Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-300 space-y-1">
                      <div className="font-semibold text-white">
                        {user.kycStatus === 'verified'
                          ? 'Tier-1 Institutional Clearance Active'
                          : user.kycStatus === 'pending'
                          ? 'ID Documents Submitted to Compliance Desk'
                          : 'Complete Identity Verification to Enable Withdrawals'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {user.kycStatus === 'verified'
                          ? 'Unrestricted crypto dispatches and high-volume order routing unlocked.'
                          : user.kycStatus === 'pending'
                          ? 'Verification in progress. Review takes 15–30 minutes.'
                          : 'Upload passport, national ID, or driver’s license to unlock all features.'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleNavClick('kyc')}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 ${
                        user.kycStatus === 'verified'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{user.kycStatus === 'verified' ? 'View KYC Profile' : 'Start Verification Now'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. QUICK METRICS OVERVIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Portfolio Balance
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                      {formatCurrency(user.balance || 0, currentCurrency)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Settled in {currentCurrency}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Total Profit
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
                      +{formatCurrency(user.totalProfit || 0, currentCurrency)}
                    </div>
                    <div className="text-[10px] text-emerald-500/80 mt-1">Accumulated yield</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Account Tier & Engine
                    </div>
                    <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{user.accountTier || (user.withdrawalClearance?.accountUpgraded ? 'Institutional VIP Tier 8.3' : 'Standard Tier (v8.3)')}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {user.country} • Core Engine v8.3 High-Frequency
                    </div>
                  </div>
                </div>

                {/* 3. SECTION: Platform Currency & Settlement */}
                <div className="space-y-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Platform Currency & Settlement
                        </h4>
                        <p className="text-xs text-slate-400">
                          Choose your preferred display and accounting currency
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                      Active: {currentCurrency}
                    </span>
                  </div>

                  {/* Wide Visual Currency Selector Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {Object.keys(currencyRates).map((code) => {
                      const info = currencyRates[code];
                      const isSelected = currentCurrency === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => onSelectCurrency(code)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                              : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-mono text-xs font-black">{code}</span>
                            <span className="text-xs opacity-75 font-semibold">{info.symbol}</span>
                          </div>
                          <div className="text-[11px] truncate font-medium">{info.name}</div>
                          {isSelected && (
                            <div className="text-[9px] uppercase tracking-wider text-cyan-200 mt-1 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-cyan-200" />
                              <span>Active</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. SECTION: Language Selector Grid */}
                <div className="space-y-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Interface Language
                        </h4>
                        <p className="text-xs text-slate-400">
                          Select localized terminology and display language
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase">
                      {languagesList.find((l) => l.code === currentLanguage)?.label || 'English'}
                    </span>
                  </div>

                  {/* Wide Visual Language Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {languagesList.map((lang) => {
                      const isSelected = currentLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => onSelectLanguage(lang.code)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/25'
                              : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">{lang.flag}</span>
                            <span className="text-xs font-semibold truncate">{lang.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. SECTION: Platform Navigation Shortcuts */}
                <div className="space-y-3 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Brokerage Navigation & Terminals
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      id="drawer-nav-dashboard"
                      onClick={() => handleNavClick('dashboard')}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'dashboard'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                      <span className="flex-1 text-left">Dashboard</span>
                      {activeTab === 'dashboard' && <ChevronRight className="w-4 h-4" />}
                    </button>

                    <button
                      id="drawer-nav-trading"
                      onClick={() => handleNavClick('trading')}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'trading'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="flex-1 text-left">Live Trading</span>
                      {activeTab === 'trading' && <ChevronRight className="w-4 h-4" />}
                    </button>

                    <button
                      id="drawer-nav-portfolio"
                      onClick={() => handleNavClick('portfolio')}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'portfolio'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-cyan-400" />
                      <span className="flex-1 text-left">Portfolio & Assets</span>
                      {activeTab === 'portfolio' && <ChevronRight className="w-4 h-4" />}
                    </button>

                    <button
                      id="drawer-nav-deposit"
                      onClick={() => handleNavClick('deposit')}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'deposit'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      <ArrowDownToLine className="w-4 h-4 text-blue-400" />
                      <span className="flex-1 text-left">Deposit Capital</span>
                    </button>

                    <button
                      id="drawer-nav-withdraw"
                      onClick={() => handleNavClick('withdraw')}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'withdraw'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
                      <span className="flex-1 text-left">Withdraw Funds</span>
                    </button>

                    <button
                      id="drawer-nav-kyc"
                      onClick={() => handleNavClick('kyc')}
                      className={`p-3.5 rounded-2xl flex items-center gap-3 border text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === 'kyc'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="flex-1 text-left">Identity Verification</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Drawer Footer: Logout (Fixed at bottom, shrink-0) */}
              <div className="p-4 sm:p-5 border-t border-[#162238] bg-[#080d1a] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400 text-center sm:text-left">
                  Logged in as <strong className="text-white">{user.name}</strong> • Craken Pro Core v8.3 (High-Frequency Institutional Engine)
                </div>

                <button
                  id="drawer-logout-btn"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    onLogout();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/30 transition-all active:scale-98 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Brokerage</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
