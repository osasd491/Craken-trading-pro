import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  UserCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService, useStore } from '../../services/store';

export const AdminKycPortal: React.FC = () => {
  const storeState = useStore();
  const users = storeState.users;

  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('Valid government photo identity confirmed.');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const kycSubmissions = users.filter((u) => u.kycData !== undefined);

  const handleOpenReview = (u: ClientUser) => {
    setSelectedUser(u);
    setReviewNotes('Valid government photo identity verified by compliance desk.');
    setSuccessMsg(null);
  };

  const handleApprove = () => {
    if (!selectedUser) return;
    StoreService.reviewKyc(selectedUser.id, 'verified', reviewNotes.trim());
    setSuccessMsg(`Identity verified successfully for ${selectedUser.name}!`);
    setTimeout(() => {
      setSelectedUser(null);
      setSuccessMsg(null);
    }, 2000);
  };

  const handleReject = () => {
    if (!selectedUser) return;
    StoreService.reviewKyc(
      selectedUser.id,
      'rejected',
      reviewNotes.trim() || 'Document image resolution unclear. Please re-upload high quality photo.'
    );
    setSuccessMsg(`KYC submission rejected for ${selectedUser.name}.`);
    setTimeout(() => {
      setSelectedUser(null);
      setSuccessMsg(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>KYC / AML Compliance Review Portal</span>
          </h2>
          <p className="text-xs text-slate-400">
            Review submitted government IDs, biometric selfies, and approve or deny client identity verification.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Document ID Number</th>
                <th className="py-3.5 px-4">Country</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Inspect Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {kycSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No KYC submissions recorded yet.
                  </td>
                </tr>
              ) : (
                kycSubmissions.map((u) => {
                  const kyc = u.kycData!;
                  return (
                    <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      <td className="py-3 px-4 uppercase font-mono font-semibold text-slate-300">
                        {kyc.documentType}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {kyc.documentNumber}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {kyc.country}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {new Date(kyc.submittedAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.kycStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : u.kycStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {u.kycStatus === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                          {u.kycStatus === 'pending' && <Clock className="w-3 h-3 animate-spin" />}
                          <span className="uppercase">{u.kycStatus}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReview(u)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review & Verify</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Inspection & Decision Modal */}
      {selectedUser && selectedUser.kycData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Compliance Document Verification</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Applicant: <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                {successMsg}
              </div>
            )}

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Type</span>
                <span className="font-bold text-white uppercase">{selectedUser.kycData.documentType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Doc Number</span>
                <span className="font-mono font-bold text-white">{selectedUser.kycData.documentNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Country</span>
                <span className="font-medium text-white">{selectedUser.kycData.country}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Current Status</span>
                <span className="font-bold text-amber-400 uppercase">{selectedUser.kycStatus}</span>
              </div>
            </div>

            {/* Uploaded Photos Showcase */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Submitted Credentials Photos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">Front ID Image</div>
                  <img
                    src={selectedUser.kycData.frontImage}
                    alt="Front"
                    className="w-full h-36 object-cover rounded-xl border border-slate-800 shadow"
                  />
                </div>
                {selectedUser.kycData.backImage && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2">Back ID Image</div>
                    <img
                      src={selectedUser.kycData.backImage}
                      alt="Back"
                      className="w-full h-36 object-cover rounded-xl border border-slate-800 shadow"
                    />
                  </div>
                )}
                {selectedUser.kycData.selfieImage && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2">Selfie Verification</div>
                    <img
                      src={selectedUser.kycData.selfieImage}
                      alt="Selfie"
                      className="w-full h-36 object-cover rounded-xl border border-slate-800 shadow"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Review Notes */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Compliance Officer Audit Remarks
              </label>
              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Identity verified and cleared under FinCEN regulations"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReject}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Deny / Reject Identity</span>
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Mark Verified</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
