import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  UserRole,
  ErrorCodes,
  LoginInput,
  PatientRegisterInput,
  DoctorRegisterInput,
  MfaVerifyInput,
  UserSessionPayload,
} from '@doctalk/shared';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateSecureToken,
  encryptSecret,
  decryptSecret,
} from '../../common/utils/crypto.js';
import { env } from '../../config/env.js';
import { randomUUID } from 'crypto';
import { EMAIL_PROVIDER_TOKEN } from '../../providers/email/email.provider.interface.js';
import type { EmailProvider } from '../../providers/email/email.provider.interface.js';

// TOTP imports — otplib v13+ OTP class
import { OTP } from 'otplib';

const otp = new OTP({ strategy: 'totp' });

const EMAIL_VERIFY_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MFA_WINDOW = 1; // Allow 1 window before/after for clock skew

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(EMAIL_PROVIDER_TOKEN) private readonly emailProvider: EmailProvider,
  ) {}

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  async registerPatient(input: PatientRegisterInput, ip?: string) {
    const emailKey = input.email.toLowerCase().trim();

    // Check for existing account
    const existing = await this.prisma.user.findUnique({
      where: { email: emailKey },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'An account with this email address already exists',
      });
    }

    const passwordHashed = await hashPassword(input.password);
    const userId = randomUUID();

    // Create user + patient profile + consent in a single transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: userId,
          email: emailKey,
          phone: input.phone || null,
          passwordHash: passwordHashed,
          role: 'PATIENT', // Server-side role assignment — never trust client
          status: 'ACTIVE',
        },
      });

      await tx.patientProfile.create({
        data: {
          userId,
          fullName: input.fullName,
          dob: input.dob ? new Date(input.dob) : null,
          sex: input.sex || null,
          timezone: input.timezone || 'Asia/Kolkata',
        },
      });

      // Record terms + privacy consent
      await tx.consent.createMany({
        data: [
          {
            userId,
            type: 'TERMS_OF_SERVICE',
            policyVersion: '1.0',
            ip: ip || null,
          },
          {
            userId,
            type: 'PRIVACY_POLICY',
            policyVersion: '1.0',
            ip: ip || null,
          },
        ],
      });

      return newUser;
    });

    // Send email verification
    const verifyToken = generateSecureToken();
    await this.prisma.verificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(verifyToken),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 3600 * 1000),
      },
    });

    // Fire-and-forget email (don't block registration on email delivery)
    this.emailProvider
      .send(emailKey, 'Verify your DocTALK account', 'email-verification', {
        name: input.fullName,
        verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verifyToken}`,
        expiryHours: EMAIL_VERIFY_EXPIRY_HOURS,
      })
      .catch((err) => this.logger.warn(`Failed to send verification email: ${err.message}`));

    this.logger.log(`[Auth] Registered patient: ${emailKey} (${userId})`);

    // Issue session tokens
    const payload = this.buildSessionPayload(user, input.fullName);
    const { accessToken, refreshToken } = await this.issueTokenPair(payload, ip);

    return {
      user: payload,
      accessToken,
      refreshToken,
      message: 'Patient registered successfully. Please check your email to verify your account.',
    };
  }

  async registerDoctor(input: DoctorRegisterInput, ip?: string) {
    const emailKey = input.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: emailKey },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'An account with this email address already exists',
      });
    }

    const passwordHashed = await hashPassword(input.password);
    const userId = randomUUID();
    const slug = input.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + userId.substring(0, 8);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email: emailKey,
          phone: input.phone || null,
          passwordHash: passwordHashed,
          role: 'DOCTOR',
          status: 'PENDING', // Doctor accounts are pending until verified
          mfaEnabled: false, // Will be enforced at MFA enrollment
        },
      });

      await tx.doctorProfile.create({
        data: {
          userId,
          slug,
          displayName: input.displayName,
          bio: input.bio || null,
          yearsExperience: input.yearsExperience || 0,
          consultationFeePaise: input.consultationFeePaise || 50000,
          languages: input.languages || ['English', 'Hindi'],
          status: 'APPLIED',
          timeZone: input.timezone || 'Asia/Kolkata',
        },
      });

      // Store primary credential
      await tx.doctorCredential.create({
        data: {
          doctorId: userId,
          type: 'MEDICAL_REGISTRATION',
          councilName: input.registrationCouncil,
          registrationNumber: input.registrationNumber,
          status: 'SUBMITTED',
        },
      });

      // Record consents
      await tx.consent.createMany({
        data: [
          {
            userId,
            type: 'TERMS_OF_SERVICE',
            policyVersion: '1.0',
            ip: ip || null,
          },
          {
            userId,
            type: 'PRIVACY_POLICY',
            policyVersion: '1.0',
            ip: ip || null,
          },
          {
            userId,
            type: 'DOCTOR_AGREEMENT',
            policyVersion: '1.0',
            ip: ip || null,
          },
        ],
      });
    });

    // Send email verification
    const verifyToken = generateSecureToken();
    await this.prisma.verificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(verifyToken),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 3600 * 1000),
      },
    });

    this.emailProvider
      .send(emailKey, 'DocTALK — Doctor Application Received', 'doctor-application-received', {
        name: input.displayName,
        verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verifyToken}`,
        expiryHours: EMAIL_VERIFY_EXPIRY_HOURS,
      })
      .catch((err) => this.logger.warn(`Failed to send doctor verification email: ${err.message}`));

    this.logger.log(`[Auth] Doctor application submitted: ${emailKey} (${userId})`);

    return {
      message: 'Application submitted successfully. Please verify your email and our medical verification team will review your credentials.',
      doctorId: userId,
      status: 'SUBMITTED',
    };
  }

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  async login(input: LoginInput, ip?: string, userAgent?: string) {
    const emailKey = input.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: emailKey },
      include: { doctorProfile: { select: { displayName: true } }, patientProfile: { select: { fullName: true } } },
    });

    // Generic error message — do not reveal if account exists
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Enforce account status
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'Your account has been suspended. Please contact support.',
      });
    }
    if (user.status === 'DEACTIVATED') {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const displayName =
      user.doctorProfile?.displayName ||
      user.patientProfile?.fullName ||
      user.email.split('@')[0];

    // Check if MFA is required
    if (user.mfaEnabled && user.mfaSecretEnc) {
      const mfaPendingToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role, mfaPending: true },
        { secret: env.JWT_ACCESS_SECRET, expiresIn: '5m' },
      );
      return {
        mfaRequired: true,
        mfaPendingToken,
      };
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = this.buildSessionPayload(user, displayName);
    const { accessToken, refreshToken } = await this.issueTokenPair(payload, ip, userAgent);

    return {
      mfaRequired: false,
      accessToken,
      refreshToken,
      user: payload,
    };
  }

  // ---------------------------------------------------------------------------
  // MFA
  // ---------------------------------------------------------------------------

  async enrollMfa(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.mfaEnabled) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'MFA is already enabled on this account',
      });
    }

    const secret = otp.generateSecret();
    const encryptedSecret = encryptSecret(secret, env.CLINICAL_ENCRYPTION_KEY);

    // Store encrypted secret (not yet enabled until verified)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecretEnc: encryptedSecret },
    });

    const otpAuthUrl = otp.generateURI({
      issuer: 'DocTALK',
      label: user.email,
      secret,
    });

    this.logger.log(`[Auth] MFA enrollment initiated for ${user.email}`);

    return {
      secret,
      otpAuthUrl,
      message: 'Scan the QR code with your authenticator app, then verify with a code.',
    };
  }

  async confirmMfaEnrollment(userId: string, totpCode: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!user.mfaSecretEnc) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'MFA enrollment has not been initiated',
      });
    }

    const secret = decryptSecret(user.mfaSecretEnc, env.CLINICAL_ENCRYPTION_KEY);
    const result = otp.verifySync({
      token: totpCode,
      secret,
      epochTolerance: MFA_WINDOW * 30,
    });

    if (!result.valid) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_MFA_INVALID,
        message: 'Invalid verification code. Please try again.',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        actorRole: user.role,
        action: 'MFA_ENROLLED',
        resourceType: 'USER',
        resourceId: userId,
      },
    });

    this.logger.log(`[Auth] MFA enrolled successfully for ${user.email}`);

    return { message: 'MFA has been enabled successfully' };
  }

  async verifyMfa(input: MfaVerifyInput, ip?: string, userAgent?: string) {
    let pendingPayload: any;
    try {
      pendingPayload = await this.jwtService.verifyAsync(input.mfaPendingToken, {
        secret: env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_TOKEN_EXPIRED,
        message: 'MFA session has expired. Please login again.',
      });
    }

    if (!pendingPayload.mfaPending) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Invalid MFA verification request',
      });
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: pendingPayload.sub },
      include: { doctorProfile: { select: { displayName: true } }, patientProfile: { select: { fullName: true } } },
    });

    if (!user.mfaSecretEnc) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'MFA is not configured for this account',
      });
    }

    const secret = decryptSecret(user.mfaSecretEnc, env.CLINICAL_ENCRYPTION_KEY);
    const result = otp.verifySync({
      token: input.totpCode,
      secret,
      epochTolerance: MFA_WINDOW * 30,
    });

    if (!result.valid) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_MFA_INVALID,
        message: 'Invalid verification code',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const displayName =
      user.doctorProfile?.displayName ||
      user.patientProfile?.fullName ||
      user.email.split('@')[0];

    const payload = this.buildSessionPayload(user, displayName);
    const { accessToken, refreshToken } = await this.issueTokenPair(payload, ip, userAgent);

    return {
      mfaRequired: false,
      accessToken,
      refreshToken,
      user: payload,
    };
  }

  // ---------------------------------------------------------------------------
  // Email Verification
  // ---------------------------------------------------------------------------

  async verifyEmail(token: string) {
    const tokenHashValue = hashToken(token);

    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: tokenHashValue },
    });

    if (!record) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Invalid or expired verification link',
      });
    }

    if (record.consumedAt) {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'This verification link has already been used',
      });
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: ErrorCodes.AUTH_TOKEN_EXPIRED,
        message: 'This verification link has expired. Please request a new one.',
      });
    }

    if (record.type !== 'EMAIL_VERIFICATION') {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Invalid verification link',
      });
    }

    // Consume token and verify user atomically
    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    this.logger.log(`[Auth] Email verified for user ${record.userId}`);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    const verifyToken = generateSecureToken();
    await this.prisma.verificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(verifyToken),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 3600 * 1000),
      },
    });

    await this.emailProvider.send(user.email, 'Verify your DocTALK account', 'email-verification', {
      name: user.email.split('@')[0],
      verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${verifyToken}`,
      expiryHours: EMAIL_VERIFY_EXPIRY_HOURS,
    });

    return { message: 'Verification email has been sent' };
  }

  // ---------------------------------------------------------------------------
  // Password Reset
  // ---------------------------------------------------------------------------

  async requestPasswordReset(email: string) {
    const emailKey = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: emailKey } });

    // Always return the same response — do not reveal if account exists
    const response = { message: 'If an account with that email exists, a password reset link has been sent.' };

    if (!user) return response;

    const resetToken = generateSecureToken();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(resetToken),
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 3600 * 1000),
      },
    });

    this.emailProvider
      .send(emailKey, 'DocTALK — Password Reset Request', 'password-reset', {
        name: emailKey.split('@')[0],
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`,
        expiryHours: PASSWORD_RESET_EXPIRY_HOURS,
      })
      .catch((err) => this.logger.warn(`Failed to send password reset email: ${err.message}`));

    return response;
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    const tokenHashValue = hashToken(token);

    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: tokenHashValue },
    });

    if (!record || record.consumedAt || record.expiresAt < new Date() || record.type !== 'PASSWORD_RESET') {
      throw new BadRequestException({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Invalid or expired password reset link',
      });
    }

    const passwordHashed = await hashPassword(newPassword);

    // Consume token, update password, and revoke all sessions atomically
    await this.prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });

      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash: passwordHashed },
      });

      // Revoke all refresh tokens — force re-login everywhere
      await tx.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    this.logger.log(`[Auth] Password reset completed for user ${record.userId}`);

    return { message: 'Password has been reset successfully. Please login with your new password.' };
  }

  // ---------------------------------------------------------------------------
  // Refresh Token Rotation
  // ---------------------------------------------------------------------------

  async refreshSession(refreshTokenRaw: string, ip?: string, userAgent?: string) {
    const tokenHashValue = hashToken(refreshTokenRaw);

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: tokenHashValue },
      include: {
        user: {
          include: {
            doctorProfile: { select: { displayName: true } },
            patientProfile: { select: { fullName: true } },
          },
        },
      },
    });

    if (!stored) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_TOKEN_EXPIRED,
        message: 'Invalid refresh token',
      });
    }

    // Reuse detection: if this token was already revoked, revoke the entire family
    if (stored.revokedAt) {
      this.logger.warn(`[Auth] Refresh token reuse detected for family ${stored.familyId}. Revoking entire family.`);
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_TOKEN_REVOKED,
        message: 'Session has been revoked for security. Please login again.',
      });
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_TOKEN_EXPIRED,
        message: 'Refresh token has expired. Please login again.',
      });
    }

    const user = stored.user;

    // Enforce account status on refresh
    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      });
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'Your account is no longer active',
      });
    }

    // Rotate: revoke old token, issue new one in the same family
    const newRefreshTokenRaw = generateSecureToken();
    const newRefreshTokenHash = hashToken(newRefreshTokenRaw);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newRefreshTokenHash,
          familyId: stored.familyId, // Same family for reuse detection
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 3600 * 1000),
          ip: ip || null,
          userAgent: userAgent || null,
        },
      }),
    ]);

    const displayName =
      user.doctorProfile?.displayName ||
      user.patientProfile?.fullName ||
      user.email.split('@')[0];

    const payload = this.buildSessionPayload(user, displayName);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });

    return {
      accessToken,
      refreshToken: newRefreshTokenRaw,
      user: payload,
    };
  }

  // ---------------------------------------------------------------------------
  // Logout / Session Revocation
  // ---------------------------------------------------------------------------

  async logout(userId: string, refreshTokenRaw?: string) {
    if (refreshTokenRaw) {
      // Revoke the specific token family
      const tokenHashValue = hashToken(refreshTokenRaw);
      const stored = await this.prisma.refreshToken.findFirst({
        where: { tokenHash: tokenHashValue },
      });
      if (stored) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: stored.familyId },
          data: { revokedAt: new Date() },
        });
      }
    } else {
      // Revoke all sessions for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  // ---------------------------------------------------------------------------
  // Get Current User
  // ---------------------------------------------------------------------------

  async getMe(userId: string): Promise<UserSessionPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: { select: { displayName: true, status: true } },
        patientProfile: { select: { fullName: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_UNAUTHORIZED,
        message: 'User session not found',
      });
    }

    const displayName =
      user.doctorProfile?.displayName ||
      user.patientProfile?.fullName ||
      user.email.split('@')[0];

    return this.buildSessionPayload(user, displayName);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildSessionPayload(
    user: { id: string; email: string; role: any; emailVerifiedAt?: Date | null },
    displayName: string,
  ): UserSessionPayload {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      displayName,
      isVerified: !!user.emailVerifiedAt,
    };
  }

  private async issueTokenPair(
    payload: UserSessionPayload,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });

    const refreshTokenRaw = generateSecureToken();
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const familyId = randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.id,
        tokenHash: refreshTokenHash,
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 3600 * 1000),
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  async verifyAccessToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token, {
      secret: env.JWT_ACCESS_SECRET,
    });
  }
}
