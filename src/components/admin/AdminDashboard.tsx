import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Settings,
  LogOut,
  Clock,
  Laptop,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService, useStore } from '../../services/store';
import { AdminAnalyticsOverview } from './AdminAnalyticsOverview';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminWithdrawals } from './AdminWithdrawals';
import { AdminKycPortal } from './AdminKycPortal';
import { AdminBoltChat } from './AdminBoltChat';
import { AdminSettings } from './AdminSettings';

interface AdminDashboardProps {
  onLogout: () => void;
  onAccessClientPlatform: (user: ClientUser) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onAccessClientPlatform
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'withdrawals' | 'kyc' | 'bolt' | 'settings'>('analytics');
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  const storeState = useStore();
  const config = storeState.adminConfig;
  const pendingWdCount = storeState.withdrawals.filter((w) => w.status === 'PENDING').length;
  const pendingKycCount = storeState.users.filter((u) => u.kycStatus === 'pending').length;
  const unreadBoltCount = storeState.chats.filter((c) => c.sender === 'client' && !c.read).length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Executive Master Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">Craken</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 tracking-wider">
                  ADMIN DESK v8.3
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Executive Officer</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">2FA Authenticated</span>
              </div>
            </div>
          </div>

          {/* Center Clock & Node Status */}
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Node: Live (US-East-1)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Quick Actions & Logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Lock and End Executive Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-850 py-2">
          {[
            { id: 'analytics', label: 'Overview & Analytics', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'users', label: 'Clients & Profit Controller 📈', icon: <Users className="w-4 h-4" /> },
            {
              id: 'withdrawals',
              label: 'Withdrawal Approvals',
              icon: <ArrowUpRight className="w-4 h-4" />,
              badge: pendingWdCount
            },
            {
              id: 'kyc',
              label: 'KYC / AML Compliance',
              icon: <ShieldCheck className="w-4 h-4" />,
              badge: pendingKycCount
            },
            {
              id: 'bolt',
              label: 'Bolt Support Live Desk',
              icon: <Zap className="w-4 h-4 text-amber-400" />,
              badge: unreadBoltCount
            },
            { id: 'settings', label: 'Broker Settings & Wallets', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' && <AdminAnalyticsOverview />}
        {activeTab === 'users' && <AdminUserManagement onAccessClientPlatform={onAccessClientPlatform} />}
        {activeTab === 'withdrawals' && <AdminWithdrawals />}
        {activeTab === 'kyc' && <AdminKycPortal />}
        {activeTab === 'bolt' && <AdminBoltChat />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>craken Pro Official Broker Engine — Admin Core 4.2</div>
          <div className="font-mono text-[11px] text-slate-500">
            Encrypted AES-256 Storage • Zero-Knowledge Hash Verification
          </div>
        </div>
      </footer>
    </div>
  );
};
