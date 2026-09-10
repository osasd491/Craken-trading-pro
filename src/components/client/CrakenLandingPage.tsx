import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Lock,
  Zap,
  Globe,
  Coins,
  ArrowRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Check,
  BarChart3,
  Users,
  Award,
  HelpCircle,
  Wallet,
  Headphones,
  Layers,
  Landmark,
  Activity,
  FileCheck,
  X,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ClientUser, MarketAsset } from '../../types';
import { ClientAuth } from './ClientAuth';

interface CrakenLandingPageProps {
  onSuccessLogin: (user: ClientUser) => void;
  markets: MarketAsset[];
}

export const CrakenLandingPage: React.FC<CrakenLandingPageProps> = ({
  onSuccessLogin,
  markets
}) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Sort markets with Bitcoin first, then Ethereum second
  const sortedMarkets = [...markets].sort((a, b) => {
    if (a.symbol.startsWith('BTC')) return -1;
    if (b.symbol.startsWith('BTC')) return 1;
    if (a.symbol.startsWith('ETH')) return -1;
    if (b.symbol.startsWith('ETH')) return 1;
    return 0;
  });

  const faqs = [
    {
      q: 'Can I access my Craken Pro account across multiple devices and browsers?',
      a: 'Yes. Craken Pro operates on real-time synchronized cloud ledgers. Whether you register or sign in via Google Chrome, Apple Safari, mobile browsers, or embedded apps like WhatsApp or TikTok, your account balance, trading history, open positions, and verified KYC status are automatically synced and instantly accessible everywhere.'
    },
    {
      q: 'How fast are crypto deposits and bank wire withdrawals processed?',
      a: 'Cryptocurrency deposits (BTC, ETH, USDT, SOL) are credited immediately upon standard network confirmation (typically 1-3 blocks). Wire payouts are executed via Fedwire, SEPA Instant, and international SWIFT channels once your account compliance clearance steps are satisfied.'
    },
    {
      q: 'Which cryptocurrencies can I trade and use to pay fees?',
      a: 'Craken Pro supports all leading tier-1 digital assets including Bitcoin (BTC), Ethereum (ETH), Tether (USDT), Solana (SOL), Ripple (XRP), and Cardano (ADA), along with multi-currency fiat settlements (USD, EUR, GBP, CAD, AUD, JPY).'
    },
    {
      q: 'How does Craken Pro safeguard institutional and retail funds?',
      a: '98%+ of client digital reserves are stored in geographically distributed, air-gapped cold storage vaults guarded by multi-signature threshold cryptography and institutional grade Lloyd’s of London syndicate insurance coverage.'
    },
    {
      q: 'What are the compliance requirements for fund withdrawal?',
      a: 'In accordance with FinCEN, SEC, and international anti-money laundering (AML) standards, accounts progress through sequential verification steps: Tier-1 KYC identity verification, disbursement clearance, tier qualification, settlement delay settlement, and statutory tax reporting certification.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* 1. Global Live Ticker Bar (Bitcoin first, Ethereum second) */}
      <div className="bg-[#0b1325] border-b border-slate-800/80 py-2 px-4 overflow-x-auto no-scrollbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Craken Pro Orderbooks
            </div>
            {sortedMarkets.slice(0, 6).map((m) => (
              <div
                key={m.symbol}
                onClick={() => openAuth('register')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-semibold text-slate-300">{m.symbol}</span>
                <span className="font-mono font-bold text-white">${m.price.toLocaleString()}</span>
                <span
                  className={`text-[10px] font-bold ${
                    m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {m.change24h >= 0 ? '+' : ''}
                  {m.change24h}%
                </span>
              </div>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> SEC & FinCEN Registered MSB
            </span>
            <span>•</span>
            <span>99.999% Execution Uptime</span>
          </div>
        </div>
      </div>

      {/* 2. Top Header Navigation */}
      <header className="border-b border-slate-800/60 bg-[#070d19]/90 backdrop-blur-xl sticky top-8 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Craken
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-blue-600 text-white tracking-wider">
                  PRO v8.3
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Institutional Multi-Asset Brokerage Engine v8.3
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#markets" className="hover:text-blue-400 transition-colors">
              Markets
            </a>
            <a href="#features" className="hover:text-blue-400 transition-colors">
              Trading Technology
            </a>
            <a href="#security" className="hover:text-blue-400 transition-colors">
              Cold Storage Security
            </a>
            <a href="#tiers" className="hover:text-blue-400 transition-colors">
              VIP Tiers
            </a>
            <a href="#faqs" className="hover:text-blue-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth('login')}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth('register')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Account</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-800/60">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Generation Institutional Trading Architecture</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-slate-400">Zero Commission Trading</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Trade with Institutional Precision on{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Craken Pro
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
            Access Tier-1 cryptocurrency liquidity, automated multi-currency bank wire settlements,
            and millisecond execution speeds. Built for high-frequency traders, family offices, and
            active retail investors.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
            <button
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Create Free Account in 60 Seconds</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('markets');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Explore Live Order Books</span>
            </button>
          </div>

          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 pt-10 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">$48.2B+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Quarterly Volume</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">&lt;12ms</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Execution Latency</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">180+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Countries Supported</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Reserve Segregation</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Markets Table Section */}
      <section id="markets" className="py-16 bg-[#091122] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-400 mb-1">
                <Activity className="w-4 h-4" />
                <span>Real-Time Market Rates</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Deep Liquidity for Top Crypto Assets
              </h2>
            </div>
            <button
              onClick={() => openAuth('register')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              <span>View All 50+ Pairs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#0b1325] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-6">Asset / Pair</th>
                    <th className="py-4 px-6 text-right">Live Price (USD)</th>
                    <th className="py-4 px-6 text-right">24h Change</th>
                    <th className="py-4 px-6 text-right hidden sm:table-cell">24h High / Low</th>
                    <th className="py-4 px-6 text-right hidden md:table-cell">24h Volume</th>
                    <th className="py-4 px-6 text-center">Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedMarkets.slice(0, 8).map((asset) => (
                    <tr
                      key={asset.symbol}
                      className="hover:bg-slate-900/40 transition-colors group cursor-pointer"
                      onClick={() => openAuth('register')}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs group-hover:border-blue-500 transition-colors">
                            {asset.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{asset.symbol}</div>
                            <div className="text-[11px] text-slate-400">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white text-sm">
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                            asset.change24h >= 0
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-400 hidden sm:table-cell">
                        ${(asset.high24h || asset.price * 1.04).toLocaleString(undefined, { maximumFractionDigits: 2 })} / $
                        {(asset.low24h || asset.price * 0.96).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-300 hidden md:table-cell">
                        ${((asset.volume24h || asset.price * 1500) / 1000000).toFixed(2)}M
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAuth('register');
                          }}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          Trade Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Institutional Technology & Security Pillars */}
      <section id="features" className="py-20 bg-[#070d19] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-cyan-400 mb-2">
              <Layers className="w-4 h-4" />
              <span>Core Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Engineered for Speed, Reliability, & Security
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Craken Pro delivers the low latency of traditional financial exchanges paired with
              the sovereignty of decentralized digital asset networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800/80 hover:border-blue-500/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Air-Gapped Cold Vault Custody</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                98%+ of client balances reside in multi-signature, air-gapped physical vaults guarded
                by physical biometric access controls and insured against loss.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800/80 hover:border-blue-500/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Currency Global Settlements</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamlessly convert and withdraw profits via USD, EUR, GBP, AUD, CAD, or native crypto
                (BTC, ETH, USDT) with direct bank wire and Fedwire clearance.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800/80 hover:border-blue-500/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sub-12ms Order Execution</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Proprietary matching engine handles 250,000+ orders per second with zero slippage
                and full algorithmic order routing support.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800/80 hover:border-blue-500/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">FinCEN & SEC Compliance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registered Money Services Business adhering to global AML standards, biometric identity
                verification, and audited statutory clearance frameworks.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800/80 hover:border-blue-500/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Custom Fee & Wallet Integrations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pay clearance and upgrade fees using any supported cryptocurrency wallet with real-time
                automated transaction hash proof verification.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800/80 hover:border-blue-500/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">24/7 Dedicated Broker Support</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant access to human broker desks and executive support agents via encrypted live chat
                and email at crakenprotrading@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VIP Account Tiers Comparison */}
      <section id="tiers" className="py-20 bg-[#091122] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-blue-400 mb-2">
              <Award className="w-4 h-4" />
              <span>Tailored For Your Trading Volume</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Craken Pro Account Tiers
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Upgrade your institutional standing to access lower fees, expedited clearance, and
              dedicated private account management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Standard Tier */}
            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Entry Tier</div>
                <h3 className="text-xl font-bold text-white mt-1">Standard Trader</h3>
                <div className="text-2xl font-black text-white font-mono mt-4">$0 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
                <p className="text-xs text-slate-400 mt-2">Essential tools for active retail crypto and forex traders.</p>

                <ul className="space-y-3 mt-6 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Access to 50+ live crypto & FX pairs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard KYC verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-currency balance display</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard withdrawal clearance ($250)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openAuth('register')}
                className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>

            {/* Pro Tier (Popular) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-950/40 via-[#0b1325] to-[#0b1325] border-2 border-blue-500/60 flex flex-col justify-between relative shadow-2xl shadow-blue-500/15">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] uppercase font-extrabold tracking-wider">
                Most Popular
              </div>
              <div>
                <div className="text-xs uppercase font-bold text-cyan-400">High Volume</div>
                <h3 className="text-xl font-bold text-white mt-1">Pro Operator</h3>
                <div className="text-2xl font-black text-cyan-300 font-mono mt-4">$0 Commission <span className="text-xs text-slate-400 font-normal">on majors</span></div>
                <p className="text-xs text-slate-400 mt-2">Enhanced execution speeds and tightest market spreads.</p>

                <ul className="space-y-3 mt-6 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Zero maker fees on BTC & ETH</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Priority liquidity order matching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Real-time profit credit automation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Expedited Fedwire & SEPA routing</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openAuth('register')}
                className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                Open Pro Account
              </button>
            </div>

            {/* Institutional VIP */}
            <div className="p-8 rounded-3xl bg-[#0b1325] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase font-bold text-purple-400">Institutional</div>
                <h3 className="text-xl font-bold text-white mt-1">Institutional VIP</h3>
                <div className="text-2xl font-black text-white font-mono mt-4">Bespoke <span className="text-xs text-slate-400 font-normal">Clearance Desk</span></div>
                <p className="text-xs text-slate-400 mt-2">Dedicated desk for funds, high-net-worth clients, and corporate accounts.</p>

                <ul className="space-y-3 mt-6 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Dedicated Senior Broker Officer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Custom fee & clearance structuring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Direct phone & encrypted chat desk</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Unlimited daily withdrawal limits</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openAuth('register')}
                className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Inquire VIP Status
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      <section id="faqs" className="py-20 bg-[#070d19] border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-cyan-400 mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#0b1325] border border-slate-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-cyan-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-cyan-900/40 border-b border-slate-800/60 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Begin Trading on Craken Pro?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mt-4">
            Join over 120,000 verified institutional and retail traders worldwide. Open your account
            now or sign in from any device.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
            <button
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 transition-all cursor-pointer"
            >
              Open Free Account
            </button>
            <button
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-bold transition-all cursor-pointer"
            >
              Sign In to Terminal
            </button>
          </div>
        </div>
      </section>

      {/* 9. Institutional Footer */}
      <footer className="bg-[#050912] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">Craken</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                  PRO v8.3
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Craken Pro v8.3 Trading Brokerage Inc. • FinCEN Registered MSB
              </p>
            </div>
            <div className="text-right">
              <div className="text-slate-400 font-semibold">Official Broker Support Desk</div>
              <div className="text-cyan-400 font-mono text-xs mt-0.5">crakenprotrading@gmail.com</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed space-y-2">
            <p>
              <strong>Regulatory Risk Disclosure:</strong> Digital assets and contracts for difference (CFDs) carry a
              high level of risk and may not be suitable for all investors. Before deciding to trade on Craken Pro,
              you should carefully consider your investment objectives, level of experience, and risk appetite. The
              possibility exists that you could sustain a loss of some or all of your initial investment.
            </p>
            <p>
              Craken Pro is registered with the Financial Crimes Enforcement Network (FinCEN) as a Money Services
              Business (MSB) and complies with Bank Secrecy Act (BSA) regulations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900 text-[11px] text-slate-600">
            <div>© {new Date().getFullYear()} Craken Pro Inc. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Fee Disclosure</span>
              <span>•</span>
              <span>AML Compliance</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 10. Interactive Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-4 overscroll-contain animate-in fade-in duration-200">
          <div className="min-h-full flex items-start justify-center py-6 sm:py-12">
            <div className="relative w-full max-w-md my-auto">
              <button
                onClick={() => setAuthModalOpen(false)}
                className="absolute right-4 top-4 z-20 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <ClientAuth
                onSuccessLogin={(user) => {
                  setAuthModalOpen(false);
                  onSuccessLogin(user);
                }}
                markets={sortedMarkets}
                initialMode={authMode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
