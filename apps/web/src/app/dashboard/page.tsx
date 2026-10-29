'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '@/shared';
import {
  Stethoscope,
  Calendar,
  FileText,
  MessageSquare,
  Video,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Clock,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated, logout, isDoctor, isPatient, isAdmin } = useAuth();
  const isWelcome = searchParams.get('welcome') === '1';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = isAdmin ? 'Administrator' : isDoctor ? 'Doctor' : 'Patient';
  const roleBg = isAdmin ? 'bg-purple-100 text-purple-800' : isDoctor ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800';

  const quickActions = isPatient
    ? [
        { icon: Video, label: 'Book Consultation', href: '/#doctors', desc: 'Find and book with a verified specialist', color: 'text-teal-600', bg: 'bg-teal-50' },
        { icon: Calendar, label: 'My Appointments', href: '/appointments', desc: 'View upcoming and past consultations', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: FileText, label: 'My Records', href: '/records', desc: 'Prescriptions and clinical notes', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { icon: MessageSquare, label: 'Consultation Chat', href: '/chat', desc: 'In-consultation messaging', color: 'text-violet-600', bg: 'bg-violet-50' },
      ]
    : isDoctor
    ? [
        { icon: Calendar, label: 'My Schedule', href: '/doctor/schedule', desc: 'Manage your availability', color: 'text-teal-600', bg: 'bg-teal-50' },
        { icon: Video, label: 'Consultations', href: '/doctor/consultations', desc: 'Upcoming and past visits', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: FileText, label: 'Clinical Notes', href: '/doctor/notes', desc: 'Encounter records and prescriptions', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { icon: User, label: 'My Profile', href: '/doctor/profile', desc: 'Update your public profile', color: 'text-violet-600', bg: 'bg-violet-50' },
      ]
    : [
        { icon: ShieldCheck, label: 'Verification Queue', href: '/admin/verification', desc: 'Review pending doctor applications', color: 'text-teal-600', bg: 'bg-teal-50' },
        { icon: FileText, label: 'Audit Logs', href: '/admin/audit', desc: 'System audit trail', color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: Settings, label: 'Platform Config', href: '/admin/config', desc: 'Policies and feature flags', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { icon: MessageSquare, label: 'Dispute Resolution', href: '/admin/disputes', desc: 'Handle refund exceptions', color: 'text-violet-600', bg: 'bg-violet-50' },
      ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            Doc<span className="text-teal-700">TALK</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-900 leading-none">{user.displayName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome / Hero */}
        {isWelcome && (
          <div className="p-5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl shadow-lg flex items-center gap-4">
            <div className="text-3xl">🎉</div>
            <div>
              <h2 className="text-base font-extrabold">Welcome to DocTALK, {user.displayName.split(' ')[0]}!</h2>
              <p className="text-xs text-teal-100 mt-0.5">Your account is active. You can now book consultations with verified doctors.</p>
            </div>
          </div>
        )}

        {/* Doctor Verification Status Banner */}
        {isDoctor && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Application Under Verification</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Your medical council credentials are being reviewed by our clinical onboarding team per NMC guidelines.
                Consultations will be published as soon as your state council registration is verified.
              </p>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700 flex items-center justify-center text-2xl font-extrabold">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{user.displayName}</h1>
                <p className="text-sm text-slate-500">{user.email}</p>
                <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${roleBg}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-2 text-xs text-teal-700 hover:text-teal-800 font-semibold border border-teal-200 rounded-lg px-3 py-2 hover:bg-teal-50 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-extrabold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-sm transition-all group flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl ${action.bg} ${action.color} flex items-center justify-center shrink-0`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments Placeholder */}
        {isPatient && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Upcoming Appointments</h2>
              <Link href="/appointments" className="text-xs text-teal-700 font-semibold hover:underline">View all</Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">No upcoming appointments</p>
                <p className="text-xs text-slate-400 mt-1">Book your first consultation with a verified doctor</p>
              </div>
              <Link
                href="/#doctors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white font-bold text-xs rounded-lg hover:bg-teal-800 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                Find a Doctor
              </Link>
            </div>
          </div>
        )}

        {/* Admin quick status */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-4">Platform Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Pending Verifications', value: '—', color: 'text-amber-600' },
                { label: 'Active Doctors', value: '6', color: 'text-teal-600' },
                { label: 'Total Patients', value: '1', color: 'text-blue-600' },
                { label: 'Open Disputes', value: '0', color: 'text-slate-600' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-sm text-slate-500">Loading your dashboard…</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
