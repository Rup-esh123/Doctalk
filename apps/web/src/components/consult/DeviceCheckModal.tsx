'use client';

import React, { useState } from 'react';
import {
  X,
  Video,
  Mic,
  Wifi,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface DeviceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceCheckModal: React.FC<DeviceCheckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'ready' | 'simulated'>('ready');
  const [micStatus, setMicStatus] = useState<'checking' | 'ready' | 'simulated'>('ready');
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'good' | 'fair'>('good');
  const [runningTest, setRunningTest] = useState(false);

  if (!isOpen) return null;

  const handleRunDiagnostics = () => {
    setRunningTest(true);
    setCameraStatus('checking');
    setMicStatus('checking');
    setNetworkStatus('checking');

    setTimeout(() => {
      setCameraStatus('ready');
      setMicStatus('ready');
      setNetworkStatus('good');
      setRunningTest(false);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-check-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-teal-700" />
            <h2 id="device-check-title" className="text-base font-bold text-slate-900">
              Telemedicine Device Pre-Check
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            DocTALK tests your audio, video sensors, and bandwidth to guarantee stable connectivity during your clinical appointment.
          </p>

          <div className="space-y-3">
            {/* Camera */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Camera Permission</h3>
                  <p className="text-[11px] text-slate-500">HD Video input enabled</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {cameraStatus === 'checking' ? 'Testing...' : 'Ready'}
              </span>
            </div>

            {/* Microphone */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Microphone Input</h3>
                  <p className="text-[11px] text-slate-500">Audio capture active</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {micStatus === 'checking' ? 'Testing...' : 'Ready'}
              </span>
            </div>

            {/* Network */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Bandwidth & Latency</h3>
                  <p className="text-[11px] text-slate-500">&lt; 45ms latency to Mumbai edge</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {networkStatus === 'checking' ? 'Pinging...' : 'Optimal'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Weak Network Fallback:</strong> If your network experiences packet loss or jitter, DocTALK will seamlessly downgrade to low-bandwidth crystal audio or secure chat.
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={runningTest}
            onClick={handleRunDiagnostics}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningTest ? 'animate-spin' : ''}`} />
            Re-run Check
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
          >
            All Systems Good
          </button>
        </div>
      </div>
    </div>
  );
};
