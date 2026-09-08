import React, { useState } from 'react';
import {
  Users,
  Search,
  TrendingUp,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Ban,
  Wallet,
  Gift,
  UserPlus
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';

interface AdminUserManagementProps {
  onAccessClientPlatform: (user: ClientUser) => void;
}

const CURRENCY_RATES_TO_USD: Record<string, { rate: number; symbol: string; label: string }> = {
  USD: { rate: 1, symbol: '$', label: 'USD - US Dollar' },
  EUR: { rate: 1.085, symbol: '€', label: 'EUR - Euro' },
  GBP: { rate: 1.285, symbol: '£', label: 'GBP - British Pound' },
  BTC: { rate: 94850, symbol: '₿', label: 'BTC - Bitcoin' },
  ETH: { rate: 3420, symbol: 'Ξ', label: 'ETH - Ethereum' },
  USDT: { rate: 1.0, symbol: '₮', label: 'USDT - Tether USD' },
  SOL: { rate: 188, symbol: '◎', label: 'SOL - Solana' },
  CAD: { rate: 0.74, symbol: 'C$', label: 'CAD - Canadian Dollar' },
  AUD: { rate: 0.655, symbol: 'A$', label: 'AUD - Australian Dollar' },
  JPY: { rate: 0.0065, symbol: '¥', label: 'JPY - Japanese Yen' }
};

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  onAccessClientPlatform
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'UNVERIFIED'>('ALL');

  // Profit / Balance / Deposit / Bonus adjustment modal state
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<ClientUser | null>(null);
  const [adjustAction, setAdjustAction] = useState<
    'ADD_PROFIT' | 'DEDUCT_PROFIT' | 'ADD_DEPOSIT' | 'BONUS_CREDIT' | 'ADD_BALANCE' | 'DEDUCT_BALANCE'
  >('ADD_PROFIT');
  const [adjustCurrency, setAdjustCurrency] = useState<string>('USD');
  const [adjustAmount, setAdjustAmount] = useState<string>('500');
  const [adjustReason, setAdjustReason] = useState<string>('Institutional Bitcoin arbitrage profit yield');
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);
  const [adjustErrorMsg, setAdjustErrorMsg] = useState<string | null>(null);

  // New Client Registration by Admin modal state
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('United States');
  const [newClientDeposit, setNewClientDeposit] = useState('0');
  const [newClientProfit, setNewClientProfit] = useState('0');
  const [newClientBonus, setNewClientBonus] = useState('0');
  const [addClientMsg, setAddClientMsg] = useState<string | null>(null);

  const storeState = StoreService.getState();
  const users = storeState.users;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'VERIFIED') return matchSearch && u.kycStatus === 'verified';
    if (filterStatus === 'PENDING') return matchSearch && u.kycStatus === 'pending';
    if (filterStatus === 'UNVERIFIED') return matchSearch && u.kycStatus === 'unverified';
    return matchSearch;
  });

  const handleOpenAdjustModal = (
    user: ClientUser,
    defaultAction: 'ADD_PROFIT' | 'ADD_DEPOSIT' | 'BONUS_CREDIT' | 'DEDUCT_PROFIT' = 'ADD_PROFIT'
  ) => {
    setSelectedUserForAdjust(user);
    setAdjustAction(defaultAction);
    setAdjustAmount('500');
    if (defaultAction === 'ADD_PROFIT') {
      setAdjustReason('VIP Institutional trading yield payout');
    } else if (defaultAction === 'ADD_DEPOSIT') {
      setAdjustReason('Institutional capital wire deposit confirmation');
    } else if (defaultAction === 'BONUS_CREDIT') {
      setAdjustReason('Welcome trading promotion incentive bonus');
    } else {
      setAdjustReason('Profit adjustment / risk margin settlement');
    }
    setAdjustSuccessMsg(null);
    setAdjustErrorMsg(null);
  };

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAdjust) return;
    setAdjustErrorMsg(null);

    const rawNum = parseFloat(adjustAmount);
    if (isNaN(rawNum) || rawNum <= 0) {
      setAdjustErrorMsg('Please enter a valid positive amount');
      return;
    }

    const currMeta = CURRENCY_RATES_TO_USD[adjustCurrency] || { rate: 1, symbol: '$', label: 'USD' };
    const numUsdAmount = Math.round(rawNum * currMeta.rate * 100) / 100;
    const finalReason = adjustCurrency !== 'USD'
      ? `[${rawNum} ${adjustCurrency} ≈ $${numUsdAmount.toLocaleString()} USD] ${adjustReason.trim()}`
      : adjustReason.trim();

    const success = StoreService.adjustClientFinancials({
      userId: selectedUserForAdjust.id,
      action: adjustAction,
      amount: numUsdAmount,
      reason: finalReason,
      adminEmail: storeState.adminConfig.adminEmail
    });

    if (success) {
      const displayAmt = adjustCurrency !== 'USD'
        ? `${rawNum} ${adjustCurrency} ($${numUsdAmount.toLocaleString()} USD)`
        : `$${numUsdAmount.toLocaleString()}`;
      setAdjustSuccessMsg(
        `Successfully applied ${adjustAction.replace('_', ' ')} of ${displayAmt} to ${selectedUserForAdjust.name}!`
      );
      // Refresh current user in modal view
      const updatedUser = StoreService.getState().users.find((u) => u.id === selectedUserForAdjust.id);
      if (updatedUser) setSelectedUserForAdjust(updatedUser);

      setTimeout(() => {
        setAdjustSuccessMsg(null);
      }, 3500);
    }
  };

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientEmail || !newClientPassword || !newClientName) return;

    const res = StoreService.registerUser({
      name: newClientName.trim(),
      email: newClientEmail.trim().toLowerCase(),
      password: newClientPassword,
      phone: newClientPhone.trim() || '+1 (555) 019-2834',
      country: newClientCountry
    });

    if (res.success && res.user) {
      const dep = parseFloat(newClientDeposit) || 0;
      const prof = parseFloat(newClientProfit) || 0;
      const bon = parseFloat(newClientBonus) || 0;

      if (dep > 0) {
        StoreService.adjustClientFinancials({
          userId: res.user.id,
          action: 'ADD_DEPOSIT',
          amount: dep,
          reason: 'Initial capital deposit upon registration',
          adminEmail: storeState.adminConfig.adminEmail
        });
      }
      if (prof > 0) {
        StoreService.adjustClientFinancials({
          userId: res.user.id,
          action: 'ADD_PROFIT',
          amount: prof,
          reason: 'Initial trading profit credit',
          adminEmail: storeState.adminConfig.adminEmail
        });
      }
      if (bon > 0) {
        StoreService.adjustClientFinancials({
          userId: res.user.id,
          action: 'BONUS_CREDIT',
          amount: bon,
          reason: 'Initial welcome bonus grant',
          adminEmail: storeState.adminConfig.adminEmail
        });
      }

      setAddClientMsg(`Trader ${newClientName} onboarded successfully!`);
      setTimeout(() => {
        setShowAddClientModal(false);
        setAddClientMsg(null);
        setNewClientName('');
        setNewClientEmail('');
        setNewClientPassword('');
      }, 1500);
    } else {
      setAddClientMsg(res.error || 'Failed to register client');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Institutional Client Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor client capital, profit, deposits, bonuses, and access their trading platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddClientModal(true)}
            id="admin-add-client-btn"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Client</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, email, or account ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Clients ({users.length})</option>
            <option value="VERIFIED">KYC Verified</option>
            <option value="PENDING">KYC Pending Review</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Client Identity</th>
                <th className="py-3.5 px-4">Capital (Deposit)</th>
                <th className="py-3.5 px-4">Accumulating Balance</th>
                <th className="py-3.5 px-4 text-emerald-400">Total Profit 📈</th>
                <th className="py-3.5 px-4 text-amber-400">Bonus 🎁</th>
                <th className="py-3.5 px-4">KYC Status</th>
                <th className="py-3.5 px-4 text-center">Financial Adjustments</th>
                <th className="py-3.5 px-4 text-right">Direct Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No client accounts registered yet. Use the "Register New Client" button above or share your platform registration link.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((client) => {
                  return (
                    <tr key={client.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{client.name}</div>
                        <div className="text-[11px] text-slate-400">{client.email}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {client.country} • {client.phone}
                        </div>
                      </td>

                      {/* Capital / Deposited */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white">
                          ${(client.totalDeposited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">Initial Capital</div>
                      </td>

                      {/* Accumulating Balance */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-sm text-cyan-300">
                          ${(client.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Available</div>
                      </td>

                      {/* Profit */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-sm text-emerald-400 flex items-center gap-1">
                          <span>+${(client.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-[10px] text-emerald-300/80 font-mono">
                          {client.totalDeposited > 0
                            ? `+${(((client.totalProfit || 0) / client.totalDeposited) * 100).toFixed(1)}% ROI`
                            : '+0% ROI'}
                        </div>
                      </td>

                      {/* Bonus */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-amber-300">
                          ${(client.bonus || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-amber-400/80">Trading Credit</div>
                      </td>

                      {/* KYC Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            client.kycStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : client.kycStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {client.kycStatus === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                          {client.kycStatus === 'pending' && <Clock className="w-3 h-3" />}
                          <span className="uppercase">{client.kycStatus}</span>
                        </span>
                      </td>

                      {/* Financial Adjustment Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Add Deposit */}
                          <button
                            onClick={() => handleOpenAdjustModal(client, 'ADD_DEPOSIT')}
                            className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Add Deposit to Client"
                          >
                            <Wallet className="w-3 h-3" />
                            <span>+ Deposit</span>
                          </button>

                          {/* Add Profit */}
                          <button
                            onClick={() => handleOpenAdjustModal(client, 'ADD_PROFIT')}
                            className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Add Profit to Client"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>+ Profit 📈</span>
                          </button>

                          {/* Add Bonus */}
                          <button
                            onClick={() => handleOpenAdjustModal(client, 'BONUS_CREDIT')}
                            className="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Add Bonus to Client"
                          >
                            <Gift className="w-3 h-3" />
                            <span>+ Bonus</span>
                          </button>

                          {/* Deduct */}
                          <button
                            onClick={() => handleOpenAdjustModal(client, 'DEDUCT_PROFIT')}
                            className="px-1.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                            title="Deduct Profit or Balance"
                          >
                            <MinusCircle className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Direct Client Platform Access */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onAccessClientPlatform(client)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-1.5"
                          title="Open Trading Platform as this Client"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Access</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Financial Adjustment Modal */}
      {selectedUserForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>Adjust Client Finances</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Target: <strong className="text-white">{selectedUserForAdjust.name}</strong> ({selectedUserForAdjust.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAdjust(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Financial State Snapshot */}
            <div className="grid grid-cols-3 gap-2.5 mb-6 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-[10px] uppercase text-blue-400 font-semibold">Capital</div>
                <div className="text-base font-mono font-bold text-white">
                  ${(selectedUserForAdjust.totalDeposited || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Balance</div>
                <div className="text-base font-mono font-bold text-cyan-300">
                  ${(selectedUserForAdjust.balance || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-emerald-400 font-semibold">Profit 📈</div>
                <div className="text-base font-mono font-bold text-emerald-400">
                  +${(selectedUserForAdjust.totalProfit || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {adjustSuccessMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adjustSuccessMsg}</span>
              </div>
            )}

            {adjustErrorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adjustErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAdjustment} className="space-y-4">
              {/* Action Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustAction('ADD_DEPOSIT');
                      setAdjustReason('Institutional capital wire deposit confirmation');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                      adjustAction === 'ADD_DEPOSIT'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-blue-200" />
                    <span>Add Deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustAction('ADD_PROFIT');
                      setAdjustReason('VIP Institutional trading yield payout');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                      adjustAction === 'ADD_PROFIT'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-200" />
                    <span>Add Profit 📈</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustAction('BONUS_CREDIT');
                      setAdjustReason('Welcome trading promotion incentive bonus');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                      adjustAction === 'BONUS_CREDIT'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gift className="w-4 h-4 text-amber-200" />
                    <span>Add Bonus</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustAction('DEDUCT_PROFIT');
                      setAdjustReason('Profit adjustment / risk margin settlement');
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                      adjustAction === 'DEDUCT_PROFIT'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-rose-300" />
                    <span>Deduct Profit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustAction('DEDUCT_BALANCE');
                      setAdjustReason('Manual balance adjustment');
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                      adjustAction === 'DEDUCT_BALANCE'
                        ? 'bg-slate-800 text-white border-slate-600 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Deduct Balance</span>
                  </button>
                </div>
              </div>

              {/* Currency & Amount Inputs */}
              <div>
                <div className="flex gap-2">
                  <div className="w-40">
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Currency</label>
                    <select
                      value={adjustCurrency}
                      onChange={(e) => setAdjustCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {Object.entries(CURRENCY_RATES_TO_USD).map(([code, item]) => (
                        <option key={code} value={code}>
                          {code} ({item.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                      Amount in {adjustCurrency}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-mono text-slate-400 text-sm">
                        {CURRENCY_RATES_TO_USD[adjustCurrency]?.symbol || '$'}
                      </span>
                      <input
                        type="number"
                        min="0.000001"
                        step="any"
                        required
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {adjustCurrency !== 'USD' && (
                  <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between font-mono">
                    <span>
                      Live Value: ≈ $
                      {(
                        (parseFloat(adjustAmount) || 0) * (CURRENCY_RATES_TO_USD[adjustCurrency]?.rate || 1)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      USD
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rate: 1 {adjustCurrency} = ${(CURRENCY_RATES_TO_USD[adjustCurrency]?.rate || 1).toLocaleString()} USD
                    </span>
                  </div>
                )}

                {/* Quick presets */}
                <div className="flex gap-2 mt-2">
                  {[100, 250, 500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustAmount(preset.toString())}
                      className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      +{preset} {adjustCurrency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Audit Note */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Ledger Description & Client Push Reason
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. VIP Institutional arbitrage yield payout"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForAdjust(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Register New Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  <span>Register & Onboard New Client</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Set up a client platform account with starting capital and profits
                </p>
              </div>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addClientMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{addClientMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Johnathan Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Account Password *</label>
                  <input
                    type="password"
                    required
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                    placeholder="Create login password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Country</label>
                  <input
                    type="text"
                    value={newClientCountry}
                    onChange={(e) => setNewClientCountry(e.target.value)}
                    placeholder="e.g. United States / Germany"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Initial Balances */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Initial Starting Figures (Optional)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-blue-400 block mb-1">Capital ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={newClientDeposit}
                      onChange={(e) => setNewClientDeposit(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-emerald-400 block mb-1">Profit 📈 ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={newClientProfit}
                      onChange={(e) => setNewClientProfit(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-400 block mb-1">Bonus ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={newClientBonus}
                      onChange={(e) => setNewClientBonus(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Client Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
