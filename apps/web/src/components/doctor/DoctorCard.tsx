'use client';

import React from 'react';
import { DoctorSummary, formatINR } from '@doctalk/shared';
import {
  CheckCircle2,
  Star,
  Video,
  Mic,
  MessageSquare,
  Globe,
  Calendar,
  Building2,
} from 'lucide-react';

interface DoctorCardProps {
  doctor: DoctorSummary;
  onBook: (doctor: DoctorSummary) => void;
  onViewProfile: (doctor: DoctorSummary) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onBook,
  onViewProfile,
}) => {
  return (
    <article
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
      aria-label={`Doctor card for ${doctor.displayName}`}
    >
      <div className="p-6">
        {/* Top Header: Avatar + Info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
              alt={doctor.displayName}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200"
            />
            {doctor.acceptsInstant && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"
                title="Available for instant request"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {doctor.displayName}
              </h3>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200"
                title="Verified by Medical Council"
              >
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                Verified
              </span>
            </div>

            <p className="text-xs font-medium text-teal-800 mt-0.5 truncate">
              {doctor.specialties.join(', ')}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span>{doctor.yearsExperience} yrs experience</span>
              <span>&bull;</span>
              <div className="flex items-center gap-1 text-amber-600 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{doctor.ratingAvg.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({doctor.ratingCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio preview */}
        {doctor.bio && (
          <p className="text-xs text-slate-600 mt-4 line-clamp-2 leading-relaxed">
            {doctor.bio}
          </p>
        )}

        {/* Badges / Languages / Practice Type */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[140px]">{doctor.languages.join(', ')}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>{doctor.practiceType === 'MANAGED' ? 'DocTALK Clinic' : 'Independent'}</span>
          </div>
        </div>

        {/* Supported consultation channels */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="text-[11px] font-medium text-slate-400">Available via:</span>
          <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
            <Video className="w-3 h-3" /> Video
          </span>
          <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
            <Mic className="w-3 h-3" /> Audio
          </span>
          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-medium">
            <MessageSquare className="w-3 h-3" /> Chat
          </span>
        </div>
      </div>

      {/* Card Footer: Fee & Action Buttons */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
            Consult Fee
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {formatINR(doctor.consultationFeePaise)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewProfile(doctor)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => onBook(doctor)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-all hover:shadow"
          >
            <Calendar className="w-3.5 h-3.5" />
            Book
          </button>
        </div>
      </div>
    </article>
  );
};
