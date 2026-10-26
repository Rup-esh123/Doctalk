import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  UserRole,
  ErrorCodes,
  LoginInput,
  PatientRegisterInput,
  DoctorRegisterInput,
  UserSessionPayload,
} from '@doctalk/shared';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { hashPassword, verifyPassword } from '../../common/utils/crypto.js';
import { env } from '../../config/env.js';
import { randomUUID } from 'crypto';

interface InMemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  mfaEnabled: boolean;
  status: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Resilient memory store for local development/testing when PostgreSQL is offline
  private inMemoryUsers: Map<string, InMemoryUser> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers() {
    // Seed default admin and patient for instant testing
    const adminId = 'usr-admin-00000000-0000-0000-0000-000000000001';
    this.inMemoryUsers.set('admin@doctalk.in', {
      id: adminId,
      email: 'admin@doctalk.in',
      passwordHash: hashPassword('DocTalkAdmin@2026'),
      role: UserRole.ADMIN,
      displayName: 'System Administrator',
      mfaEnabled: false,
      status: 'ACTIVE',
    });

    const patientId = 'usr-patient-0000000-0000-0000-0000-000000000001';
    this.inMemoryUsers.set('patient@doctalk.in', {
      id: patientId,
      email: 'patient@doctalk.in',
      passwordHash: hashPassword('DocTalkPatient@2026'),
      role: UserRole.PATIENT,
      displayName: 'Rohan Verma',
      mfaEnabled: false,
      status: 'ACTIVE',
    });
  }

  async login(input: LoginInput) {
    const user = this.inMemoryUsers.get(input.email.toLowerCase());

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    if (user.mfaEnabled) {
      const mfaPendingToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role, mfaPending: true },
        { secret: env.JWT_ACCESS_SECRET, expiresIn: '5m' },
      );
      return {
        mfaRequired: true,
        mfaPendingToken,
      };
    }

    const payload: UserSessionPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      isVerified: true,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, familyId: randomUUID() },
      { secret: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_EXPIRY },
    );

    return {
      mfaRequired: false,
      accessToken,
      refreshToken,
      user: payload,
    };
  }

  async registerPatient(input: PatientRegisterInput) {
    const emailKey = input.email.toLowerCase();
    if (this.inMemoryUsers.has(emailKey)) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'An account with this email address already exists',
      });
    }

    const userId = randomUUID();
    const newUser: InMemoryUser = {
      id: userId,
      email: emailKey,
      passwordHash: hashPassword(input.password),
      role: UserRole.PATIENT,
      displayName: input.fullName,
      mfaEnabled: false,
      status: 'ACTIVE',
    };

    this.inMemoryUsers.set(emailKey, newUser);
    this.logger.log(`[Auth] Registered patient: ${newUser.email} (${userId})`);

    const payload: UserSessionPayload = {
      id: userId,
      email: newUser.email,
      role: newUser.role,
      displayName: newUser.displayName,
      isVerified: true,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });

    return {
      user: payload,
      accessToken,
      message: 'Patient registered successfully',
    };
  }

  async registerDoctor(input: DoctorRegisterInput) {
    const emailKey = input.email.toLowerCase();
    if (this.inMemoryUsers.has(emailKey)) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'An account with this email address already exists',
      });
    }

    const userId = randomUUID();
    const newUser: InMemoryUser = {
      id: userId,
      email: emailKey,
      passwordHash: hashPassword(input.password),
      role: UserRole.DOCTOR,
      displayName: input.displayName,
      mfaEnabled: true, // MFA mandatory for doctors per D-031
      status: 'APPLIED',
    };

    this.inMemoryUsers.set(emailKey, newUser);
    this.logger.log(`[Auth] Doctor application submitted: ${newUser.email} (${userId})`);

    return {
      message: 'Application submitted successfully. Our medical verification team will review your credentials.',
      doctorId: userId,
      status: 'SUBMITTED',
    };
  }

  async getMe(userId: string): Promise<UserSessionPayload> {
    for (const user of this.inMemoryUsers.values()) {
      if (user.id === userId) {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          isVerified: true,
        };
      }
    }
    throw new UnauthorizedException({
      code: ErrorCodes.AUTH_UNAUTHORIZED,
      message: 'User session not found',
    });
  }
}
