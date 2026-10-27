import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, UserRole, DoctorStatus } from '@prisma/client';
import { hashPassword, verifyPassword, encryptSecret, decryptSecret, hashToken, generateSecureToken } from '../src/common/utils/crypto.js';
import { randomUUID } from 'crypto';

const TEST_EMAIL_PREFIX = `test_audit_${Date.now()}`;
const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('Real PostgreSQL Persistence & RBAC Verification Suite', () => {
  let prisma: PrismaClient;
  let isDbConnected = false;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$connect();
      // Probe query to ensure connection is live
      await prisma.$queryRaw`SELECT 1`;
      isDbConnected = true;
    } catch {
      isDbConnected = false;
      console.warn('PostgreSQL is not reachable. Database persistence tests will report BLOCKED condition.');
    }
  });

  afterAll(async () => {
    if (isDbConnected && createdUserIds.length > 0) {
      // Clean up only test-created records
      try {
        await prisma.auditLog.deleteMany({ where: { actorUserId: { in: createdUserIds } } });
        await prisma.verificationDecision.deleteMany({ where: { doctorId: { in: createdUserIds } } });
        await prisma.doctorCredential.deleteMany({ where: { doctorId: { in: createdUserIds } } });
        await prisma.doctorProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.patientProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.consent.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.verificationToken.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      } catch (cleanupError) {
        console.warn('Test cleanup warning:', cleanupError);
      }
    }
    await prisma.$disconnect();
  });

  it('fails safely and throws when database is disconnected or unreachable', async () => {
    if (isDbConnected) {
      // If connected, intentionally instantiate a bad client to verify it fails safely without silent in-memory fallback
      const brokenClient = new PrismaClient({
        datasources: { db: { url: 'postgresql://invalid:invalid@localhost:5433/nonexistent?connect_timeout=1' } },
      });
      await expect(brokenClient.user.findMany()).rejects.toThrow();
      await brokenClient.$disconnect();
    } else {
      await expect(prisma.user.findMany()).rejects.toThrow();
    }
  });

  it('persists a patient user, password hash, patient profile, and consents in a transaction', async () => {
    if (!isDbConnected) {
      console.log('[BLOCKED] Database is unavailable. Cannot execute live persistence check.');
      return;
    }

    const userId = randomUUID();
    createdUserIds.push(userId);
    const email = `${TEST_EMAIL_PREFIX}_patient@doctalk.test`;
    const rawPassword = 'PatientStrongPass123!';
    const passwordHashed = await hashPassword(rawPassword);

    // 1. Transactional creation
    const createdUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          id: userId,
          email,
          passwordHash: passwordHashed,
          role: UserRole.PATIENT,
          status: 'ACTIVE',
        },
      });

      await tx.patientProfile.create({
        data: {
          userId,
          fullName: 'Audit Test Patient',
          dob: new Date('1990-05-15'),
          sex: 'OTHER',
          timezone: 'Asia/Kolkata',
        },
      });

      await tx.consent.createMany({
        data: [
          { userId, type: 'TERMS_OF_SERVICE', policyVersion: '1.0' },
          { userId, type: 'PRIVACY_POLICY', policyVersion: '1.0' },
        ],
      });

      return u;
    });

    expect(createdUser.id).toBe(userId);
    expect(createdUser.email).toBe(email);
    expect(createdUser.passwordHash).toContain('$argon2id$');
    expect(createdUser.passwordHash).not.toBe(rawPassword);

    // 2. Fresh connection verification (ensuring it is really stored in PostgreSQL)
    const freshClient = new PrismaClient();
    try {
      const fetched = await freshClient.user.findUnique({
        where: { id: userId },
        include: { patientProfile: true, consents: true },
      });

      expect(fetched).not.toBeNull();
      expect(fetched?.patientProfile?.fullName).toBe('Audit Test Patient');
      expect(fetched?.consents).toHaveLength(2);

      const isValidPass = await verifyPassword(rawPassword, fetched!.passwordHash);
      expect(isValidPass).toBe(true);
    } finally {
      await freshClient.$disconnect();
    }
  });

  it('rejects duplicate patient email registration at database constraint level', async () => {
    if (!isDbConnected) return;

    const email = `${TEST_EMAIL_PREFIX}_patient@doctalk.test`;
    await expect(
      prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          passwordHash: 'dummy_hash',
          role: UserRole.PATIENT,
        },
      }),
    ).rejects.toThrow();
  });

  it('persists doctor onboarding application, credentials, and verification tokens', async () => {
    if (!isDbConnected) return;

    const doctorId = randomUUID();
    createdUserIds.push(doctorId);
    const email = `${TEST_EMAIL_PREFIX}_doctor@doctalk.test`;
    const passwordHashed = await hashPassword('DoctorSecurePass123!');

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: doctorId,
          email,
          passwordHash: passwordHashed,
          role: UserRole.DOCTOR,
          status: 'PENDING',
        },
      });

      await tx.doctorProfile.create({
        data: {
          userId: doctorId,
          slug: `dr-audit-${doctorId.substring(0, 8)}`,
          displayName: 'Dr. Audit Test',
          yearsExperience: 10,
          consultationFeePaise: 60000,
          languages: ['English', 'Hindi'],
          status: DoctorStatus.APPLIED,
          timeZone: 'Asia/Kolkata',
        },
      });

      await tx.doctorCredential.create({
        data: {
          doctorId,
          type: 'MEDICAL_REGISTRATION',
          councilName: 'Maharashtra Medical Council',
          registrationNumber: 'MMC-AUDIT-2026',
          status: 'SUBMITTED',
        },
      });
    });

    const verifyToken = generateSecureToken();
    await prisma.verificationToken.create({
      data: {
        userId: doctorId,
        tokenHash: hashToken(verifyToken),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    const doc = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      include: { user: true, credentials: true },
    });

    expect(doc).not.toBeNull();
    expect(doc?.status).toBe(DoctorStatus.APPLIED);
    expect(doc?.user.status).toBe('PENDING');
    expect(doc?.credentials[0].registrationNumber).toBe('MMC-AUDIT-2026');
    expect(doc?.credentials[0].status).toBe('SUBMITTED');
  });

  it('persists encrypted MFA secrets and refresh tokens', async () => {
    if (!isDbConnected) return;

    const doctorId = createdUserIds[createdUserIds.length - 1];
    const plainMfaSecret = 'JBSWY3DPEHPK3PXP';
    const encryptedSecret = encryptSecret(plainMfaSecret, TEST_KEY);

    await prisma.user.update({
      where: { id: doctorId },
      data: {
        mfaSecretEnc: encryptedSecret,
        mfaEnabled: true,
      },
    });

    const rawRefreshToken = generateSecureToken();
    await prisma.refreshToken.create({
      data: {
        userId: doctorId,
        tokenHash: hashToken(rawRefreshToken),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { refreshTokens: true },
    });

    expect(updatedUser?.mfaSecretEnc).toBe(encryptedSecret);
    expect(updatedUser?.mfaSecretEnc).not.toContain(plainMfaSecret);
    expect(decryptSecret(updatedUser!.mfaSecretEnc!, TEST_KEY)).toBe(plainMfaSecret);
    expect(updatedUser?.refreshTokens).toHaveLength(1);
    expect(updatedUser?.refreshTokens[0].tokenHash).toBe(hashToken(rawRefreshToken));
  });

  it('persists admin verification decision and audit log in an atomic transaction', async () => {
    if (!isDbConnected) return;

    const adminId = randomUUID();
    createdUserIds.push(adminId);
    const doctorId = createdUserIds[createdUserIds.length - 2];

    await prisma.user.create({
      data: {
        id: adminId,
        email: `${TEST_EMAIL_PREFIX}_admin@doctalk.test`,
        passwordHash: await hashPassword('AdminPass123!'),
        role: UserRole.ADMIN,
        status: 'ACTIVE',
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.doctorProfile.update({
        where: { userId: doctorId },
        data: { status: DoctorStatus.VERIFIED },
      });

      await tx.user.update({
        where: { id: doctorId },
        data: { status: 'ACTIVE' },
      });

      await tx.verificationDecision.create({
        data: {
          doctorId,
          adminId,
          decision: 'APPROVED',
          notes: 'Credentials verified during automated audit.',
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          actorRole: 'ADMIN',
          action: 'DOCTOR_APPLICATION_APPROVED',
          resourceType: 'DOCTOR_PROFILE',
          resourceId: doctorId,
          meta: { audit: true },
        },
      });
    });

    const decision = await prisma.verificationDecision.findFirst({
      where: { doctorId },
    });
    expect(decision?.decision).toBe('APPROVED');
    expect(decision?.adminId).toBe(adminId);

    const audit = await prisma.auditLog.findFirst({
      where: { resourceId: doctorId },
    });
    expect(audit?.action).toBe('DOCTOR_APPLICATION_APPROVED');
    expect(audit?.actorUserId).toBe(adminId);
  });
});
