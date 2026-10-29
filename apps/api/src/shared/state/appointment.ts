import { AppointmentStatus } from '../enums';

export const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.HELD]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.EXPIRED,
    AppointmentStatus.CANCELLED_BY_PATIENT,
    AppointmentStatus.CANCELLED_BY_ADMIN,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.READY,
    AppointmentStatus.CANCELLED_BY_PATIENT,
    AppointmentStatus.CANCELLED_BY_DOCTOR,
    AppointmentStatus.CANCELLED_BY_ADMIN,
  ],
  [AppointmentStatus.READY]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.NO_SHOW_PATIENT,
    AppointmentStatus.NO_SHOW_DOCTOR,
    AppointmentStatus.CANCELLED_BY_ADMIN,
  ],
  [AppointmentStatus.IN_PROGRESS]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED_BY_ADMIN,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED_BY_PATIENT]: [],
  [AppointmentStatus.CANCELLED_BY_DOCTOR]: [],
  [AppointmentStatus.CANCELLED_BY_ADMIN]: [],
  [AppointmentStatus.NO_SHOW_PATIENT]: [],
  [AppointmentStatus.NO_SHOW_DOCTOR]: [],
  [AppointmentStatus.EXPIRED]: [],
};

export function canTransitionAppointment(
  current: AppointmentStatus,
  target: AppointmentStatus,
): boolean {
  const allowed = VALID_APPOINTMENT_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}
