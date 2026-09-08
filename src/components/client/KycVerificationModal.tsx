import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  Camera,
  Lock,
  UserCheck,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';
import { translations } from '../../services/translations';

interface KycVerificationModalProps {
  user: ClientUser;
  currentLanguage: string;
}

export const KycVerificationModal: React.FC<KycVerificationModalProps> = ({
  user,
  currentLanguage
}) => {
  const t = translations[currentLanguage] || translations.en;

  const [docType, setDocType] = useState<'passport' | 'national_id' | 'drivers_license'>('passport');
  const [docNumber, setDocNumber] = useState<string>('');
  const [country, setCountry] = useState<string>(user.country || 'United States');
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const [selfieImage, setSelfieImage] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Sample quick-fill demo image buttons so users can easily test
  const fillSampleDocument = () => {
    setDocNumber(`ID-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setFrontImage('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80');
    setBackImage('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80');
    setSelfieImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80');
    setKycError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKycError(null);
    if (!docNumber.trim()) {
      setKycError('Please enter your legal document number');
      return;
    }

    const defaultSampleImg = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80';
    const defaultSelfie = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80';

    StoreService.submitKyc(user.id, {
      documentType: docType,
      documentNumber: docNumber.trim(),
      country: country.trim(),
      frontImage: frontImage || defaultSampleImg,
      backImage: docType !== 'passport' ? (backImage || defaultSampleImg) : undefined,
      selfieImage: selfieImage || defaultSelfie
    });

    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 6000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Status Card */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.kycTitle}</h2>
              <p className="text-xs text-slate-400">Institutional Anti-Money Laundering (AML) Compliance</p>
            </div>
          </div>

          <div>
            {user.kycStatus === 'verified' && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4" /> {t.kycVerified}
              </span>
            )}
            {user.kycStatus === 'pending' && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                <Clock className="w-4 h-4 animate-spin" /> {t.kycPending}
              </span>
            )}
            {user.kycStatus === 'unverified' && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
                <AlertTriangle className="w-4 h-4" /> {t.kycUnverified}
              </span>
            )}
            {user.kycStatus === 'rejected' && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
                <XCircle className="w-4 h-4" /> Action Required (Rejected)
              </span>
            )}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-emerald-400 font-bold text-sm mb-1">Unlimited Withdrawals</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlock daily crypto dispatches above $500,000 without administrative freeze.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-blue-400 font-bold text-sm mb-1">100x Institutional Margin</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gain access to high-tier leverage on Bitcoin, Ethereum, and Solana perpetuals.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-purple-400 font-bold text-sm mb-1">Dedicated Account Desk</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              24/7 direct VIP broker communication via encrypted Bolt messenger.
            </p>
          </div>
        </div>

        {/* If already verified, show success banner */}
        {user.kycStatus === 'verified' ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
            <div className="flex items-center gap-2 font-bold text-base">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Identity Verified by Compliance Officer</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Your trading account has completed biometric and document verification under FinCEN & SEC AML regulations.
              You have full institutional privileges.
            </p>
            {user.kycData && (
              <div className="p-3 bg-slate-950/60 rounded-xl font-mono text-xs text-slate-400 space-y-1">
                <div>Document Type: <span className="text-white uppercase">{user.kycData.documentType}</span></div>
                <div>Document Number: <span className="text-white">{user.kycData.documentNumber}</span></div>
                <div>Compliance Officer Notes: <span className="text-emerald-400">{user.kycData.reviewNotes || 'Approved'}</span></div>
              </div>
            )}
          </div>
        ) : user.kycStatus === 'pending' ? (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3">
            <div className="flex items-center gap-2 font-bold text-base">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Verification Documents Under Executive Review</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Your uploaded credentials are in the administrative verification queue. The broker desk typically confirms identity submissions within 15 minutes to 1 hour.
            </p>
            {user.kycData && (
              <div className="p-3 bg-slate-950/60 rounded-xl font-mono text-xs text-slate-400 space-y-1">
                <div>Document: <span className="text-white uppercase">{user.kycData.documentType}</span> ({user.kycData.documentNumber})</div>
                <div>Submitted At: <span className="text-white">{new Date(user.kycData.submittedAt).toLocaleString()}</span></div>
              </div>
            )}
          </div>
        ) : (
          /* Submission Form */
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Submit Identity Documents</h3>
              <button
                type="button"
                onClick={fillSampleDocument}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Auto-Fill Sample Verified Documents
              </button>
            </div>

            {submitSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Documents submitted successfully! Awaiting administrator verification.</span>
              </div>
            )}

            {kycError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{kycError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Document Type Selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'passport', label: 'Passport', icon: <FileText className="w-4 h-4" /> },
                  { id: 'national_id', label: 'National ID Card', icon: <ShieldCheck className="w-4 h-4" /> },
                  { id: 'drivers_license', label: "Driver's License", icon: <UserCheck className="w-4 h-4" /> }
                ].map((dt) => (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setDocType(dt.id as any)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      docType === dt.id
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {dt.icon}
                    <span>{dt.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Document Legal Number
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                    placeholder="e.g. A9281048B"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Issuing Country
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. United States"
                  />
                </div>
              </div>

              {/* Upload Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Front Document */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Front Side of Document
                  </label>
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-4 text-center bg-slate-950/60 cursor-pointer min-h-[140px] flex flex-col items-center justify-center">
                    {frontImage ? (
                      <div className="space-y-1">
                        <img src={frontImage} alt="Front ID" className="h-16 w-auto mx-auto rounded object-cover shadow" />
                        <span className="text-[10px] text-emerald-400 block">Loaded Ready</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-500 mb-1" />
                        <span className="text-[11px] text-slate-400">Upload Front Photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setFrontImage)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Back Document (if card) */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Back Side of Document
                  </label>
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-4 text-center bg-slate-950/60 cursor-pointer min-h-[140px] flex flex-col items-center justify-center">
                    {backImage ? (
                      <div className="space-y-1">
                        <img src={backImage} alt="Back ID" className="h-16 w-auto mx-auto rounded object-cover shadow" />
                        <span className="text-[10px] text-emerald-400 block">Loaded Ready</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-500 mb-1" />
                        <span className="text-[11px] text-slate-400">Upload Back Photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setBackImage)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Live Selfie */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Selfie Holding Document
                  </label>
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-4 text-center bg-slate-950/60 cursor-pointer min-h-[140px] flex flex-col items-center justify-center">
                    {selfieImage ? (
                      <div className="space-y-1">
                        <img src={selfieImage} alt="Selfie" className="h-16 w-auto mx-auto rounded-full object-cover shadow" />
                        <span className="text-[10px] text-emerald-400 block">Selfie Ready</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-slate-500 mb-1" />
                        <span className="text-[11px] text-slate-400">Take or Upload Selfie</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setSelfieImage)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  All identity information is encrypted under AES-256 and verified strictly by the authorized brokerage administrator.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Submit Identity For Compliance Verification
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
