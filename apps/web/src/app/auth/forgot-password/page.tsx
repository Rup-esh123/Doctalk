'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-8 shadow-2xl">
        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
                <Mail className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-white">Reset Password</h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Enter your registered email address and we will send you a secure link to reset your password.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending link...
                  </>
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
            <p className="text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
              If an account exists with <strong className="text-teal-400">{email}</strong>, a password reset link has been dispatched.
              The link expires in 1 hour.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
