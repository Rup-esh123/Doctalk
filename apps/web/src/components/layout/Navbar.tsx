'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Menu,
  X,
  ShieldCheck,
  Video,
  UserCheck,
  CalendarCheck,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onOpenBooking?: () => void;
  onOpenDeviceCheck?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking, onOpenDeviceCheck }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2 group focus:outline-none">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:shadow transition-all">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Doc<span className="text-teal-700">TALK</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mt-0.5">
                  Healthcare India
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            <a
              href="#specialties"
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
            >
              Specialties
            </a>
            <a
              href="#doctors"
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
            >
              Find Doctors
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#safety"
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
            >
              Trust & Safety
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
            >
              FAQs
            </a>
          </nav>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {onOpenDeviceCheck && (
              <button
                type="button"
                onClick={onOpenDeviceCheck}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-1.5"
                title="Test your camera, microphone and network connectivity"
              >
                <Video className="w-3.5 h-3.5 text-teal-600" />
                Device Check
              </button>
            )}

            {isAuthenticated && user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:text-teal-700 hover:border-teal-300 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <a
                  href="#doctors"
                  onClick={(e) => {
                    if (onOpenBooking) {
                      e.preventDefault();
                      onOpenBooking();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Book Appointment
                </a>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            <a
              href="#specialties"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 rounded-md hover:bg-slate-50"
            >
              Specialties
            </a>
            <a
              href="#doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 rounded-md hover:bg-slate-50"
            >
              Find Doctors
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 rounded-md hover:bg-slate-50"
            >
              How It Works
            </a>
            <a
              href="#safety"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 rounded-md hover:bg-slate-50"
            >
              Trust & Safety
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 rounded-md hover:bg-slate-50"
            >
              FAQs
            </a>
          </nav>
          <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
            {onOpenDeviceCheck && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDeviceCheck();
                }}
                className="w-full text-center text-sm font-semibold text-slate-700 py-2.5 rounded-lg border border-slate-200"
              >
                Run Device Check
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenBooking) onOpenBooking();
              }}
              className="w-full text-center text-sm font-semibold bg-teal-700 text-white py-2.5 rounded-lg shadow-sm"
            >
              Book Consultation Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
