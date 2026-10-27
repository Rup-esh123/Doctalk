import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { ErrorCodes, DoctorStatus } from '@doctalk/shared';
import { EMAIL_PROVIDER_TOKEN } from '../../providers/email/email.provider.interface.js';
import type { EmailProvider } from '../../providers/email/email.provider.interface.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EMAIL_PROVIDER_TOKEN) private readonly emailProvider: EmailProvider,
  ) {}

  // ---------------------------------------------------------------------------
  // Doctor Verification Queue
  // ---------------------------------------------------------------------------

  async listApplications(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) {
      where.status = filters.status;
    }

    const [applications, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              emailVerifiedAt: true,
              createdAt: true,
            },
          },
          credentials: {
            select: {
              id: true,
              type: true,
              councilName: true,
              registrationNumber: true,
              status: true,
              documentFileId: true,
              createdAt: true,
            },
          },
          specialties: {
            include: {
              specialty: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getApplicationDetail(doctorId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            emailVerifiedAt: true,
            createdAt: true,
            status: true,
          },
        },
        credentials: true,
        specialties: { include: { specialty: true } },
        agreements: true,
      },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor application not found',
      });
    }

    // Also load verification decision history
    const decisions = await this.prisma.verificationDecision.findMany({
      where: { doctorId },
      orderBy: { decidedAt: 'desc' },
    });

    return { profile, decisions };
  }

  async approveApplication(doctorId: string, adminId: string, notes?: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      include: { user: { select: { email: true, id: true } } },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor application not found',
      });
    }

    // Prevent self-approval
    if (adminId === doctorId) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'You cannot approve your own application',
      });
    }

    if (profile.status !== DoctorStatus.APPLIED && profile.status !== DoctorStatus.UNDER_REVIEW) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATE_TRANSITION,
        message: `Cannot approve application in ${profile.status} status`,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.doctorProfile.update({
        where: { userId: doctorId },
        data: { status: 'VERIFIED' },
      });

      await tx.user.update({
        where: { id: doctorId },
        data: { status: 'ACTIVE' },
      });

      // Update credentials to verified
      await tx.doctorCredential.updateMany({
        where: { doctorId, status: 'SUBMITTED' },
        data: {
          status: 'VERIFIED',
          verifiedBy: adminId,
          verifiedAt: new Date(),
        },
      });

      // Record decision
      await tx.verificationDecision.create({
        data: {
          doctorId,
          adminId,
          decision: 'APPROVED',
          notes: notes || null,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          actorRole: 'ADMIN',
          action: 'DOCTOR_APPLICATION_APPROVED',
          resourceType: 'DOCTOR_PROFILE',
          resourceId: doctorId,
          meta: { notes },
        },
      });
    });

    // Notify doctor
    this.emailProvider
      .send(profile.user.email, 'DocTALK — Application Approved!', 'doctor-approved', {
        name: profile.displayName,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`,
      })
      .catch((err) => this.logger.warn(`Failed to send approval email: ${err.message}`));

    this.logger.log(`[Admin] Doctor ${doctorId} approved by admin ${adminId}`);

    return { message: 'Doctor application approved successfully' };
  }

  async rejectApplication(doctorId: string, adminId: string, reason: string, notes?: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      include: { user: { select: { email: true } } },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor application not found',
      });
    }

    if (adminId === doctorId) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'You cannot reject your own application',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.doctorProfile.update({
        where: { userId: doctorId },
        data: { status: 'REJECTED' },
      });

      await tx.doctorCredential.updateMany({
        where: { doctorId, status: 'SUBMITTED' },
        data: { status: 'REJECTED', notes: reason },
      });

      await tx.verificationDecision.create({
        data: {
          doctorId,
          adminId,
          decision: 'REJECTED',
          reason,
          notes: notes || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          actorRole: 'ADMIN',
          action: 'DOCTOR_APPLICATION_REJECTED',
          resourceType: 'DOCTOR_PROFILE',
          resourceId: doctorId,
          meta: { reason, notes },
        },
      });
    });

    // Notify doctor (do NOT expose specific credential details)
    this.emailProvider
      .send(profile.user.email, 'DocTALK — Application Update', 'doctor-rejected', {
        name: profile.displayName,
        reason,
      })
      .catch((err) => this.logger.warn(`Failed to send rejection email: ${err.message}`));

    this.logger.log(`[Admin] Doctor ${doctorId} rejected by admin ${adminId}: ${reason}`);

    return { message: 'Doctor application rejected' };
  }

  async requestMoreInfo(doctorId: string, adminId: string, reason: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      include: { user: { select: { email: true } } },
    });

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCodes.DOCTOR_NOT_FOUND,
        message: 'Doctor application not found',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.doctorProfile.update({
        where: { userId: doctorId },
        data: { status: 'UNDER_REVIEW' },
      });

      await tx.verificationDecision.create({
        data: {
          doctorId,
          adminId,
          decision: 'NEEDS_INFO',
          reason,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          actorRole: 'ADMIN',
          action: 'DOCTOR_INFO_REQUESTED',
          resourceType: 'DOCTOR_PROFILE',
          resourceId: doctorId,
          meta: { reason },
        },
      });
    });

    this.emailProvider
      .send(profile.user.email, 'DocTALK — Additional Information Required', 'doctor-needs-info', {
        name: profile.displayName,
        reason,
      })
      .catch((err) => this.logger.warn(`Failed to send info request email: ${err.message}`));

    return { message: 'Information request sent to doctor' };
  }
}
