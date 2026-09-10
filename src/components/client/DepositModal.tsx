import React, { useState } from 'react';
import {
  Wallet,
  Copy,
  Check,
  AlertTriangle,
  Send,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';
import { formatCurrency, translations } from '../../services/translations';
import { CryptoIcon } from '../shared/CryptoIcon';

interface DepositModalProps {
  user: ClientUser;
  currentCurrency: string;
  currentLanguage: string;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  user,
  currentCurrency,
  currentLanguage,
  onClose
}) => {
  const t = translations[currentLanguage] || translations.en;
  const storeState = StoreService.getState();
  const wallets = storeState.adminConfig.walletAddresses;

  const [selectedAsset, setSelectedAsset] = useState<'BTC' | 'ETH' | 'USDT' | 'SOL'>('BTC');
  const [copied, setCopied] = useState(false);
  const [txAmount, setTxAmount] = useState<string>('1000');
  const [txHash, setTxHash] = useState<string>('');
  const [proofNote, setProofNote] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeWallet = wallets[selectedAsset];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please specify a valid deposit amount');
      return;
    }
    if (!txHash.trim()) {
      setFormError('Please provide the Blockchain Transaction Hash (TXID)');
      return;
    }

    StoreService.submitDeposit({
      userId: user.id,
      asset: selectedAsset,
      network: activeWallet.network,
      amount: amountNum,
      txHash: txHash.trim(),
      proofNote: proofNote.trim()
    });

    setSubmittedSuccess(true);
    setTxHash('');
    setProofNote('');
    setTimeout(() => {
      setSubmittedSuccess(false);
    }, 6000);
  };

  const userDeposits = storeState.deposits.filter((d) => d.userId === user.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Deposit Header */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.depositTitle}</h2>
              <p className="text-xs text-slate-400">Institutional Custody Deposit Portal</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Tier-1 Multi-Signature Cold Storage
          </div>
        </div>

        {/* Cryptocurrency Selector Pills with Bitcoin & Ethereum logos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(['BTC', 'ETH', 'USDT', 'SOL'] as const).map((asset) => {
            const isSelected = selectedAsset === asset;
            return (
              <button
                key={asset}
                type="button"
                onClick={() => setSelectedAsset(asset)}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <CryptoIcon symbol={asset} size="sm" />
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-sm text-white">{asset}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {wallets[asset]?.network || asset}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Deposit Address Box */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full">
              <div className="text-xs font-semibold text-slate-400 mb-1">
                Official Brokerage {selectedAsset} Deposit Address ({activeWallet.network}):
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-cyan-300 break-all bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <span>{activeWallet.address}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>{t.depositInstructions}</span>
              <span className="font-semibold block mt-0.5">
                Minimum Deposit: {activeWallet.minDeposit} {selectedAsset}. Funds will be credited after 3 blockchain network confirmations.
              </span>
            </div>
          </div>
        </div>

        {/* Form: Submit Blockchain Transaction ID (TXID) */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">{t.submitTxProof}</h3>
          </div>

          {submittedSuccess && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Transaction proof recorded successfully! Your deposit is currently under verification by the custodian.
              </span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Amount Transferred ({selectedAsset})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 2500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Blockchain Transaction Hash (TXID)
                </label>
                <input
                  type="text"
                  required
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 0x4a5e1e4baab89f3a32518..."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Optional Memo / Sender Note
              </label>
              <input
                type="text"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Sent from Binance account"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Confirm & Submit Deposit Proof</span>
            </button>
          </form>
        </div>
      </div>

      {/* Deposit Ledger History */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Deposit History</h3>
        {userDeposits.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No deposits registered for this account yet.
          </div>
        ) : (
          <div className="space-y-2">
            {userDeposits.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <CryptoIcon symbol={d.asset as any} size="sm" />
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{d.amount} {d.asset}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({d.network})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                      TX: {d.txHash}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.status === 'CONFIRMED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : d.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {d.status}
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
