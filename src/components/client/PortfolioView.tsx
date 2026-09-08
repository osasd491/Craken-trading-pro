import React from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShieldCheck,
  Calendar,
  Sparkles,
  PieChart,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';
import { formatCurrency, translations } from '../../services/translations';

interface PortfolioViewProps {
  user: ClientUser;
  currentCurrency: string;
  currentLanguage: string;
  onNavigateDeposit: () => void;
  onNavigateWithdraw: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  user,
  currentCurrency,
  currentLanguage,
  onNavigateDeposit,
  onNavigateWithdraw
}) => {
  const t = translations[currentLanguage] || translations.en;
  const storeState = StoreService.getState();

  // Find profit credits specifically for this user
  const userAuditRecords = storeState.ledger.filter((item) => item.userId === user.id);
  const userWithdrawals = storeState.withdrawals.filter((item) => item.userId === user.id);

  const profitGrowthPercent = user.totalDeposited > 0
    ? ((user.totalProfit / user.totalDeposited) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Financial Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Institutional Asset Overview
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              {formatCurrency(user.balance, currentCurrency)}
            </h1>
            <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span>{t.totalBalance}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Backed by Tier-1 Reserve
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateDeposit}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {t.navDeposit}
            </button>
            <button
              onClick={onNavigateWithdraw}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 shadow-md transition-all flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              {t.navWithdraw}
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          {/* Total Profit */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{t.totalProfit}</span>
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              +{formatCurrency(user.totalProfit, currentCurrency)}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +{profitGrowthPercent}% ROI on Deposits
            </div>
          </div>

          {/* Total Deposited */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Deposits</span>
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-300">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {formatCurrency(user.totalDeposited, currentCurrency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Confirmed Blockchain Principal</div>
          </div>

          {/* Total Withdrawn */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Dispatched Withdrawals</span>
              <span className="p-1 rounded-lg bg-purple-500/20 text-purple-300">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-200 font-mono">
              {formatCurrency(user.totalWithdrawn, currentCurrency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Direct to Client Crypto Wallets</div>
          </div>
        </div>
      </div>

      {/* Grid: Profit Credits Ledger & Recent Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profit Distributions & Audit Ledger (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Profit Distributions & Credits 📈</h3>
                <p className="text-xs text-slate-400">Official broker ledger audit distributions</p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
              +{formatCurrency(user.totalProfit, currentCurrency)} Total
            </div>
          </div>

          {userAuditRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800/40 p-4">
              <p className="font-semibold text-slate-300">No manual profit adjustments recorded yet.</p>
              <p className="mt-1 text-slate-500">
                Institutional trading yields and profit credits distributed by the broker desk will be cataloged here with immutable ledger entries.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userAuditRecords.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between gap-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      +
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.reason}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-blue-400 font-mono">ID: {item.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-emerald-400">
                      +{formatCurrency(item.amount, currentCurrency)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Balance: {formatCurrency(item.newBalance, currentCurrency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Withdrawals (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Withdrawal History</h3>
                <p className="text-xs text-slate-400">Monitored on-chain payouts</p>
              </div>
            </div>
            <button
              onClick={onNavigateWithdraw}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              New <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {userWithdrawals.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/40">
              No withdrawals requested yet.
            </div>
          ) : (
            <div className="space-y-3">
              {userWithdrawals.map((wd) => (
                <div
                  key={wd.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{wd.asset} ({wd.network})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px] mt-0.5">
                      {wd.destinationAddress}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(wd.requestedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-white text-sm">
                      {formatCurrency(wd.amount, currentCurrency)}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          wd.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : wd.status === 'PROCESSING'
                            ? 'bg-blue-500/20 text-blue-300'
                            : wd.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {wd.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
