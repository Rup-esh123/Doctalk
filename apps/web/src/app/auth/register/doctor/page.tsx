'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { doctorRegisterSchema } from '@doctalk/shared';
import { apiClient } from '../../../lib/api-client';
import {
  Stethoscope,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Shield,
  Clock,
  FileCheck,
} from 'lucide-react';

type DoctorRegisterFormData = z.infer<typeof doctorRegisterSchema>;

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ doctorId: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorRegisterFormData>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      registrationNumber: '',
      registrationCouncil: '',
      primarySpecialty: '',
    },
  });

  const onSubmit = async (data: DoctorRegisterFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await apiClient.registerDoctor(data);
      setSubmitted({ doctorId: result.doctorId });
    } catch (err: any) {
      setServerError(err?.message || 'Application submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Application Submitted!</h1>
            <p className="text-sm text-slate-500 mt-2">Your doctor application has been received.</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-200 text-left space-y-4">
            <h3 className="text-sm font-bold text-slate-800">What happens next?</h3>
            <div className="space-y-3">
              {[
                { icon: FileCheck, title: 'Document Verification', desc: 'Our medical team reviews your council registration and credentials.' },
                { icon: Clock, title: 'Review Timeline', desc: 'Most applications are reviewed within 5–7 business days.' },
                { icon: Shield, title: 'Approval & Onboarding', desc: 'You\'ll receive an email with next steps to complete your profile.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">
            Application ID: {submitted.doctorId.slice(0, 8).toUpperCase()}
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 text-white font-bold text-sm hover:bg-teal-800 transition-colors"
          >
            Return to DocTALK
          </Link>
        </div>
      </div>
    );
  }

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
                For Doctors
              </span>
            </div>
          </Link>

          <div className="mt-16 space-y-4">
            <h2 className="text-3xl font-extrabold leading-snug">
              Join India's Verified<br />
              <span className="text-teal-400">Telemedicine Network</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
              Extend your practice digitally. Reach patients across India via encrypted video, audio, and
              chat. Set your own schedule and fees.
            </p>
          </div>

          <div className="mt-12 space-y-5">
            {[
              { title: 'Your Fee, Your Terms', desc: 'You set the consultation fee. DocTALK charges a transparent platform commission per completed consultation.' },
              { title: 'Digitally Signed Prescriptions', desc: 'Issue NMC-compliant digital prescriptions to patients directly through the platform.' },
              { title: 'Flexible Availability', desc: 'Block your schedule by the week. Accept instant consults when you\'re available.' },
              { title: 'Secure Clinical Notes', desc: 'Write and store field-encrypted clinical notes and encounter records.' },
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
          <span>All credentials verified by our medical team before activation</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
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

          {/* Verification notice */}
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-bold text-amber-800 mb-1">⚕️ Medical Verification Required</p>
            <p className="text-xs text-amber-700">
              All applications undergo manual verification of your council registration before activation.
              This typically takes 5–7 business days.
            </p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900">Apply to join DocTALK</h1>
            <p className="text-sm text-slate-500 mt-1">For licensed medical practitioners.</p>
          </div>

          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Display Name */}
            <div>
              <label htmlFor="doc-displayname" className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name with Title <span className="text-red-500">*</span>
              </label>
              <input
                id="doc-displayname"
                type="text"
                {...register('displayName')}
                className={`w-full px-4 py-3 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                  errors.displayName
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-200 bg-white focus:border-teal-400'
                }`}
                placeholder="Dr. Aarav Sharma"
              />
              {errors.displayName && (
                <p className="mt-1.5 text-xs text-red-600">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="doc-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Professional Email <span className="text-red-500">*</span>
              </label>
              <input
                id="doc-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                  errors.email
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-slate-200 bg-white focus:border-teal-400'
                }`}
                placeholder="doctor@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Council Reg + Specialty in 2-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="doc-regnum" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Council Reg. No. <span className="text-red-500">*</span>
                </label>
                <input
                  id="doc-regnum"
                  type="text"
                  {...register('registrationNumber')}
                  className={`w-full px-4 py-3 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                    errors.registrationNumber
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-slate-200 bg-white focus:border-teal-400'
                  }`}
                  placeholder="MH-1234-2015"
                />
                {errors.registrationNumber && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.registrationNumber.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="doc-council" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Issuing Council <span className="text-red-500">*</span>
                </label>
                <select
                  id="doc-council"
                  {...register('registrationCouncil')}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer ${
                    errors.registrationCouncil
                      ? 'border-red-300 bg-red-50/50 text-slate-400'
                      : 'border-slate-200 bg-white focus:border-teal-400 text-slate-700'
                  }`}
                >
                  <option value="">Select council</option>
                  <option value="NMC">NMC (National)</option>
                  <option value="MCI">MCI</option>
                  <option value="Maharashtra MC">Maharashtra MC</option>
                  <option value="Delhi MC">Delhi MC</option>
                  <option value="Karnataka MC">Karnataka MC</option>
                  <option value="TN MC">Tamil Nadu MC</option>
                  <option value="Kerala MC">Kerala MC</option>
                  <option value="AP MC">Andhra Pradesh MC</option>
                  <option value="UP MC">Uttar Pradesh MC</option>
                  <option value="Gujarat MC">Gujarat MC</option>
                  <option value="Other">Other State Council</option>
                </select>
                {errors.registrationCouncil && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.registrationCouncil.message}</p>
                )}
              </div>
            </div>

            {/* Primary Specialty */}
            <div>
              <label htmlFor="doc-specialty" className="block text-xs font-bold text-slate-700 mb-1.5">
                Primary Specialty <span className="text-red-500">*</span>
              </label>
              <select
                id="doc-specialty"
                {...register('primarySpecialty')}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer ${
                  errors.primarySpecialty
                    ? 'border-red-300 bg-red-50/50 text-slate-400'
                    : 'border-slate-200 bg-white focus:border-teal-400 text-slate-700'
                }`}
              >
                <option value="">Select specialty</option>
                <option value="General Medicine">General Medicine / Internal Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Psychiatry & Mental Health">Psychiatry & Mental Health</option>
                <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="Gastroenterology">Gastroenterology</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Endocrinology">Endocrinology & Diabetes</option>
                <option value="Urology">Urology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT">ENT (Ear, Nose & Throat)</option>
                <option value="Oncology">Oncology</option>
                <option value="Radiology">Radiology & Imaging</option>
                <option value="Other">Other</option>
              </select>
              {errors.primarySpecialty && (
                <p className="mt-1.5 text-xs text-red-600">{errors.primarySpecialty.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="doc-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Account Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="doc-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${
                    errors.password
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-slate-200 bg-white focus:border-teal-400'
                  }`}
                  placeholder="Min. 8 characters"
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
              <p className="mt-1.5 text-xs text-slate-400">
                Note: MFA (authenticator app) will be required after account activation.
              </p>
            </div>

            {/* Medical Consent */}
            <div className="flex items-start gap-2.5">
              <input
                id="doc-consent"
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="doc-consent" className="text-[11px] text-slate-500 leading-relaxed">
                I confirm that I am a licensed medical practitioner registered with an Indian Medical Council.
                I agree to DocTALK's{' '}
                <a href="#" className="text-teal-700 underline font-medium">Practitioner Agreement</a>,{' '}
                <a href="#" className="text-teal-700 underline font-medium">Privacy Policy</a>, and
                the NMC Telemedicine Practice Guidelines.
              </label>
            </div>

            {/* Submit */}
            <button
              id="btn-doctor-register-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Application…
                </>
              ) : (
                <>
                  Submit Doctor Application
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
        </div>
      </div>
    </div>
  );
}
