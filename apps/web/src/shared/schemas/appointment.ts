import { z } from 'zod';
import { AppointmentKind, ConsultationMode } from '../enums';

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  slotStartTime: z.string().datetime({ message: 'Valid UTC ISO start datetime required' }),
  slotEndTime: z.string().datetime({ message: 'Valid UTC ISO end datetime required' }),
  mode: z.nativeEnum(ConsultationMode),
  kind: z.nativeEnum(AppointmentKind).optional().default(AppointmentKind.SCHEDULED),
  patientSymptoms: z.string().max(1000).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(3, 'Please specify a reason for cancellation').max(500),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const slotQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type SlotQuery = z.infer<typeof slotQuerySchema>;
