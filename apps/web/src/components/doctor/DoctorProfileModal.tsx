'use client';

import React from 'react';
import { DoctorSummary, formatINR } from '@/shared';
import {
  X,
  CheckCircle2,
  Star,
  Globe,
  Building2,
  Calendar,
  GraduationCap,
  Shield,
  Award,
} from 'lucide-react';

interface DoctorProfileModalProps {
  doctor: DoctorSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (doctor: DoctorSummary) => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onBook,
}) => {
  if (!isOpen || !doctor) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-profile-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-5">
            <img
              src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
              alt={doctor.displayName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="doctor-profile-title" className="text-xl font-bold text-white">
                  {doctor.displayName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Council Verified
                </span>
              </div>
              <p className="text-teal-200 text-sm font-medium mt-1">
                {doctor.specialties.join(' &bull; ')}
              </p>
              <div className="flex items-center gap-3 text-xs text-teal-100/80 mt-2">
                <span>{doctor.yearsExperience} Years Clinical Experience</span>
                <span>&bull;</span>
                <div className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>{doctor.ratingAvg.toFixed(1)}</span>
                  <span className="text-teal-200/70 font-normal">({doctor.ratingCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Practice Type & Council Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Award className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Verification</span>
                <span className="font-bold text-slate-800">State Medical Council Registered</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Affiliation</span>
                <span className="font-bold text-slate-800">
                  {doctor.practiceType === 'MANAGED' ? 'DocTALK Managed Clinic' : 'Independent Practitioner'}
                </span>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Professional Biography
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-xl">
              {doctor.bio || 'Experienced practitioner dedicated to evidence-based outpatient consultations.'}
            </p>
          </div>

          {/* Languages & Consultation Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-700" />
                Languages Spoken
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {doctor.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg text-xs"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-700" />
                Compliance & Security
              </h3>
              <ul className="space-y-1 text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>NMC Telemedicine Guidelines Compliant</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Digitally Signed Prescriptions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Fee per consultation
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatINR(doctor.consultationFeePaise)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onBook(doctor);
            }}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all hover:shadow flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Book with {doctor.displayName.split(' ')[0]}
          </button>
        </div>
      </div>
    </div>
  );
};
