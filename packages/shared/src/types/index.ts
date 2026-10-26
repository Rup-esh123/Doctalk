import { UserRole, DoctorStatus, PracticeType, ConsultationMode, AppointmentStatus } from '../enums/index.js';

export interface UserSessionPayload {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  isVerified?: boolean;
}

export interface DoctorSummary {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio?: string;
  practiceType: PracticeType;
  yearsExperience: number;
  consultationFeePaise: number;
  currency: string;
  languages: string[];
  acceptsInstant: boolean;
  status: DoctorStatus;
  specialties: string[];
  ratingAvg: number;
  ratingCount: number;
  avatarUrl?: string;
}

export interface AppointmentSummary {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialtyName: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  mode: ConsultationMode;
  status: AppointmentStatus;
  feePaise: number;
  meetingRoomId?: string;
}

export interface Slot {
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  isAvailable: boolean;
}
