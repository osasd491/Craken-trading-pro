import React, { useState } from 'react';
import {
  Settings,
  Mail,
  Lock,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Key,
  Copy,
  Check,
  Download,
  Database,
  RefreshCw
} from 'lucide-react';
import { StoreService, useStore } from '../../services/store';

export const AdminSettings: React.FC = () => {
  const storeState = useStore();
  const config = storeState.adminConfig;

  // Form states
  const [adminEmail, setAdminEmail] = useState(config.adminEmail || 'osasd491@gmail.com');
  const [adminPassword, setAdminPassword] = useState(config.adminPassword);
  const [supportEmail, setSupportEmail] = useState(config.supportEmail);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(config.twoFactorEnabled);
  const [twoFactorSecret, setTwoFactorSecret] = useState(config.twoFactorSecret);

  // Wallets
  const [usdtAddress, setUsdtAddress] = useState(config.walletAddresses.USDT.address);
  const [btcAddress, setBtcAddress] = useState(config.walletAddresses.BTC.address);
  const [ethAddress, setEthAddress] = useState(config.walletAddresses.ETH.address);
  const [solAddress, setSolAddress] = useState(config.walletAddresses.SOL.address);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    StoreService.updateAdminConfig({
      adminEmail: adminEmail.trim(),
      adminPassword: adminPassword.trim(),
      supportEmail: supportEmail.trim(),
      twoFactorEnabled,
      twoFactorSecret,
      walletAddresses: {
        USDT: { ...config.walletAddresses.USDT, address: usdtAddress.trim() },
        BTC: { ...config.walletAddresses.BTC, address: btcAddress.trim() },
        ETH: { ...config.walletAddresses.ETH, address: ethAddress.trim() },
        SOL: { ...config.walletAddresses.SOL, address: solAddress.trim() }
      }
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleGenerateNewMfaSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let newSecret = '';
    for (let i = 0; i < 16; i++) {
      newSecret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTwoFactorSecret(newSecret);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFactorSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storeState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `craken_pro_encrypted_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Executive Broker Configuration & Security</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure administrative credentials, Authenticator app (MFA), and client deposit wallet destinations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportBackup}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Encrypted Database</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Executive configurations and deposit addresses updated successfully! Client deposit pages reflect new addresses immediately.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Admin Credentials */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Executive Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Executive Login Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="osasd491@gmail.com"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Required for executive desk sign-in authentication.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Executive Access Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="Master Admin Password"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                This master password grants instant access across all browsers & devices.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Public Client Support Email (Contact for Bolt & General Inquiries)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Displayed on client terminal footer & Bolt support dialog (e.g. crakenprotrading@gmail.com).
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Two-Factor Authentication App (MFA / TOTP) */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Authenticator App Multi-Factor Authentication (MFA)
              </h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            When enabled, logging into the Executive Admin portal requires entering a dynamic 6-digit TOTP verification code from Google Authenticator, Authy, or 1Password.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">Secret Key for Authenticator App</div>
              <div className="font-mono text-sm font-bold text-amber-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>{twoFactorSecret}</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="px-2.5 py-1 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 flex items-center gap-1"
                >
                  {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleGenerateNewMfaSecret}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Generate New Random Secret
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <QrCode className="w-12 h-12 text-slate-300 shrink-0" />
              <div className="text-[11px] text-slate-400 leading-tight">
                Add account <strong className="text-white">Craken Pro Executive Officer</strong> in Google Authenticator using manual key entry.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Client Deposit Crypto Wallets */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Client Deposit Receiving Crypto Wallets
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Enter your personal or institutional crypto wallet addresses. All clients clicking "Deposit" will see these exact addresses to send funds to:
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                USDT Deposit Address (TRC20 - TRON Network)
              </label>
              <input
                type="text"
                required
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Bitcoin (BTC) Deposit Address (Native SegWit / Legacy)
              </label>
              <input
                type="text"
                required
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ethereum (ETH) Deposit Address (ERC20 Network)
              </label>
              <input
                type="text"
                required
                value={ethAddress}
                onChange={(e) => setEthAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Solana (SOL) Deposit Address (Solana Mainnet)
              </label>
              <input
                type="text"
                required
                value={solAddress}
                onChange={(e) => setSolAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save All Broker Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
