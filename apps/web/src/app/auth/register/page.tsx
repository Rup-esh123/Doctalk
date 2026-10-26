'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientRegisterSchema } from '@doctalk/shared';
import { useAuth } from '../../../lib/auth-context';
import {
  Stethoscope,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Shield,
} from 'lucide-react';

type RegisterFormData = z.infer<typeof patientRegisterSchema>;

const passwordChecks = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /\d/.test(pw) },
];

export default function PatientRegisterPage() {
  const router = useRouter();
  const { registerPatient } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [watchedPassword, setWatchedPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: { fullName: '', email: '', password: '', phone: '' },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      await registerPatient(data.fullName, data.email, data.password, data.phone);
      router.push('/dashboard?welcome=1');
    } catch (err: any) {
      setServerError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-12 flex-col justify-between text-white">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none">
                Doc<span className="text-teal-400">TALK</span>
              </span>
              <span className="text-xs text-teal-300/70 uppercase tracking-wider font-medium mt-0.5">
                Healthcare India
              </span>
            </div>
          </Link>

          <div className="mt-16 space-y-4">
            <h2 className="text-3xl font-extrabold leading-snug">
              Your Health,<br />
              <span className="text-teal-400">Your Privacy.</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
              Create a free patient account to book consultations with verified specialist physicians
              in minutes. No hidden fees.
            </p>
          </div>

          <div className="mt-12 space-y-5">
            {[
              { title: 'Instant Account, Lifetime Records', desc: 'Your health records stay private and encrypted — only accessible by you and treating doctors.' },
              { title: 'No Subscription Required', desc: 'Pay only for the consultations you book. Transparent per-visit pricing with full refund policy.' },
              { title: 'Multi-Device, Mobile-First', desc: 'Consult from your phone, tablet, or desktop with the same secure session.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-400/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Shield className="w-3.5 h-3.5" />
          <span>Protected under India's Digital Personal Data Protection Act</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                Doc<span className="text-teal-700">TALK</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900">Create your patient account</h1>
            <p className="text-sm text-slate-500 mt-1">Free to register. Pay only for consultations.</p>
          </div>

          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="reg-fullname" className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-fullname"
                type="text"
                autoComplete="name"
                {...register('fullName')}
                className={`w-full px-4 py-3 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                  errors.fullName
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-200 bg-white focus:border-teal-400'
                }`}
                placeholder="Rohan Verma"
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                  errors.email
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-200 bg-white focus:border-teal-400'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number{' '}
                <span className="text-slate-400 font-normal">(optional — for appointment reminders)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 font-semibold shrink-0">
                  +91
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  {...register('phone')}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                    errors.phone
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-slate-200 bg-white focus:border-teal-400'
                  }`}
                  placeholder="9876543210"
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password', {
                    onChange: (e) => setWatchedPassword(e.target.value),
                  })}
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                    errors.password
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-slate-200 bg-white focus:border-teal-400'
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}

              {/* Password Strength Hints */}
              {(watchedPassword || passwordValue) && (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {passwordChecks.map((check) => {
                    const val = watchedPassword || passwordValue;
                    const passed = check.test(val);
                    return (
                      <div key={check.label} className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3 h-3 shrink-0 transition-colors ${
                            passed ? 'text-teal-600' : 'text-slate-300'
                          }`}
                        />
                        <span
                          className={`text-[11px] transition-colors ${
                            passed ? 'text-teal-700 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {check.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Consent */}
            <div className="flex items-start gap-2.5">
              <input
                id="reg-consent"
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="reg-consent" className="text-[11px] text-slate-500 leading-relaxed">
                I agree to DocTALK's{' '}
                <a href="#" className="text-teal-700 underline font-medium">Terms of Service</a>
                ,{' '}
                <a href="#" className="text-teal-700 underline font-medium">Privacy Policy</a>
                , and{' '}
                <a href="#" className="text-teal-700 underline font-medium">Telemedicine Consent</a>.
                I understand that my health data will be encrypted and processed per India's DPDPA.
              </label>
            </div>

            {/* Submit */}
            <button
              id="btn-register-patient-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-teal-700 hover:text-teal-800">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">
              Want to join as a doctor?{' '}
              <Link href="/auth/register/doctor" className="font-semibold text-teal-700 hover:text-teal-800">
                Apply here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
