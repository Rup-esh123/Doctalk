'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, Stethoscope } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';

export default function MfaChallengePage() {
  const router = useRouter();
  const { verifyMfa } = useAuth();
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleaned = totpCode.trim().replace(/\s+/g, '');
    if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) {
      setError('Please enter a valid 6-digit numeric authenticator code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyMfa(cleaned);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Enter the 6-digit verification code from your authenticator app (Google Authenticator, Microsoft Authenticator, or Authy).
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 text-center">
              6-Digit Authenticator Code
            </label>
            <input
              type="text"
              maxLength={6}
              autoFocus
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000 000"
              className="w-full text-center text-3xl tracking-widest font-mono font-bold bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || totpCode.length !== 6}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                Verify and Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-xs text-slate-400 hover:text-teal-400 transition-colors">
            Cancel and back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
