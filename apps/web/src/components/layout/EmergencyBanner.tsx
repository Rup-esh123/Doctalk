'use client';

import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <aside
      aria-label="Emergency medical guidance"
      className="bg-amber-500/10 border-b border-amber-300/40 text-amber-950 text-xs md:text-sm py-2 px-4 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
          <span>
            <strong>Emergency Guidance:</strong> If you are experiencing chest pain, difficulty breathing, or severe trauma, call{' '}
            <a href="tel:112" className="underline font-bold text-amber-900 hover:text-amber-950">
              112
            </a>{' '}
            or{' '}
            <a href="tel:108" className="underline font-bold text-amber-900 hover:text-amber-950">
              108
            </a>{' '}
            immediately. DocTALK does not replace emergency clinical services.
          </span>
        </div>
        <a
          href="tel:112"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shadow-sm shrink-0"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          Emergency: 112
        </a>
      </div>
    </aside>
  );
};
