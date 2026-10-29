import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { DoctorSummary, DoctorSearchQuery, Slot, DoctorStatus, ErrorCodes } from '../../shared';
import { FICTIONAL_DOCTORS, FICTIONAL_SPECIALTIES, FictionalSpecialty } from './fictional-doctors.data.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class DoctorsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSpecialties(): Promise<FictionalSpecialty[]> {
    return FICTIONAL_SPECIALTIES;
  }

  async search(query: DoctorSearchQuery): Promise<{ doctors: DoctorSummary[]; total: number }> {
    // Only VERIFIED doctors are eligible for search (D-006, BE-P2.1.2)
    let filtered = FICTIONAL_DOCTORS.filter((doc) => doc.status === DoctorStatus.VERIFIED);

    if (query.specialty) {
      const specLower = query.specialty.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.specialties.some((s) => s.toLowerCase().includes(specLower) || s.toLowerCase() === specLower),
      );
    }

    if (query.language) {
      const langLower = query.language.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.languages.some((l) => l.toLowerCase() === langLower),
      );
    }

    if (query.minFeePaise !== undefined) {
      filtered = filtered.filter((doc) => doc.consultationFeePaise >= query.minFeePaise!);
    }

    if (query.maxFeePaise !== undefined) {
      filtered = filtered.filter((doc) => doc.consultationFeePaise <= query.maxFeePaise!);
    }

    if (query.practiceType) {
      filtered = filtered.filter((doc) => doc.practiceType === query.practiceType);
    }

    if (query.acceptsInstant !== undefined) {
      filtered = filtered.filter((doc) => doc.acceptsInstant === query.acceptsInstant);
    }

    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.displayName.toLowerCase().includes(term) ||
          (doc.bio && doc.bio.toLowerCase().includes(term)) ||
          doc.specialties.some((s) => s.toLowerCase().includes(term)),
      );
    }

    const total = filtered.length;
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginated = filtered.slice(offset, offset + limit);

    return { doctors: paginated, total };
  }

  async getBySlugOrId(idOrSlug: string): Promise<DoctorSummary> {
    const doctor = FICTIONAL_DOCTORS.find(
      (d) => d.id === idOrSlug || d.slug === idOrSlug,
    );

    if (!doctor || doctor.status !== DoctorStatus.VERIFIED) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor not found or not currently active for consultations',
      });
    }

    return doctor;
  }

  async getAvailableSlots(doctorId: string, targetDateStr?: string): Promise<Slot[]> {
    await this.getBySlugOrId(doctorId);

    // Compute slots in doctor's time zone (09:00 to 17:00 IST), 30 min duration
    const baseDate = targetDateStr ? new Date(targetDateStr) : new Date();
    // Default to tomorrow if targetDate is not supplied or in the past
    const slotDate = new Date(baseDate);
    if (!targetDateStr) {
      slotDate.setDate(slotDate.getDate() + 1);
    }

    const slots: Slot[] = [];
    const hours = [9, 10, 11, 12, 14, 15, 16]; // 9 AM - 5 PM, 1 PM lunch break

    for (const h of hours) {
      for (const m of [0, 30]) {
        // Construct UTC ISO timestamp for India Time (UTC + 5:30)
        const d = new Date(slotDate);
        d.setUTCHours(h - 5, m - 30, 0, 0); // Convert IST (h:m) to UTC
        const startTime = d.toISOString();
        const endTime = new Date(d.getTime() + 30 * 60 * 1000).toISOString();

        // Fictional availability: make 80% available, 20% reserved
        const isAvailable = (h * 60 + m) % 7 !== 0;

        slots.push({
          startTime,
          endTime,
          isAvailable,
        });
      }
    }

    return slots;
  }

  // ---------------------------------------------------------------------------
  // Doctor Onboarding (Authenticated)
  // ---------------------------------------------------------------------------

  async getOnboardingStatus(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            emailVerifiedAt: true,
            status: true,
          },
        },
        credentials: true,
        specialties: { include: { specialty: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor profile not found',
      });
    }

    const decisions = await this.prisma.verificationDecision.findMany({
      where: { doctorId: userId },
      orderBy: { decidedAt: 'desc' },
      take: 5,
    });

    return { profile, decisions };
  }

  async updateOnboardingProfile(
    userId: string,
    data: {
      displayName?: string;
      bio?: string;
      yearsExperience?: number;
      consultationFeePaise?: number;
      languages?: string[];
      practiceType?: 'INDEPENDENT' | 'MANAGED';
      acceptsInstant?: boolean;
    },
  ) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor profile not found',
      });
    }

    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.yearsExperience !== undefined && { yearsExperience: data.yearsExperience }),
        ...(data.consultationFeePaise !== undefined && { consultationFeePaise: data.consultationFeePaise }),
        ...(data.languages && { languages: data.languages }),
        ...(data.practiceType && { practiceType: data.practiceType }),
        ...(data.acceptsInstant !== undefined && { acceptsInstant: data.acceptsInstant }),
      },
    });
  }

  async addCredential(
    userId: string,
    data: {
      type: string;
      councilName: string;
      registrationNumber: string;
      documentFileId?: string;
    },
  ) {
    return this.prisma.doctorCredential.create({
      data: {
        doctorId: userId,
        type: data.type,
        councilName: data.councilName,
        registrationNumber: data.registrationNumber,
        documentFileId: data.documentFileId || null,
        status: 'SUBMITTED',
      },
    });
  }

  async submitForVerification(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: { credentials: true },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor profile not found',
      });
    }

    if (profile.credentials.length === 0) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Please provide at least one credential before submitting for verification',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.doctorProfile.update({
        where: { userId },
        data: { status: 'APPLIED' },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          actorRole: 'DOCTOR',
          action: 'DOCTOR_ONBOARDING_SUBMITTED',
          resourceType: 'DOCTOR_PROFILE',
          resourceId: userId,
        },
      });
    });

    return { message: 'Application submitted for admin verification' };
  }
}
