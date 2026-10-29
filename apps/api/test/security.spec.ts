import { describe, it, expect, beforeEach } from 'vitest';
import { envSchema } from '../src/config/env.js';
import { AppointmentsController } from '../src/modules/appointments/appointments.controller.js';
import { AppointmentsService } from '../src/modules/appointments/appointments.service.js';
import { DoctorsService } from '../src/modules/doctors/doctors.service.js';
import { MockPaymentProvider } from '../src/providers/payment/mock-payment.provider.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { ConsultationMode, AppointmentKind, UserRole } from '../src/shared';

describe('Security & Authorization Regression Suite', () => {
  describe('Production Environment Guardrails', () => {
    it('fails validation if production starts with development JWT secret', () => {
      const res = envSchema.safeParse({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'development_jwt_access_secret_key_minimum_length_32_chars!',
        JWT_REFRESH_SECRET: 'a_very_secure_random_key_that_is_32_characters_long_12345',
        CLINICAL_ENCRYPTION_KEY: 'a'.repeat(64),
        PAYMENT_PROVIDER: 'razorpay',
        VIDEO_PROVIDER: 'livekit',
        STORAGE_PROVIDER: 's3',
        EMAIL_PROVIDER: 'resend',
        RAZORPAY_KEY_ID: 'rzp_live_real_id',
        RAZORPAY_KEY_SECRET: 'real_secret_key',
        RAZORPAY_WEBHOOK_SECRET: 'real_webhook_secret',
      });
      expect(res.success).toBe(false);
    });

    it('fails validation if production uses mock payment or video providers', () => {
      const res = envSchema.safeParse({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'super_secret_production_key_123456789012345',
        JWT_REFRESH_SECRET: 'super_secret_refresh_key_123456789012345',
        CLINICAL_ENCRYPTION_KEY: 'b'.repeat(64),
        PAYMENT_PROVIDER: 'mock', // Illegal in production!
        VIDEO_PROVIDER: 'livekit',
        STORAGE_PROVIDER: 's3',
        EMAIL_PROVIDER: 'resend',
        RAZORPAY_KEY_ID: 'rzp_live_real_id',
        RAZORPAY_KEY_SECRET: 'real_secret_key',
        RAZORPAY_WEBHOOK_SECRET: 'real_webhook_secret',
      });
      expect(res.success).toBe(false);
    });

    it('fails validation if clinical encryption key is the default placeholder in production', () => {
      const res = envSchema.safeParse({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'super_secret_production_key_123456789012345',
        JWT_REFRESH_SECRET: 'super_secret_refresh_key_123456789012345',
        CLINICAL_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // Default!
        PAYMENT_PROVIDER: 'razorpay',
        VIDEO_PROVIDER: 'livekit',
        STORAGE_PROVIDER: 's3',
        EMAIL_PROVIDER: 'resend',
        RAZORPAY_KEY_ID: 'rzp_live_real_id',
        RAZORPAY_KEY_SECRET: 'real_secret_key',
        RAZORPAY_WEBHOOK_SECRET: 'real_webhook_secret',
      });
      expect(res.success).toBe(false);
    });

    it('passes validation when production has genuine, non-default configuration', () => {
      const res = envSchema.safeParse({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'prod_jwt_access_secret_key_random_and_secure_32ch',
        JWT_REFRESH_SECRET: 'prod_jwt_refresh_secret_key_random_and_secure_32c',
        CLINICAL_ENCRYPTION_KEY: 'c'.repeat(64),
        PAYMENT_PROVIDER: 'razorpay',
        VIDEO_PROVIDER: 'livekit',
        STORAGE_PROVIDER: 's3',
        EMAIL_PROVIDER: 'resend',
        RAZORPAY_KEY_ID: 'rzp_live_genuine_id',
        RAZORPAY_KEY_SECRET: 'genuine_secret_key',
        RAZORPAY_WEBHOOK_SECRET: 'genuine_webhook_secret',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('Appointments Endpoint Authorization', () => {
    let controller: AppointmentsController;
    let appointmentsService: AppointmentsService;
    let doctorsService: DoctorsService;

    beforeEach(() => {
      const prisma = { isConnected: false } as PrismaService;
      doctorsService = new DoctorsService(prisma);
      const payment = new MockPaymentProvider();
      appointmentsService = new AppointmentsService(doctorsService, payment);
      controller = new AppointmentsController(appointmentsService);
    });

    it('rejects unauthenticated appointment creation (no hardcoded fallback)', async () => {
      const doctor = (await doctorsService.search({})).doctors[0];
      const payload = {
        doctorId: doctor.id,
        slotStartTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        slotEndTime: new Date(Date.now() + 24 * 3600 * 1000 + 1800 * 1000).toISOString(),
        mode: ConsultationMode.VIDEO,
        kind: AppointmentKind.SCHEDULED,
      };

      // Missing req.user
      await expect(controller.createHold(payload, undefined, {} as any)).rejects.toThrow();
    });

    it('prevents unauthorized users from reading another patient\'s appointment', async () => {
      const doctor = (await doctorsService.search({})).doctors[0];
      const startTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const endTime = new Date(Date.now() + 24 * 3600 * 1000 + 1800 * 1000).toISOString();

      const hold = await appointmentsService.createHold(
        {
          doctorId: doctor.id,
          slotStartTime: startTime,
          slotEndTime: endTime,
          mode: ConsultationMode.VIDEO,
          kind: AppointmentKind.SCHEDULED,
        },
        'patient-alice',
      );

      // Patient Bob attempts to read Alice's appointment
      const reqBob = {
        user: { id: 'patient-bob', role: UserRole.PATIENT },
      } as any;

      await expect(controller.getById(hold.appointment.id, reqBob)).rejects.toThrow();

      // Alice herself can read it
      const reqAlice = {
        user: { id: 'patient-alice', role: UserRole.PATIENT },
      } as any;
      const readAlice = await controller.getById(hold.appointment.id, reqAlice);
      expect(readAlice.id).toBe(hold.appointment.id);

      // System administrator can read it
      const reqAdmin = {
        user: { id: 'admin-1', role: UserRole.ADMIN },
      } as any;
      const readAdmin = await controller.getById(hold.appointment.id, reqAdmin);
      expect(readAdmin.id).toBe(hold.appointment.id);
    });

    it('prevents unauthorized users from cancelling another patient\'s appointment', async () => {
      const doctor = (await doctorsService.search({})).doctors[0];
      const startTime = new Date(Date.now() + 30 * 3600 * 1000).toISOString();
      const endTime = new Date(Date.now() + 30.5 * 3600 * 1000).toISOString();

      const hold = await appointmentsService.createHold(
        {
          doctorId: doctor.id,
          slotStartTime: startTime,
          slotEndTime: endTime,
          mode: ConsultationMode.VIDEO,
          kind: AppointmentKind.SCHEDULED,
        },
        'patient-alice',
      );

      // Patient Bob attempts to cancel Alice's appointment
      const reqBob = {
        user: { id: 'patient-bob', role: UserRole.PATIENT },
      } as any;

      await expect(
        controller.cancel(hold.appointment.id, { reason: 'Unauthorized cancellation' }, reqBob),
      ).rejects.toThrow();
    });
  });
});
