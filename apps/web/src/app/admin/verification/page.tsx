'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  FileText,
  AlertCircle,
  Loader2,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { apiClient } from '../../../lib/api-client';

export default function AdminVerificationPage() {
  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();

  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'info';
    doctorId: string;
    doctorName: string;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getAdminApplications({ status: statusFilter || undefined, limit: 50 });
      setApplications(res.applications || []);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.message || 'Failed to fetch doctor applications' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin, fetchApplications]);

  const openDetail = async (doctorId: string) => {
    try {
      const detail = await apiClient.getAdminApplicationDetail(doctorId);
      setSelectedDoctor(detail);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.message || 'Failed to load details' });
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setIsProcessing(true);
    setToastMessage(null);

    try {
      if (actionModal.type === 'approve') {
        const res = await apiClient.approveDoctorApplication(actionModal.doctorId, modalNotes);
        setToastMessage({ type: 'success', text: res.message });
      } else if (actionModal.type === 'reject') {
        if (!modalReason.trim()) {
          setToastMessage({ type: 'error', text: 'Rejection reason is mandatory.' });
          setIsProcessing(false);
          return;
        }
        const res = await apiClient.rejectDoctorApplication(actionModal.doctorId, modalReason, modalNotes);
        setToastMessage({ type: 'success', text: res.message });
      } else if (actionModal.type === 'info') {
        if (!modalReason.trim()) {
          setToastMessage({ type: 'error', text: 'Please specify the information required.' });
          setIsProcessing(false);
          return;
        }
        const res = await apiClient.requestDoctorInfo(actionModal.doctorId, modalReason);
        setToastMessage({ type: 'success', text: res.message });
      }

      setActionModal(null);
      setModalReason('');
      setModalNotes('');
      setSelectedDoctor(null);
      fetchApplications();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.message || 'Action failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Administrator Access Required</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This verification portal is restricted to authorized platform administrators and credentialing officers.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              Sign In as Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filtered = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.displayName.toLowerCase().includes(q) ||
      app.user?.email.toLowerCase().includes(q) ||
      app.credentials?.[0]?.registrationNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 text-sm max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Doctor Credentialing & Verification</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review and adjudicate Medical Council registrations per NMC Telemedicine Guidelines 2020.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchApplications}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
          <Link
            href="/dashboard"
            className="text-xs text-teal-400 hover:underline px-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: '', label: 'All Applications' },
            { id: 'APPLIED', label: 'Pending Review' },
            { id: 'UNDER_REVIEW', label: 'Needs Info' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === f.id
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor, council, reg #..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-2" />
            Loading credentialing applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No doctor applications found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Doctor / Applicant</th>
                  <th className="px-5 py-3 font-semibold">Council & Reg #</th>
                  <th className="px-5 py-3 font-semibold">Experience</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Applied</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((doc) => {
                  const cred = doc.credentials?.[0];
                  return (
                    <tr key={doc.userId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white text-sm">{doc.displayName}</div>
                        <div className="text-slate-400 text-xs">{doc.user?.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-teal-400 font-semibold">{cred?.registrationNumber || 'N/A'}</div>
                        <div className="text-slate-400 text-xs truncate max-w-xs">{cred?.councilName || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {doc.yearsExperience} yrs · ₹{Math.round(doc.consultationFeePaise / 100)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : doc.status === 'UNDER_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openDetail(doc.userId)}
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                        >
                          Examine <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Slideover / Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                    Application Review
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {selectedDoctor.profile.displayName}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400"
                >
                  ✕
                </button>
              </div>

              {/* Status Banner */}
              <div className="mb-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Status</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {selectedDoctor.profile.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Registered Email</div>
                  <div className="text-xs font-mono text-teal-300">{selectedDoctor.profile.user?.email}</div>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-4 mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Council Registrations & Proofs
                </h3>
                {selectedDoctor.profile.credentials?.map((c: any) => (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-teal-400 uppercase">{c.type}</div>
                        <div className="text-sm font-semibold text-white mt-0.5">{c.councilName}</div>
                      </div>
                      <span className="text-xs font-mono bg-slate-800 text-teal-300 px-2 py-0.5 rounded border border-slate-700">
                        {c.registrationNumber}
                      </span>
                    </div>
                    {c.documentFileId && (
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                        <FileText className="w-3.5 h-3.5 text-teal-400" />
                        <span>Attached file ID: <code className="text-slate-300">{c.documentFileId}</code></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Practice details */}
              <div className="space-y-3 mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Experience:</span>
                    <span className="font-semibold text-white">{selectedDoctor.profile.yearsExperience} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Consultation Fee:</span>
                    <span className="font-semibold text-white">₹{Math.round(selectedDoctor.profile.consultationFeePaise / 100)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Practice Model:</span>
                    <span className="font-semibold text-white">{selectedDoctor.profile.practiceType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Languages:</span>
                    <span className="font-semibold text-white">{selectedDoctor.profile.languages?.join(', ')}</span>
                  </div>
                </div>
                {selectedDoctor.profile.bio && (
                  <div className="text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Summary:</span>
                    <p className="text-slate-300 leading-relaxed">{selectedDoctor.profile.bio}</p>
                  </div>
                )}
              </div>

              {/* Past verification decisions */}
              {selectedDoctor.decisions?.length > 0 && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Verification History
                  </h3>
                  {selectedDoctor.decisions.map((d: any) => (
                    <div key={d.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className={d.decision === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}>
                          {d.decision}
                        </span>
                        <span className="text-slate-500">
                          {new Date(d.decidedAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {d.reason && <p className="text-slate-300 mt-1">Reason: {d.reason}</p>}
                      {d.notes && <p className="text-slate-400 mt-0.5">Notes: {d.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adjudication Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setActionModal({
                    type: 'approve',
                    doctorId: selectedDoctor.profile.userId,
                    doctorName: selectedDoctor.profile.displayName,
                  })
                }
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/10"
              >
                Approve Doctor
              </button>
              <button
                onClick={() =>
                  setActionModal({
                    type: 'info',
                    doctorId: selectedDoctor.profile.userId,
                    doctorName: selectedDoctor.profile.displayName,
                  })
                }
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                Request Info
              </button>
              <button
                onClick={() =>
                  setActionModal({
                    type: 'reject',
                    doctorId: selectedDoctor.profile.userId,
                    doctorName: selectedDoctor.profile.displayName,
                  })
                }
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {actionModal.type === 'approve' && `Approve ${actionModal.doctorName}`}
              {actionModal.type === 'reject' && `Reject ${actionModal.doctorName}`}
              {actionModal.type === 'info' && `Request Information from ${actionModal.doctorName}`}
            </h3>

            {actionModal.type === 'approve' && (
              <div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  This will mark the doctor as <strong>VERIFIED</strong>, publish their profile to search,
                  and send an approval notification email.
                </p>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Verification Notes (Optional, internal audit)
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Verified against NMC Indian Medical Register on..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {(actionModal.type === 'reject' || actionModal.type === 'info') && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-400">
                  {actionModal.type === 'reject' ? 'Rejection Reason *' : 'Information Required *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder={
                    actionModal.type === 'reject'
                      ? 'Registration number not found in NMC records...'
                      : 'Please upload a legible scan of the council permanent certificate...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleAction}
                className={`text-slate-950 font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-lg ${
                  actionModal.type === 'approve'
                    ? 'bg-emerald-500 hover:bg-emerald-400'
                    : actionModal.type === 'reject'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-amber-500 hover:bg-amber-400'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
