import React from 'react';
import { Stethoscope, ShieldCheck, Heart, AlertCircle, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand & Purpose */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Doc<span className="text-teal-400">TALK</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              DocTALK is a telemedicine marketplace and managed-clinic network for India, connecting patients with State and National Medical Council verified doctors.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>TLS 1.3 &bull; Field Encrypted &bull; No Auto Recordings</span>
            </div>
          </div>

          {/* Col 2: For Patients */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Patient Services
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#specialties" className="hover:text-teal-400 transition-colors">
                  Medical Specialties
                </a>
              </li>
              <li>
                <a href="#doctors" className="hover:text-teal-400 transition-colors">
                  Find Verified Doctors
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-teal-400 transition-colors">
                  Video & Audio Consultations
                </a>
              </li>
              <li>
                <a href="#safety" className="hover:text-teal-400 transition-colors">
                  Prescription & Health Records
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-teal-400 transition-colors">
                  Cancellation & Refund Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: For Practitioners & Compliance */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              For Practitioners
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  Doctor Application Wizard
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  Credential Verification Process
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  Practice Management & Subscriptions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  Telemedicine Practice Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-400 transition-colors">
                  Medical Indemnity Information
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Emergency & Grievance */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-2">
              Emergency & Grievance
            </h2>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>24/7 National Emergency</span>
              </div>
              <p>
                In acute emergency situations, dial <strong>112</strong> (National Unified) or <strong>108</strong> (Ambulance).
              </p>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>support@doctalk.in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>+91 (080) 4123-9000 (Mon-Sat, 9am-6pm IST)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal disclaimers */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} DocTALK Health Technologies India. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Patient Rights & Consent
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              Telemedicine Disclaimer
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/60 text-[11px] text-slate-600 text-center leading-relaxed">
          Disclaimer: DocTALK provides a technology platform connecting licensed Registered Medical Practitioners (RMPs) with patients in accordance with the Telemedicine Practice Guidelines issued under the Indian Medical Council Act / National Medical Commission Act. DocTALK does not provide autonomous clinical diagnosis. All medical opinions and prescriptions are issued solely by independent or managed practicing physicians.
        </div>
      </div>
    </footer>
  );
};
