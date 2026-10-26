'use client';

import React, { useState, useEffect } from 'react';
import {
  DoctorSummary,
  ConsultationMode,
  AppointmentKind,
  formatINR,
  Slot,
} from '@doctalk/shared';
import {
  X,
  Calendar,
  Clock,
  Video,
  Mic,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Check,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface BookingModalProps {
  doctor: DoctorSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  isOpen,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>(ConsultationMode.VIDEO);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [patientSymptoms, setPatientSymptoms] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Load available slots when doctor or date changes
  useEffect(() => {
    if (!doctor || !isOpen) return;

    let mounted = true;
    setLoadingSlots(true);
    setErrorMsg(null);

    apiClient
      .getSlots(doctor.id, selectedDate)
      .then((res) => {
        if (mounted) {
          setSlots(res);
          // Auto select first available slot
          const firstAvail = res.find((s) => s.isAvailable);
          if (firstAvail) setSelectedSlot(firstAvail);
        }
      })
      .catch((err) => {
        if (mounted) {
          // Provide fallback slots if offline
          const fallbackSlots: Slot[] = [
            { startTime: `${selectedDate}T04:30:00.000Z`, endTime: `${selectedDate}T05:00:00.000Z`, isAvailable: true },
            { startTime: `${selectedDate}T05:00:00.000Z`, endTime: `${selectedDate}T05:30:00.000Z`, isAvailable: true },
            { startTime: `${selectedDate}T05:30:00.000Z`, endTime: `${selectedDate}T06:00:00.000Z`, isAvailable: false },
            { startTime: `${selectedDate}T06:00:00.000Z`, endTime: `${selectedDate}T06:30:00.000Z`, isAvailable: true },
            { startTime: `${selectedDate}T08:30:00.000Z`, endTime: `${selectedDate}T09:00:00.000Z`, isAvailable: true },
            { startTime: `${selectedDate}T09:00:00.000Z`, endTime: `${selectedDate}T09:30:00.000Z`, isAvailable: true },
          ];
          setSlots(fallbackSlots);
          setSelectedSlot(fallbackSlots[0]);
        }
      })
      .finally(() => {
        if (mounted) setLoadingSlots(false);
      });

    return () => {
      mounted = false;
    };
  }, [doctor, selectedDate, isOpen]);

  if (!isOpen || !doctor) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('Please select an available appointment slot.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('Please review and accept the teleconsultation terms and cancellation policy.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const idempotencyKey = `hold_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const res = await apiClient.createAppointment(
        {
          doctorId: doctor.id,
          slotStartTime: selectedSlot.startTime,
          slotEndTime: selectedSlot.endTime,
          mode: selectedMode,
          kind: AppointmentKind.SCHEDULED,
          patientSymptoms: patientSymptoms.trim() || undefined,
        },
        idempotencyKey,
      );

      setBookingSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reserve appointment slot. It may have just been booked by another patient.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSlotTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 id="booking-modal-title" className="text-lg font-bold text-slate-900">
              Book Teleconsultation
            </h2>
            <p className="text-xs text-slate-500">
              Reserved with {doctor.displayName} ({doctor.specialties[0]})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookingSuccess ? (
          /* Success Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Slot Reserved Successfully!</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Appointment ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-teal-800">{bookingSuccess.appointment.id.slice(0, 13)}...</code>
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-3">
                <strong>Hold Active for 10 Minutes:</strong> Payment order{' '}
                <code>{bookingSuccess.paymentOrder.orderId}</code> initiated for {formatINR(doctor.consultationFeePaise)}. The slot is secured from double-booking.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Practitioner:</span>
                <span className="font-semibold text-slate-800">{doctor.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consultation Mode:</span>
                <span className="font-semibold text-slate-800 uppercase">{selectedMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-semibold text-slate-800">
                  {formatSlotTime(bookingSuccess.appointment.startTime)} IST
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Total Consultation Charge:</span>
                <span className="text-teal-800">{formatINR(doctor.consultationFeePaise)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
            >
              Done / Return to Platform
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Mode Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                1. Select Consultation Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: ConsultationMode.VIDEO, label: 'HD Video', icon: Video, desc: 'Recommended' },
                  { mode: ConsultationMode.AUDIO, label: 'Audio Only', icon: Mic, desc: 'Low bandwidth' },
                  { mode: ConsultationMode.CHAT, label: 'Clinical Chat', icon: MessageSquare, desc: 'Text & files' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setSelectedMode(item.mode)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 text-teal-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />}
                      </div>
                      <span className="text-xs font-bold leading-tight block">{item.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Date & Available Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="slot-date-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Select Consultation Date & Slot
                </label>
                <span className="text-[11px] text-slate-500">Indian Standard Time (IST)</span>
              </div>

              <div className="mb-3">
                <input
                  id="slot-date-input"
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading available doctor slots...</div>
              ) : slots.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                  No slots available on this date. Please select another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-lg">
                  {slots.map((slot, idx) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-1.5 px-2 text-xs font-medium rounded-lg text-center transition-all ${
                          !slot.isAvailable
                            ? 'bg-slate-100 text-slate-300 line-through cursor-not-allowed'
                            : isSelected
                              ? 'bg-teal-700 text-white font-bold shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {formatSlotTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Symptoms Note (Optional) */}
            <div>
              <label htmlFor="symptoms-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Reason for Visit / Symptoms (Optional)
              </label>
              <textarea
                id="symptoms-input"
                rows={2}
                value={patientSymptoms}
                onChange={(e) => setPatientSymptoms(e.target.value)}
                placeholder="E.g., Fever for 2 days, seasonal allergies, follow-up on prescription..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:border-teal-600 resize-none"
              />
            </div>

            {/* 4. Transparent Fee Breakdown & Cancellation Policy */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Practitioner Fee:</span>
                <span className="font-semibold text-slate-900">{formatINR(doctor.consultationFeePaise)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>DocTALK Platform & Tech Charge:</span>
                <span className="text-emerald-700 font-semibold">₹0.00 (Included)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span className="text-teal-700 text-base">{formatINR(doctor.consultationFeePaise)}</span>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                <strong>Cancellation Policy:</strong> 100% refund if cancelled ≥ 24h prior. 50% refund if cancelled 2–24h prior. 0% if cancelled &lt; 2h or no-show.
              </div>
            </div>

            {/* 5. Informed Consent Checkbox */}
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="consent-check"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 h-4 w-4 border-slate-300 cursor-pointer"
              />
              <label htmlFor="consent-check" className="text-[11px] text-slate-600 cursor-pointer leading-tight">
                I understand this teleconsultation adheres to the Telemedicine Practice Guidelines issued under the NMC Act. I confirm I am located in India and accept the transparent cancellation policy.
              </label>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Securing Slot Hold...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Reserve Slot & Proceed ({formatINR(doctor.consultationFeePaise)})</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
