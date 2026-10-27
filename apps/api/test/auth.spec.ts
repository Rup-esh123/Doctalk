import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  encryptSecret,
  decryptSecret,
  timingSafeStringEqual,
} from '../src/common/utils/crypto.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { AdminService } from '../src/modules/admin/admin.service.js';
import { OTP } from 'otplib';
import { UserRole, DoctorStatus } from '@doctalk/shared';

describe('P1 Identity & Authentication Suite', () => {
  describe('Cryptographic Utilities', () => {
    it('hashes passwords using Argon2id and verifies correctly', async () => {
      const password = 'StrongPassword123!';
      const hash = await hashPassword(password);
      expect(hash).toContain('$argon2id$');

      const isMatch = await verifyPassword(password, hash);
      expect(isMatch).toBe(true);

      const isNotMatch = await verifyPassword('WrongPassword123!', hash);
      expect(isNotMatch).toBe(false);
    });

    it('encrypts and decrypts secrets with AES-256-GCM', () => {
      const keyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const secret = 'JBSWY3DPEHPK3PXP';
      const encrypted = encryptSecret(secret, keyHex);

      expect(encrypted).not.toEqual(secret);
      expect(encrypted.split(':')).toHaveLength(3); // iv:tag:data

      const decrypted = decryptSecret(encrypted, keyHex);
      expect(decrypted).toEqual(secret);
    });

    it('computes deterministic SHA-256 token hashes', () => {
      const token = 'sample_secure_random_token_123';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toHaveLength(64);
      expect(hash1).toEqual(hash2);
      expect(hashToken('different_token')).not.toEqual(hash1);
    });

    it('timingSafeStringEqual correctly compares equal and non-equal strings', () => {
      expect(timingSafeStringEqual('my-token-12345', 'my-token-12345')).toBe(true);
      expect(timingSafeStringEqual('my-token-12345', 'my-token-wrong')).toBe(false);
      expect(timingSafeStringEqual('short', 'longer_string')).toBe(false);
    });
  });

  describe('TOTP MFA Behavior', () => {
    it('generates secrets and verifies valid TOTP tokens within time window', () => {
      const otp = new OTP({ strategy: 'totp' });
      const secret = otp.generateSecret();
      expect(secret).toBeTruthy();

      const token = otp.generateSync({ secret });
      const verification = otp.verifySync({ secret, token, epochTolerance: 30 });
      expect(verification.valid).toBe(true);

      const invalidVerification = otp.verifySync({ secret, token: '000000', epochTolerance: 30 });
      expect(invalidVerification.valid).toBe(false);
    });
  });

  describe('Admin Application Verification & RBAC Guardrails', () => {
    let mockPrisma: any;
    let mockEmailProvider: any;
    let adminService: AdminService;

    beforeEach(() => {
      mockPrisma = {
        doctorProfile: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
          update: vi.fn(),
        },
        user: {
          update: vi.fn(),
        },
        doctorCredential: {
          updateMany: vi.fn(),
        },
        verificationDecision: {
          create: vi.fn(),
          findMany: vi.fn(),
        },
        auditLog: {
          create: vi.fn(),
        },
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      };

      mockEmailProvider = {
        send: vi.fn().mockResolvedValue(undefined),
      };

      adminService = new AdminService(mockPrisma, mockEmailProvider);
    });

    it('strictly prevents admin from approving their own doctor application', async () => {
      const sameId = 'user_admin_doctor_123';
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({
        userId: sameId,
        displayName: 'Dr. Admin',
        status: DoctorStatus.APPLIED,
        user: { email: 'admin@doctalk.local', id: sameId },
      });

      await expect(
        adminService.approveApplication(sameId, sameId, 'Approving self'),
      ).rejects.toThrow(/You cannot approve your own application/);
    });

    it('strictly prevents admin from rejecting their own doctor application', async () => {
      const sameId = 'user_admin_doctor_123';
      mockPrisma.doctorProfile.findUnique.mockResolvedValue({
        userId: sameId,
        displayName: 'Dr. Admin',
        status: DoctorStatus.APPLIED,
        user: { email: 'admin@doctalk.local' },
      });

      await expect(
        adminService.rejectApplication(sameId, sameId, 'Self reject'),
      ).rejects.toThrow(/You cannot reject your own application/);
    });

    it('records an audit log and transitions status on successful doctor approval', async () => {
      const doctorId = 'doctor_456';
      const adminId = 'admin_789';

      mockPrisma.doctorProfile.findUnique.mockResolvedValue({
        userId: doctorId,
        displayName: 'Dr. Verified',
        status: DoctorStatus.APPLIED,
        user: { email: 'doctor@doctalk.local', id: doctorId },
      });

      const res = await adminService.approveApplication(doctorId, adminId, 'Credentials verified against NMC registry');
      expect(res.message).toContain('approved successfully');

      expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: doctorId },
          data: { status: 'VERIFIED' },
        }),
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorUserId: adminId,
            actorRole: 'ADMIN',
            action: 'DOCTOR_APPLICATION_APPROVED',
            resourceType: 'DOCTOR_PROFILE',
            resourceId: doctorId,
          }),
        }),
      );

      expect(mockEmailProvider.send).toHaveBeenCalled();
    });
  });
});
