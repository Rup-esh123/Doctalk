import { z } from 'zod';

export const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required').max(200),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)').max(100),
  frequency: z.string().min(1, 'Frequency is required (e.g., Twice daily after meals)').max(100),
  duration: z.string().min(1, 'Duration is required (e.g., 5 days)').max(100),
  instructions: z.string().max(500).optional(),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;

export const issuePrescriptionSchema = z.object({
  appointmentId: z.string().uuid(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medication is required'),
  generalAdvice: z.string().max(2000).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type IssuePrescriptionInput = z.infer<typeof issuePrescriptionSchema>;

export const encounterSchema = z.object({
  appointmentId: z.string().uuid(),
  clinicalSummary: z.string().min(5, 'Clinical summary is required').max(5000),
  diagnosis: z.string().min(2, 'Diagnosis is required').max(500),
  followUpInstructions: z.string().max(2000).optional(),
});

export type EncounterInput = z.infer<typeof encounterSchema>;
