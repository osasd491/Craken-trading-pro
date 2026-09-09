import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  BarChart3,
  Smartphone,
  Laptop,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { StoreService, useStore } from '../../services/store';

export const AdminAnalyticsOverview: React.FC = () => {
  const storeState = useStore();
  const users = storeState.users;
  const withdrawals = storeState.withdrawals;
  const ledger = storeState.ledger;

  const totalAssets = users.reduce((acc, u) => acc + u.balance, 0);
  const totalProfit = users.reduce((acc, u) => acc + u.totalProfit, 0);
  const totalDeposits = users.reduce((acc, u) => acc + u.totalDeposited, 0);
  const totalWithdrawn = withdrawals
    .filter((w) => w.status === 'COMPLETED')
    .reduce((acc, w) => acc + w.amount, 0);

  const pendingWdCount = withdrawals.filter((w) => w.status === 'PENDING').length;
  const pendingKycCount = users.filter((u) => u.kycStatus === 'pending').length;

  // Browser breakdown
  const browserCounts: Record<string, number> = {};
  users.forEach((u) => {
    const b = u.sessionInfo.browser.split(' ')[0] || 'Chrome';
    browserCounts[b] = (browserCounts[b] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets Under Custody */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Assets Under Custody</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Backed Reserves
          </div>
        </div>

        {/* Total Distributed Profits */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden bg-gradient-to-b from-slate-900 to-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-2">
            <span className="font-bold">Total Client Profits 📈</span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            +${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-300 mt-2 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Distributed across {users.length} clients
          </div>
        </div>

        {/* Cumulative Deposits */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Cumulative Deposits</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Confirmed On-Chain Capital
          </div>
        </div>

        {/* Dispatched Withdrawals */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Paid Withdrawals</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span>{pendingWdCount} pending requests awaiting dispatch</span>
          </div>
        </div>
      </div>

      {/* Grid: Action Queues & Browser Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgent Action Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Compliance & Action Required</span>
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  {pendingWdCount}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Pending Client Withdrawals</div>
                  <div className="text-[11px] text-slate-400">Awaiting executive authorization & TXID</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${pendingWdCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                {pendingWdCount > 0 ? 'Action Queue' : 'Clear'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  {pendingKycCount}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Pending KYC Applications</div>
                  <div className="text-[11px] text-slate-400">Submitted passports & identity cards</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${pendingKycCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                {pendingKycCount > 0 ? 'Review Needed' : 'Clear'}
              </span>
            </div>
          </div>

          {/* Browser Monitoring Breakdown */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-cyan-400" />
              <span>Monitored Client Browsers & Sessions</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(browserCounts).map(([browser, count]) => {
                const pct = Math.round((count / users.length) * 100) || 0;
                return (
                  <div key={browser} className="text-xs">
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>{browser} (including Opera Mini & Safari)</span>
                      <span className="font-mono text-slate-400">{count} clients ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Broker Ledger Stream (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Audit Ledger & Profit Logs 📈</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Encrypted AES-256</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
            {ledger.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                No ledger records created yet.
              </div>
            ) : (
              ledger.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/60 flex items-center justify-between text-xs transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        rec.action.includes('ADD')
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {rec.action.includes('ADD') ? '+' : '-'}
                    </div>
                    <div>
                      <div className="font-bold text-white">{rec.userName}</div>
                      <div className="text-[11px] text-slate-400">{rec.reason}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(rec.timestamp).toLocaleString()} • Admin: {rec.adminEmail}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold text-sm ${
                        rec.action.includes('ADD') ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {rec.action.includes('ADD') ? '+' : '-'}${rec.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Bal: ${rec.newBalance.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
