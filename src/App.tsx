import React, { useState, useEffect } from 'react';
import { ClientUser, MarketAsset } from './types';
import { INITIAL_MARKETS, tickMarketPrices } from './services/marketData';
import { StoreService } from './services/store';
import { NotificationToaster } from './components/shared/NotificationToaster';

// Client Components
import { ClientNavbar } from './components/client/ClientNavbar';
import { ClientAuth } from './components/client/ClientAuth';
import { CrakenLandingPage } from './components/client/CrakenLandingPage';
import { ClientDashboard } from './components/client/ClientDashboard';
import { TradingTerminal } from './components/client/TradingTerminal';
import { PortfolioView } from './components/client/PortfolioView';
import { DepositModal } from './components/client/DepositModal';
import { WithdrawalModal } from './components/client/WithdrawalModal';
import { KycVerificationModal } from './components/client/KycVerificationModal';
import { BoltChatWidget } from './components/client/BoltChatWidget';

// Admin Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ShieldAlert, ArrowLeft, ExternalLink } from 'lucide-react';

export default function App() {
  // Portal Routing: 'client' | 'admin'
  const [portalMode, setPortalMode] = useState<'client' | 'admin'>(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (hash.includes('admin') || search.includes('admin') || search.includes('portal=admin')) {
      return 'admin';
    }
    return 'client';
  });

  // Client State - Default active tab is 'dashboard' as requested by user
  const [currentClient, setCurrentClient] = useState<ClientUser | null>(() => {
    return StoreService.getCurrentUser();
  });
  const [clientActiveTab, setClientActiveTab] = useState<
    'dashboard' | 'trading' | 'portfolio' | 'deposit' | 'withdraw' | 'kyc'
  >('dashboard');
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USD');

  // Admin State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('craken_admin_session') === 'true';
  });
  const [simulatedAdminUser, setSimulatedAdminUser] = useState<ClientUser | null>(null);

  // Live Market State
  const [markets, setMarkets] = useState<MarketAsset[]>(INITIAL_MARKETS);

  // Sync with Store
  useEffect(() => {
    const unsubscribe = StoreService.subscribe((state) => {
      if (currentClient) {
        const updated = state.users.find((u) => u.id === currentClient.id);
        if (updated) {
          setCurrentClient(updated);
          if (updated.currency && updated.currency !== currentCurrency) {
            setCurrentCurrency(updated.currency);
          }
          if (updated.language && updated.language !== currentLanguage) {
            setCurrentLanguage(updated.language);
          }
        }
      }
    });

    return unsubscribe;
  }, [currentClient?.id, currentCurrency, currentLanguage]);

  // Listen to window hash changes for separate portal routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) {
        setPortalMode('admin');
      } else {
        setPortalMode('client');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when portal mode changes
  const switchPortal = (mode: 'client' | 'admin') => {
    setPortalMode(mode);
    window.location.hash = mode === 'admin' ? '#admin' : '#client';
  };

  // Live Market Ticks (Fluctuations in Red & Green)
  useEffect(() => {
    const marketInterval = setInterval(() => {
      setMarkets((prev) => tickMarketPrices(prev));
    }, 2500);

    return () => clearInterval(marketInterval);
  }, []);

  // Handlers for Client
  const handleClientLoginSuccess = (user: ClientUser) => {
    setCurrentClient(user);
    setClientActiveTab('dashboard'); // Always direct to dashboard upon login or register
    if (user.currency) setCurrentCurrency(user.currency);
    if (user.language) setCurrentLanguage(user.language);
  };

  const handleClientLogout = () => {
    StoreService.logoutClient();
    setCurrentClient(null);
    setSimulatedAdminUser(null);
  };

  const handleSelectCurrency = (curr: string) => {
    setCurrentCurrency(curr);
    if (currentClient) {
      StoreService.updateClientCurrency(currentClient.id, curr);
    }
  };

  const handleSelectLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    if (currentClient) {
      StoreService.updateClientLanguage(currentClient.id, lang);
    }
  };

  // Handlers for Admin
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    localStorage.setItem('craken_admin_session', 'true');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('craken_admin_session');
    setSimulatedAdminUser(null);
  };

  // Admin "Access Client Platform" simulation
  const handleAccessClientPlatform = (targetUser: ClientUser) => {
    setSimulatedAdminUser(targetUser);
    setCurrentClient(targetUser);
    setClientActiveTab('dashboard');
    setPortalMode('client');
  };

  const handleExitSimulation = () => {
    setSimulatedAdminUser(null);
    setPortalMode('admin');
  };

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Real-time Global Push Notifications */}
      <NotificationToaster currentUserId={currentClient?.id} />

      {/* Admin Impersonation Simulation Banner */}
      {simulatedAdminUser && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950" />
            <span>
              Executive Inspection Mode: Viewing platform as client <strong className="underline">{simulatedAdminUser.name}</strong> ({simulatedAdminUser.email})
            </span>
          </div>
          <button
            onClick={handleExitSimulation}
            className="px-3 py-1 bg-slate-950 text-amber-400 rounded-lg font-bold text-xs hover:bg-slate-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Admin Desk</span>
          </button>
        </div>
      )}

      {/* When in Admin mode, show an administrative header with link to client view */}
      {portalMode === 'admin' && !simulatedAdminUser && (
        <div className="bg-[#0b1325] border-b border-[#162238] px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-white font-bold">craken Pro Brokerage</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-medium">Executive Admin Portal</span>
          </div>

          <button
            onClick={() => switchPortal('client')}
            className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 border border-slate-800 hover:border-blue-500/40 text-[10px] font-bold flex items-center gap-1 transition-all"
            title="Switch to Client Trading Platform"
          >
            <ExternalLink className="w-3 h-3 text-blue-400" />
            <span>Open Public Client Platform (#client)</span>
          </button>
        </div>
      )}

      {/* PORTAL ROUTER */}
      {portalMode === 'admin' ? (
        /* ================= ADMIN PORTAL ================= */
        !isAdminAuthenticated ? (
          <AdminLogin onSuccess={handleAdminLoginSuccess} />
        ) : (
          <AdminDashboard
            onLogout={handleAdminLogout}
            onAccessClientPlatform={handleAccessClientPlatform}
          />
        )
      ) : (
        /* ================= CLIENT PLATFORM (ZERO ADMIN LINKS) ================= */
        !currentClient ? (
          <CrakenLandingPage
            onSuccessLogin={handleClientLoginSuccess}
            markets={markets}
          />
        ) : (
          <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden bg-[#070d19]">
            {/* Client Top Navigation */}
            <ClientNavbar
              user={currentClient}
              activeTab={clientActiveTab}
              setActiveTab={setClientActiveTab}
              onLogout={handleClientLogout}
              currentCurrency={currentCurrency}
              onSelectCurrency={handleSelectCurrency}
              currentLanguage={currentLanguage}
              onSelectLanguage={handleSelectLanguage}
              markets={markets}
              unreadNotificationsCount={0}
            />

            {/* Client View Router */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
              {/* DASHBOARD VIEW (MATCHING USER'S SCREENSHOT & COLOURS) */}
              {clientActiveTab === 'dashboard' && (
                <ClientDashboard
                  user={currentClient}
                  markets={markets}
                  currentCurrency={currentCurrency}
                  currentLanguage={currentLanguage}
                  onNavigate={(tab) => setClientActiveTab(tab)}
                  onOpenSupport={() => {
                    const chatBtn = document.getElementById('bolt-chat-toggle-btn');
                    if (chatBtn) chatBtn.click();
                  }}
                />
              )}

              {/* LIVE TRADING TERMINAL */}
              {clientActiveTab === 'trading' && (
                <TradingTerminal
                  user={currentClient}
                  markets={markets}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={setSelectedSymbol}
                  currentCurrency={currentCurrency}
                  currentLanguage={currentLanguage}
                />
              )}

              {/* PORTFOLIO & PROFIT MONITOR VIEW */}
              {clientActiveTab === 'portfolio' && (
                <PortfolioView
                  user={currentClient}
                  currentCurrency={currentCurrency}
                  currentLanguage={currentLanguage}
                  onNavigateDeposit={() => setClientActiveTab('deposit')}
                  onNavigateWithdraw={() => setClientActiveTab('withdraw')}
                />
              )}

              {/* DEPOSIT MODAL / VIEW */}
              {clientActiveTab === 'deposit' && (
                <DepositModal
                  user={currentClient}
                  currentCurrency={currentCurrency}
                  currentLanguage={currentLanguage}
                  onClose={() => setClientActiveTab('dashboard')}
                />
              )}

              {/* WITHDRAWAL MODAL / VIEW (BANK, PAYPAL & CRYPTO) */}
              {clientActiveTab === 'withdraw' && (
                <WithdrawalModal
                  user={currentClient}
                  currentCurrency={currentCurrency}
                  currentLanguage={currentLanguage}
                  onNavigate={(tab) => setClientActiveTab(tab)}
                />
              )}

              {/* KYC COMPLIANCE MODAL */}
              {clientActiveTab === 'kyc' && (
                <KycVerificationModal
                  user={currentClient}
                  currentLanguage={currentLanguage}
                />
              )}
            </main>

            {/* Bolt 24/7 Broker Support Widget */}
            <BoltChatWidget
              user={currentClient}
              currentLanguage={currentLanguage}
            />

            {/* Client Footer (STRICTLY NO ADMIN LINKS) */}
            <footer className="border-t border-[#142038] bg-[#070d19] py-6 text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-400">craken Pro Trading Brokerage Inc.</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Official Support: <span className="text-cyan-400 font-mono">crakenprotrading@gmail.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>Terms of Service</span>
                  <span>•</span>
                  <span>Privacy Policy</span>
                  <span>•</span>
                  <span>Risk Disclosure</span>
                  <span>•</span>
                  <span>AML Compliance</span>
                </div>
              </div>
            </footer>
          </div>
        )
      )}
    </div>
  );
}
