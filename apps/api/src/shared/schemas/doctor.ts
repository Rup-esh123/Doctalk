import { z } from 'zod';
import { ConsultationMode, PracticeType } from '../enums';

export const doctorSearchQuerySchema = z.object({
  specialty: z.string().optional(),
  language: z.string().optional(),
  minFeePaise: z.coerce.number().int().optional(),
  maxFeePaise: z.coerce.number().int().optional(),
  mode: z.nativeEnum(ConsultationMode).optional(),
  practiceType: z.nativeEnum(PracticeType).optional(),
  acceptsInstant: z.coerce.boolean().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type DoctorSearchQuery = z.infer<typeof doctorSearchQuerySchema>;

export const doctorProfileUpdateSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  yearsExperience: z.number().int().min(0).max(70).optional(),
  consultationFeePaise: z.number().int().min(10000).optional(),
  languages: z.array(z.string()).min(1).optional(),
  acceptsInstant: z.boolean().optional(),
});

export type DoctorProfileUpdateInput = z.infer<typeof doctorProfileUpdateSchema>;
