'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@doctalk/shared';
import { useAuth } from '../../../lib/auth-context';
import { Stethoscope, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result.mfaRequired) {
        // TODO FE-P1.1.3: Redirect to MFA challenge
        router.push('/auth/mfa');
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-12 flex-col justify-between text-white">
        <div>
          {/* Logo */}
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
              India&apos;s Most Trusted<br />
              <span className="text-teal-400">Telemedicine Platform</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
              Access verified, registered medical practitioners across India via secure
              video, audio, and clinical chat — right from your device.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { label: '100% Council-Verified Doctors', color: 'text-teal-400' },
              { label: 'Digitally Signed Prescriptions', color: 'text-teal-400' },
              { label: 'Field-Encrypted Medical Records', color: 'text-teal-400' },
              { label: 'Transparent Per-Consult Pricing', color: 'text-teal-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color} bg-current`} />
                <span className="text-sm text-slate-200">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          © 2026 DocTALK Healthcare India · NMC Telemedicine Guidelines Compliant
        </p>
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
            <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your DocTALK account</p>
          </div>

          {/* Demo Credentials Banner */}
          <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-blue-800 mb-1">🧪 Development Demo Account</p>
            <div className="text-xs text-blue-700 space-y-0.5 font-mono">
              <p>Patient: patient@doctalk.in / DocTalkPatient@2026</p>
            </div>
          </div>

          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                  errors.email
                    ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                    : 'border-slate-200 bg-white focus:border-teal-400'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                    errors.password
                      ? 'border-red-300 bg-red-50/50 focus:border-red-400'
                      : 'border-slate-200 bg-white focus:border-teal-400'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-teal-700 hover:text-teal-800">
                Register as a Patient
              </Link>
            </p>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">
              Are you a doctor?{' '}
              <Link href="/auth/register/doctor" className="font-semibold text-teal-700 hover:text-teal-800">
                Apply to join DocTALK
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              By signing in, you agree to DocTALK&apos;s{' '}
              <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
              Your health data is encrypted and protected under India&apos;s DPDPA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
