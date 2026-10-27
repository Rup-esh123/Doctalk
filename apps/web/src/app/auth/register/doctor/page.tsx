'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Lock,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';

const STATE_COUNCILS = [
  'National Medical Commission (NMC / erstwhile MCI)',
  'Andhra Pradesh Medical Council',
  'Assam Medical Council',
  'Bihar Medical Council',
  'Delhi Medical Council',
  'Gujarat Medical Council',
  'Karnataka Medical Council',
  'Kerala Modern Medicine Council',
  'Maharashtra Medical Council',
  'Madhya Pradesh Medical Council',
  'Punjab Medical Council',
  'Rajasthan Medical Council',
  'Tamil Nadu Medical Council',
  'Telangana State Medical Council',
  'Uttar Pradesh Medical Council',
  'West Bengal Medical Council',
];

const SPECIALTY_OPTIONS = [
  'General Medicine',
  'Dermatology',
  'Cardiology',
  'Pediatrics',
  'Gynecology & Obstetrics',
  'Orthopedics',
  'Psychiatry',
  'ENT (Otorhinolaryngology)',
  'Neurology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
];

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati'];

export default function DoctorRegisterPage() {
  const router = useRouter();
  const { registerDoctor } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal & Council Credentials
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    registrationCouncil: 'National Medical Commission (NMC / erstwhile MCI)',
    registrationNumber: '',
    registrationYear: '2018',

    // Step 2: Practice & Profile
    specialty: 'General Medicine',
    yearsExperience: 5,
    consultationFeeRupees: 500,
    languages: ['English', 'Hindi'],
    bio: '',

    // Step 3: Documents
    regCertName: '',
    degreeCertName: '',
    idProofName: '',

    // Step 4: Consents
    agreedNmcGuidelines: false,
    agreedEthicsCode: false,
    agreedPlatformTerms: false,
  });

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const exists = prev.languages.includes(lang);
      const updated = exists ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang];
      return { ...prev, languages: updated.length ? updated : ['English'] };
    });
  };

  const handleNextStep1 = () => {
    setError('');
    if (!formData.displayName.trim()) return setError('Please enter your full name with Dr. title.');
    if (!formData.email.trim() || !formData.email.includes('@')) return setError('Please enter a valid email address.');
    if (formData.password.length < 8) return setError('Password must be at least 8 characters.');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    if (!formData.registrationNumber.trim()) return setError('Medical Council registration number is mandatory.');
    setStep(2);
  };

  const handleNextStep2 = () => {
    setError('');
    if (formData.consultationFeeRupees < 100) return setError('Minimum consultation fee is ₹100.');
    if (formData.languages.length === 0) return setError('Select at least one consultation language.');
    setStep(3);
  };

  const handleNextStep3 = () => {
    setError('');
    if (!formData.regCertName) return setError('Please upload your Medical Council Registration Certificate.');
    setStep(4);
  };

  const handleSubmit = async () => {
    setError('');
    if (!formData.agreedNmcGuidelines || !formData.agreedEthicsCode || !formData.agreedPlatformTerms) {
      return setError('You must review and agree to all regulatory and platform declarations.');
    }

    setIsSubmitting(true);
    try {
      await registerDoctor({
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        displayName: formData.displayName.startsWith('Dr.') ? formData.displayName : `Dr. ${formData.displayName}`,
        registrationCouncil: formData.registrationCouncil,
        registrationNumber: formData.registrationNumber,
        primarySpecialty: formData.specialty,
        yearsExperience: Number(formData.yearsExperience),
        consultationFeePaise: Math.round(Number(formData.consultationFeeRupees) * 100),
        languages: formData.languages,
        bio: formData.bio || undefined,
        termsAccepted: true,
        privacyAccepted: true,
        doctorAgreementAccepted: true,
      });

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit registration. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Doc<span className="text-teal-400">TALK</span> <span className="text-xs uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-medium border border-teal-500/30">Doctor Portal</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Register as a Verified Medical Practitioner
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Join DocTALK to deliver high-quality, legally compliant telemedicine care to patients across India.
          </p>
        </div>

        {/* Wizard Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-teal-950/20">
          {!isSubmitted ? (
            <>
              {/* Step Tracker */}
              <div className="grid grid-cols-4 gap-2 mb-8">
                {[
                  { num: 1, label: 'Credentials' },
                  { num: 2, label: 'Practice' },
                  { num: 3, label: 'Documents' },
                  { num: 4, label: 'Declarations' },
                ].map((s) => (
                  <div key={s.num} className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step === s.num
                          ? 'bg-teal-500 text-slate-950 ring-4 ring-teal-500/20 shadow-lg'
                          : step > s.num
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                          : 'bg-slate-700/60 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium hidden sm:inline ${
                        step === s.num ? 'text-teal-400' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: Council & Personal Credentials */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-700 pb-3 mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Building className="w-5 h-5 text-teal-400" /> Medical Council & Identity
                    </h2>
                    <p className="text-xs text-slate-400">
                      As per NMC Telemedicine Guidelines 2020, every practitioner must register their council credentials.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Full Legal Name (as on Council Registration) *
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Dr. Rajesh Sharma"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Professional Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="doctor@hospital.org"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Mobile Phone (+91)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        State Medical Council / NMC *
                      </label>
                      <select
                        value={formData.registrationCouncil}
                        onChange={(e) => setFormData({ ...formData, registrationCouncil: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {STATE_COUNCILS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Council Registration Number *
                      </label>
                      <input
                        type="text"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        placeholder="DMC-12345 / MCI-67890"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Registration Year
                      </label>
                      <input
                        type="number"
                        min="1960"
                        max="2026"
                        value={formData.registrationYear}
                        onChange={(e) => setFormData({ ...formData, registrationYear: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Password (min 8 chars) *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                    >
                      Continue to Practice Details <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Practice & Profile */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-700 pb-3 mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-teal-400" /> Practice & Specialization
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure your clinical specialization, consultation fee, and languages.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Primary Specialty *
                      </label>
                      <select
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {SPECIALTY_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Years of Clinical Experience *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Teleconsultation Fee (₹ INR) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-2.5 text-slate-400 text-sm">₹</span>
                        <input
                          type="number"
                          min="100"
                          max="20000"
                          step="50"
                          value={formData.consultationFeeRupees}
                          onChange={(e) => setFormData({ ...formData, consultationFeeRupees: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Standard consultation duration is 30 minutes. You retain 85% of each consultation.
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Languages Spoken for Consultations *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGE_OPTIONS.map((lang) => {
                          const isSelected = formData.languages.includes(lang);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => toggleLanguage(lang)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                              }`}
                            >
                              {lang} {isSelected && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Professional Summary / Bio
                      </label>
                      <textarea
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="MBBS, MD (General Medicine) with experience in chronic disease management..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2.5 rounded-xl transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                    >
                      Continue to Documents <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Documents Upload */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-700 pb-3 mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-400" /> Credential Documents
                    </h2>
                    <p className="text-xs text-slate-400">
                      Our medical review team verifies each certificate directly with the issuing council.
                    </p>
                  </div>

                  {/* Doc 1: Registration Certificate */}
                  <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Medical Council Registration Certificate *
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Clear scan of State Medical Council or MCI/NMC permanent registration certificate (PDF/JPG/PNG).
                        </div>
                      </div>
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/40 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {formData.regCertName ? 'Change File' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormData({ ...formData, regCertName: e.target.files[0].name });
                            }
                          }}
                        />
                      </label>
                    </div>
                    {formData.regCertName && (
                      <div className="mt-3 text-xs text-teal-300 bg-teal-950/60 border border-teal-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        Attached: <span className="font-mono">{formData.regCertName}</span>
                      </div>
                    )}
                  </div>

                  {/* Doc 2: Highest Degree Certificate */}
                  <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Highest Medical Degree Certificate (MBBS / MD / MS / DM)
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Degree certificate issued by recognized Indian or foreign medical university.
                        </div>
                      </div>
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/40 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {formData.degreeCertName ? 'Change File' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormData({ ...formData, degreeCertName: e.target.files[0].name });
                            }
                          }}
                        />
                      </label>
                    </div>
                    {formData.degreeCertName && (
                      <div className="mt-3 text-xs text-teal-300 bg-teal-950/60 border border-teal-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        Attached: <span className="font-mono">{formData.degreeCertName}</span>
                      </div>
                    )}
                  </div>

                  {/* Doc 3: Government ID Proof */}
                  <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/60">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Government ID Proof (Aadhaar / Passport / Voter ID)
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Government-issued photo identification for two-factor identity verification.
                        </div>
                      </div>
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/40 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {formData.idProofName ? 'Change File' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormData({ ...formData, idProofName: e.target.files[0].name });
                            }
                          }}
                        />
                      </label>
                    </div>
                    {formData.idProofName && (
                      <div className="mt-3 text-xs text-teal-300 bg-teal-950/60 border border-teal-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        Attached: <span className="font-mono">{formData.idProofName}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2.5 rounded-xl transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep3}
                      className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                    >
                      Continue to Declarations <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Legal Declarations & Submission */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-700 pb-3 mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-400" /> Regulatory Declarations
                    </h2>
                    <p className="text-xs text-slate-400">
                      DocTALK strictly complies with the National Medical Commission Telemedicine Practice Guidelines.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.agreedNmcGuidelines}
                        onChange={(e) => setFormData({ ...formData, agreedNmcGuidelines: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-teal-500 focus:ring-teal-400 bg-slate-800"
                      />
                      <span className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-0.5">NMC Telemedicine Guidelines 2020 Compliance</strong>
                        I confirm that I am a Registered Medical Practitioner (RMP) entitled to practice modern medicine
                        under the NMC Act 2019. I agree to exercise the same standard of care in telemedicine consultations
                        as in in-person visits and adhere to drug prescription restrictions (List O, A, B, Prohibited).
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.agreedEthicsCode}
                        onChange={(e) => setFormData({ ...formData, agreedEthicsCode: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-teal-500 focus:ring-teal-400 bg-slate-800"
                      />
                      <span className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-0.5">Code of Medical Ethics 2002</strong>
                        I agree to maintain patient confidentiality and privacy per the Indian Medical Council (Professional
                        Conduct, Etiquette and Ethics) Regulations and applicable digital personal data protection laws.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.agreedPlatformTerms}
                        onChange={(e) => setFormData({ ...formData, agreedPlatformTerms: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-teal-500 focus:ring-teal-400 bg-slate-800"
                      />
                      <span className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-0.5">Doctor Service Agreement & Platform Terms</strong>
                        I agree to the 15% platform commission on settled consultations, digital signature generation
                        for prescriptions, and two-factor authentication (MFA) enforcement on my clinical account.
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2.5 rounded-xl transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                    >
                      {isSubmitting ? 'Submitting Application...' : 'Submit Application for Verification'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* STEP 5: Success & Application Under Review */
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto mb-5 shadow-xl">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Application Submitted Successfully!
              </h2>

              <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                Thank you, <strong className="text-teal-400">{formData.displayName}</strong>. Your application
                has been received and is queued for verification by our medical credentialing team.
              </p>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Registration Number:</span>
                  <span className="text-white font-mono">{formData.registrationNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Council:</span>
                  <span className="text-white truncate max-w-[180px]">{formData.registrationCouncil}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-400 font-semibold uppercase">Pending Verification</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs max-w-md mx-auto mb-6 leading-relaxed">
                <Sparkles className="w-4 h-4 text-teal-400 inline mr-1" />
                A verification link has been sent to <strong>{formData.email}</strong>. Please check your inbox
                to verify your email address. Once our team validates your council credentials, your profile will be
                activated for consultations.
              </div>

              <div className="flex justify-center gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg"
                >
                  Go to Login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/auth/login" className="text-teal-400 hover:underline">
            Log in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}
