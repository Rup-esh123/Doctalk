'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { DoctorCard } from '../components/doctor/DoctorCard';
import { BookingModal } from '../components/doctor/BookingModal';
import { DoctorProfileModal } from '../components/doctor/DoctorProfileModal';
import { DeviceCheckModal } from '../components/consult/DeviceCheckModal';
import {
  DoctorSummary,
  PracticeType,
  ConsultationMode,
  DoctorStatus,
  formatINR,
} from '@doctalk/shared';
import { apiClient } from '../lib/api-client';
import {
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Video,
  Mic,
  MessageSquare,
  Lock,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  HeartPulse,
  Baby,
  Brain,
  Activity,
  ArrowRight,
  FileText,
  UserCheck,
  RefreshCcw,
} from 'lucide-react';

// Initial fallback doctors ensuring instant rendering even during offline/bootstrap tests
const INITIAL_DOCTORS: DoctorSummary[] = [
  {
    id: 'doc-00000000-0000-0000-0000-000000000001',
    userId: 'usr-00000000-0000-0000-0000-000000000001',
    slug: 'dr-aarav-sharma',
    displayName: 'Dr. Aarav Sharma',
    bio: 'Senior Consultant in General Medicine with a focus on chronic disease management, diabetes prevention, and lifestyle medicine. (Fictional profile for platform development).',
    practiceType: PracticeType.INDEPENDENT,
    yearsExperience: 12,
    consultationFeePaise: 50000,
    currency: 'INR',
    languages: ['English', 'Hindi', 'Punjabi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['General Medicine'],
    ratingAvg: 4.9,
    ratingCount: 142,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000002',
    userId: 'usr-00000000-0000-0000-0000-000000000002',
    slug: 'dr-priya-nair',
    displayName: 'Dr. Priya Nair',
    bio: 'Cardiologist with extensive experience in preventive cardiology, hypertension screening, and tele-triage for heart conditions. (Fictional profile for platform development).',
    practiceType: PracticeType.MANAGED,
    yearsExperience: 15,
    consultationFeePaise: 80000,
    currency: 'INR',
    languages: ['English', 'Malayalam', 'Hindi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['Cardiology', 'General Medicine'],
    ratingAvg: 4.95,
    ratingCount: 98,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813511-68c1221b023f?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000003',
    userId: 'usr-00000000-0000-0000-0000-000000000003',
    slug: 'dr-rajesh-mukherjee',
    displayName: 'Dr. Rajesh Mukherjee',
    bio: 'Consultant Dermatologist specializing in clinical dermatology, tele-dermatology diagnosis, allergic reactions, and eczema. (Fictional profile for platform development).',
    practiceType: PracticeType.INDEPENDENT,
    yearsExperience: 9,
    consultationFeePaise: 60000,
    currency: 'INR',
    languages: ['English', 'Bengali', 'Hindi'],
    acceptsInstant: false,
    status: DoctorStatus.VERIFIED,
    specialties: ['Dermatology'],
    ratingAvg: 4.8,
    ratingCount: 76,
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000004',
    userId: 'usr-00000000-0000-0000-0000-000000000004',
    slug: 'dr-ananya-iyer',
    displayName: 'Dr. Ananya Iyer',
    bio: 'Pediatric specialist providing empathetic child healthcare advice, immunization guidance, and childhood illness consultations. (Fictional profile for platform development).',
    practiceType: PracticeType.MANAGED,
    yearsExperience: 11,
    consultationFeePaise: 55000,
    currency: 'INR',
    languages: ['English', 'Tamil', 'Hindi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['Pediatrics'],
    ratingAvg: 4.92,
    ratingCount: 115,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000005',
    userId: 'usr-00000000-0000-0000-0000-000000000005',
    slug: 'dr-vikram-malhotra',
    displayName: 'Dr. Vikram Malhotra',
    bio: 'Consultant Psychiatrist dedicated to evidence-based mental healthcare, anxiety disorders, depression, and cognitive wellbeing. (Fictional profile for platform development).',
    practiceType: PracticeType.INDEPENDENT,
    yearsExperience: 14,
    consultationFeePaise: 90000,
    currency: 'INR',
    languages: ['English', 'Hindi', 'Marathi'],
    acceptsInstant: false,
    status: DoctorStatus.VERIFIED,
    specialties: ['Psychiatry & Mental Health'],
    ratingAvg: 4.88,
    ratingCount: 89,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'doc-00000000-0000-0000-0000-000000000006',
    userId: 'usr-00000000-0000-0000-0000-000000000006',
    slug: 'dr-sunita-deshmukh',
    displayName: 'Dr. Sunita Deshmukh',
    bio: 'Senior Obstetrician and Gynecologist with expertise in reproductive wellness, maternal guidance, and hormonal health. (Fictional profile for platform development).',
    practiceType: PracticeType.MANAGED,
    yearsExperience: 16,
    consultationFeePaise: 75000,
    currency: 'INR',
    languages: ['English', 'Marathi', 'Hindi'],
    acceptsInstant: true,
    status: DoctorStatus.VERIFIED,
    specialties: ['Obstetrics & Gynecology'],
    ratingAvg: 4.96,
    ratingCount: 160,
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&auto=format&fit=crop&q=80',
  },
];

const SPECIALTY_OPTIONS = [
  { name: 'All Specialties', icon: Stethoscope, value: '' },
  { name: 'General Medicine', icon: Stethoscope, value: 'General Medicine' },
  { name: 'Cardiology', icon: HeartPulse, value: 'Cardiology' },
  { name: 'Dermatology', icon: Sparkles, value: 'Dermatology' },
  { name: 'Pediatrics', icon: Baby, value: 'Pediatrics' },
  { name: 'Psychiatry', icon: Brain, value: 'Psychiatry' },
  { name: 'Gynecology', icon: Activity, value: 'Gynecology' },
];

export default function HomePage() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>(INITIAL_DOCTORS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedPracticeType, setSelectedPracticeType] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [bookingDoctor, setBookingDoctor] = useState<DoctorSummary | null>(null);
  const [profileDoctor, setProfileDoctor] = useState<DoctorSummary | null>(null);
  const [deviceCheckOpen, setDeviceCheckOpen] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Fetch doctors from backend with current filters
  const fetchDoctors = useCallback(() => {
    setLoading(true);
    apiClient
      .getDoctors({
        search: searchTerm.trim() || undefined,
        specialty: selectedSpecialty || undefined,
        language: selectedLanguage || undefined,
        practiceType: (selectedPracticeType as PracticeType) || undefined,
        mode: (selectedMode as ConsultationMode) || undefined,
      })
      .then((res) => {
        if (res && res.doctors) {
          setDoctors(res.doctors);
        }
      })
      .catch(() => {
        // Fallback filter locally
        let list = INITIAL_DOCTORS;
        if (selectedSpecialty) {
          list = list.filter((d) => d.specialties.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase())));
        }
        if (selectedLanguage) {
          list = list.filter((d) => d.languages.includes(selectedLanguage));
        }
        if (searchTerm) {
          const t = searchTerm.toLowerCase();
          list = list.filter((d) => d.displayName.toLowerCase().includes(t) || d.specialties.some((s) => s.toLowerCase().includes(t)));
        }
        setDoctors(list);
      })
      .finally(() => setLoading(false));
  }, [searchTerm, selectedSpecialty, selectedLanguage, selectedPracticeType, selectedMode]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSelectedLanguage('');
    setSelectedPracticeType('');
    setSelectedMode('');
    setDoctors(INITIAL_DOCTORS);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenBooking={() => setBookingDoctor(doctors[0] || INITIAL_DOCTORS[0])}
        onOpenDeviceCheck={() => setDeviceCheckOpen(true)}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/50 via-white to-slate-50 border-b border-slate-200 pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/70 border border-teal-200/80 text-teal-800 text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>National Medical Commission (NMC) Telemedicine Practice Guidelines Aligned</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Experienced, Verified Indian Doctors.{' '}
              <span className="text-teal-700">Scheduled & Prompt Teleconsultations.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Connect securely with verified specialist physicians across India via encrypted video, low-bandwidth audio, or clinical chat. Transparent fees, guaranteed slot holds, and digitally issued prescriptions.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>100% Medical Council Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Double-Booking Protected Slots</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-600" />
                <span>Field-Encrypted Health Records</span>
              </div>
            </div>

            {/* Interactive Search Bar Box */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 bg-white p-3 rounded-2xl shadow-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-center text-left"
              role="search"
              aria-label="Doctor search form"
            >
              <div className="flex-1 w-full flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by doctor name or symptoms (e.g. fever, skin rash)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="w-full md:w-48">
                <select
                  aria-label="Filter by Medical Specialty"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Specialties</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Gynecology">Gynecology</option>
                </select>
              </div>

              <div className="w-full md:w-40">
                <select
                  aria-label="Filter by Spoken Language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Languages</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Punjabi">Punjabi</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Medical Specialties Grid */}
      <section id="specialties" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block mb-1">
                Clinical Departments
              </span>
              <h2 className="text-2xl font-bold text-slate-900">Medical Specialties</h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Select a specialty to explore board-certified specialists with transparent per-consultation pricing.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPECIALTY_OPTIONS.slice(1).map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedSpecialty === item.value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedSpecialty(isSelected ? '' : item.value);
                  }}
                  className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50 ring-2 ring-teal-700 text-teal-900 shadow-sm'
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-800 bg-white'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                      isSelected ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verified Doctors Discovery Grid */}
      <section id="doctors" className="py-16 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header & Active Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Verified Practitioners</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                  {doctors.length} available
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All listed doctors hold active state or national council registrations. Unverified profiles are strictly blocked from bookings.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                aria-label="Filter by Practice Type"
                value={selectedPracticeType}
                onChange={(e) => setSelectedPracticeType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
              >
                <option value="">All Practices</option>
                <option value="INDEPENDENT">Independent</option>
                <option value="MANAGED">DocTALK Managed Clinic</option>
              </select>

              {(selectedSpecialty || selectedLanguage || selectedPracticeType || searchTerm) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No doctors match your criteria</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try clearing some filters or searching for a broader medical specialty.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-teal-700 text-white font-semibold text-xs rounded-lg"
              >
                View All Verified Doctors
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onBook={(doc) => setBookingDoctor(doc)}
                  onViewProfile={(doc) => setProfileDoctor(doc)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How Consultations Work (3-Step Lifecycle) */}
      <section id="how-it-works" className="py-16 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Transparent & Reliable Care
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How Consultations Work on DocTALK
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A clinical workflow engineered for patient safety, network resilience, and clear accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Discover & Hold Slot</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter verified specialists by council registration and language. Review exact consultation fees before paying. When you select a slot, it is placed on a temporary 10-minute hold that mathematically prevents double-booking.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                <span>Database GiST Range Exclusion</span> &bull; <span>Hold Expiry Guard</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Pre-Check & Waiting Room</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Run an automated microphone and camera pre-check. Enter the secure waiting room 10 minutes prior to your visit. The consultation unlocks only when both patient and verified doctor are present.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                <span>Hardware Diagnostics</span> &bull; <span>Auto Reconnection</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Consultation & Prescription</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consult via HD Video, audio fallback, or persistent encrypted chat. Receive an immutable digitally generated prescription accessible via secure short-lived URLs. All encounters are recorded in your private records.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                <span>Digitally Signed PDF</span> &bull; <span>Encrypted History</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multimodal Consultation Channels Showcase */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Purpose-Built Telehealth Technology
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Consultation Modes Designed for India
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Because network bandwidth varies across India, DocTALK supports three seamless consultation modes with automatic degradation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">HD Video Teleconsultation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                High-definition, low-latency video via dedicated WebRTC providers. Tokenized access windows prevent unauthorized intrusions.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Short-lived participant tokens</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>No recording by default</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Low-Bandwidth Audio Mode</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Optimized for rural and 3G/4G network conditions. Automatically suggested when video packet loss is detected, ensuring consultation continuity.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Works under throttled bandwidth</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Zero extra data consumption</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Persistent Clinical Chat</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Real-time WebSocket chat persisted securely in Postgres with encrypted payloads. Patients and doctors can exchange photos and lab reports safely.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Encrypted message storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Private scanned attachment sharing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust, Safety, & Regulatory Compliance */}
      <section id="safety" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Security & Patient Safety Standards</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed for Healthcare Privacy and Financial Integrity
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Telemedicine involves sensitive patient health information (PHI) and money. DocTALK is architected with healthcare compliance, auditability, and clinical privacy from the ground up:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Mandatory Council Verification</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Doctors must submit verified registration certificates and pass administrator review before receiving bookings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Field-Level Clinical Encryption</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Clinical notes and diagnoses are encrypted with dedicated keys outside the database. Clinical records are isolated from search and analytics views.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Double-Entry Financial Ledger</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      All consultation payments, commissions, and refunds are recorded in an append-only ledger in integer paise. Historical transactions are never silently overwritten.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Security Architecture Visual */}
            <div className="p-8 bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl shadow-xl space-y-6 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-teal-400">DocTALK Security Policy</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Active Controls
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex justify-between items-center">
                  <span className="text-slate-300">Data in Transit</span>
                  <span className="font-bold text-teal-300">TLS 1.3 Strict HSTS</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex justify-between items-center">
                  <span className="text-slate-300">Clinical Data at Rest</span>
                  <span className="font-bold text-teal-300">AES-256 Field Encryption</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex justify-between items-center">
                  <span className="text-slate-300">Payment Confirmation</span>
                  <span className="font-bold text-teal-300">Signed Webhook Verification Only</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex justify-between items-center">
                  <span className="text-slate-300">Consultation Recording</span>
                  <span className="font-bold text-amber-300">Disabled by Default (Zero PHI Stored)</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex justify-between items-center">
                  <span className="text-slate-300">Assistive AI Governance</span>
                  <span className="font-bold text-teal-300">Clinician Review Gate Enforced</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * Built in accordance with the Telemedicine Practice Guidelines and Digital Personal Data Protection Act requirements.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Interactive Accordion) */}
      <section id="faq" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Clear & Honest Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Everything you need to know about booking, doctor verification, and digital prescriptions.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does DocTALK prevent double-booking of doctors?',
                a: 'DocTALK enforces atomic PostgreSQL GiST range exclusion constraints at the database level. When you choose a slot, a 10-minute hold is acquired. Even if multiple patients click the same slot concurrently, the database guarantees that only one transaction can hold the slot.',
              },
              {
                q: 'Are digital prescriptions issued on DocTALK valid at Indian pharmacies?',
                a: 'Yes. Prescriptions issued by registered medical practitioners via DocTALK comply with the Telemedicine Practice Guidelines. They are digitally generated, signed, include the practitioner registration number, and contain a verifiable unique ID.',
              },
              {
                q: 'What is the consultation cancellation and refund policy?',
                a: 'Cancellations made 24 hours or more before the scheduled visit receive a 100% refund. Cancellations made between 2 and 24 hours receive a 50% refund. If the doctor cancels or does not join, patients receive a 100% full refund.',
              },
              {
                q: 'What happens if my internet connection drops during a video call?',
                a: 'DocTALK includes a 60-second automatic reconnection window. If your bandwidth remains degraded, you can switch with a single click to our low-bandwidth audio-only mode or clinical chat.',
              },
              {
                q: 'How does DocTALK use Artificial Intelligence?',
                a: 'DocTALK treats AI strictly as an assistive tool for structured intake drafting. AI is never allowed to autonomously diagnose, prescribe medications, or make clinical decisions. Any AI-generated summary must be explicitly approved by a licensed doctor.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-teal-700"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-teal-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modals */}
      <BookingModal
        doctor={bookingDoctor}
        isOpen={Boolean(bookingDoctor)}
        onClose={() => setBookingDoctor(null)}
      />

      <DoctorProfileModal
        doctor={profileDoctor}
        isOpen={Boolean(profileDoctor)}
        onClose={() => setProfileDoctor(null)}
        onBook={(doc) => {
          setProfileDoctor(null);
          setBookingDoctor(doc);
        }}
      />

      <DeviceCheckModal
        isOpen={deviceCheckOpen}
        onClose={() => setDeviceCheckOpen(false)}
      />
    </div>
  );
}
