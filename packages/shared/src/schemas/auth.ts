import { z } from 'zod';
import { UserRole } from '../enums/index.js';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const patientRegisterSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Please enter a valid phone number with country code').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional(),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  timezone: z.string().default('Asia/Kolkata').optional(),
});

export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>;

export const doctorRegisterSchema = z.object({
  displayName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Please enter a valid phone number').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  registrationNumber: z.string().min(3, 'Medical registration number is required'),
  registrationCouncil: z.string().min(2, 'Issuing medical council is required'),
  primarySpecialty: z.string().min(2, 'Primary specialty is required'),
  // Extended profile — provided during onboarding wizard after approval
  specialtyIds: z.array(z.string().uuid()).optional(),
  yearsExperience: z.number().int().min(0).max(70).optional(),
  consultationFeePaise: z.number().int().min(10000).optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().max(1000).optional(),
  timezone: z.string().default('Asia/Kolkata').optional(),
});

export type DoctorRegisterInput = z.infer<typeof doctorRegisterSchema>;

export const mfaVerifySchema = z.object({
  mfaPendingToken: z.string().min(10),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits').regex(/^\d{6}$/, 'Must be numeric'),
});

export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});
