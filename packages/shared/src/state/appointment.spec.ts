import { describe, it, expect } from 'vitest';
import { AppointmentStatus } from '../enums/index.js';
import { canTransitionAppointment } from './appointment.js';

describe('Appointment State Machine Transitions', () => {
  it('allows valid HELD -> CONFIRMED transition upon payment', () => {
    expect(canTransitionAppointment(AppointmentStatus.HELD, AppointmentStatus.CONFIRMED)).toBe(true);
  });

  it('allows valid HELD -> EXPIRED transition upon hold expiry', () => {
    expect(canTransitionAppointment(AppointmentStatus.HELD, AppointmentStatus.EXPIRED)).toBe(true);
  });

  it('rejects invalid EXPIRED -> CONFIRMED transition (must not resurrect expired hold)', () => {
    expect(canTransitionAppointment(AppointmentStatus.EXPIRED, AppointmentStatus.CONFIRMED)).toBe(false);
  });

  it('allows CONFIRMED -> READY and READY -> IN_PROGRESS', () => {
    expect(canTransitionAppointment(AppointmentStatus.CONFIRMED, AppointmentStatus.READY)).toBe(true);
    expect(canTransitionAppointment(AppointmentStatus.READY, AppointmentStatus.IN_PROGRESS)).toBe(true);
  });

  it('allows IN_PROGRESS -> COMPLETED', () => {
    expect(canTransitionAppointment(AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED)).toBe(true);
  });

  it('terminal states have no forward transitions', () => {
    expect(canTransitionAppointment(AppointmentStatus.COMPLETED, AppointmentStatus.IN_PROGRESS)).toBe(false);
    expect(canTransitionAppointment(AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CONFIRMED)).toBe(false);
  });
});
