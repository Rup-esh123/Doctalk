'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in URL. Please click the link in your email.');
      return;
    }

    apiClient
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Your email address has been successfully verified.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.message || 'Verification token is invalid or has expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-8 shadow-2xl text-center">
        {status === 'verifying' && (
          <div className="py-6 space-y-4">
            <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-white">Verifying your email...</h1>
            <p className="text-xs text-slate-400">Please wait while we confirm your email token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">{message}</p>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg"
              >
                Continue to Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-sm text-red-300 max-w-xs mx-auto leading-relaxed">{message}</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
