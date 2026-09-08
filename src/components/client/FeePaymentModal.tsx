import React, { useState } from 'react';
import {
  X,
  Wallet,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';

interface FeePaymentModalProps {
  user: ClientUser;
  stageNumber: number;
  stageTitle: string;
  stageDescription: string;
  requiredFeeUsd: number;
  onClose: () => void;
  onPaymentSubmitted: () => void;
}

const CRYPTO_PAYMENT_OPTIONS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin Native SegWit',
    usdRate: 94850,
    color: 'amber',
    badge: 'Fastest Settlement'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum (ERC20)',
    usdRate: 3420,
    color: 'indigo',
    badge: 'Smart Clearance'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD (TRC20)',
    network: 'TRON (TRC20)',
    usdRate: 1.0,
    color: 'emerald',
    badge: 'Zero Volatility'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana Mainnet',
    usdRate: 188,
    color: 'purple',
    badge: 'Ultra Low Gas'
  }
];

export const FeePaymentModal: React.FC<FeePaymentModalProps> = ({
  user,
  stageNumber,
  stageTitle,
  stageDescription,
  requiredFeeUsd,
  onClose,
  onPaymentSubmitted
}) => {
  const storeState = StoreService.getState();
  const config = storeState.adminConfig;

  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT' | 'SOL'>('BTC');
  const [txid, setTxid] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Find crypto option & admin wallet address
  const cryptoMeta = CRYPTO_PAYMENT_OPTIONS.find((c) => c.symbol === selectedCrypto) || CRYPTO_PAYMENT_OPTIONS[0];
  const walletConfig = config.walletAddresses[selectedCrypto];
  const walletAddress = walletConfig?.address || 'bc1q9h6x8f5g4d3s2a1z0y9x8w7v6u5t4r3e2w1q0p';

  // Calculate required crypto amount
  const cryptoAmount = (requiredFeeUsd / cryptoMeta.usdRate).toFixed(
    selectedCrypto === 'BTC' ? 6 : selectedCrypto === 'ETH' ? 5 : selectedCrypto === 'SOL' ? 4 : 2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txid.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      StoreService.submitClearanceFeePayment(user.id, {
        stage: stageNumber,
        crypto: selectedCrypto,
        txid: txid.trim(),
        amount: parseFloat(cryptoAmount)
      });
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        onPaymentSubmitted();
      }, 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0b1325] border border-[#1d2d4a] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Regulatory Settlement Protocol
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">{stageTitle}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Payment Proof Registered!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your {selectedCrypto} clearance fee payment of{' '}
              <strong className="text-emerald-400 font-mono">
                {cryptoAmount} {selectedCrypto} (${requiredFeeUsd.toLocaleString()} USD)
              </strong>{' '}
              has been submitted to the compliance audit desk.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
              TXID: {txid}
            </div>
            <div className="text-[11px] text-amber-400 flex items-center justify-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Institutional clearance verification in progress...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Fee Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Required Clearance Amount</span>
                <div className="text-2xl font-bold font-mono text-white">
                  ${requiredFeeUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className="text-xs text-slate-400 font-normal ml-1">USD</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-amber-400">Crypto Settlement</span>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {cryptoAmount} {selectedCrypto}
                </div>
              </div>
            </div>

            {/* Cryptocurrency Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Select Wallet Currency to Pay With:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CRYPTO_PAYMENT_OPTIONS.map((c) => {
                  const isSelected = selectedCrypto === c.symbol;
                  return (
                    <button
                      key={c.symbol}
                      type="button"
                      onClick={() => setSelectedCrypto(c.symbol as any)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{c.symbol}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{c.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Official Wallet Destination Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Official Brokerage {selectedCrypto} Receiving Address</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {cryptoMeta.network}
                </span>
              </div>

              {/* Wallet Address Box */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300 break-all flex items-center justify-between gap-2">
                <span>{walletAddress}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Send exactly <strong className="text-white font-mono">{cryptoAmount} {selectedCrypto}</strong> to the address above. Once the transaction is broadcast on the blockchain, submit your TXID below for instant confirmation.
                </span>
              </div>
            </div>

            {/* Payment Proof Submission Form */}
            <form onSubmit={handleSubmitProof} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Blockchain Transaction Hash (TXID) or Sender Address
                </label>
                <input
                  type="text"
                  required
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  placeholder="e.g. 0x4f8a... or bc1q... or 58d9..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !txid.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Verifying with Brokerage Ledger...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Submit {selectedCrypto} Fee Payment Proof</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
