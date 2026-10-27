import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentsService } from '../src/modules/payments/payments.service.js';
import { AppointmentsService } from '../src/modules/appointments/appointments.service.js';
import { DoctorsService } from '../src/modules/doctors/doctors.service.js';
import { MockPaymentProvider } from '../src/providers/payment/mock-payment.provider.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { env } from '../src/config/env.js';
import { createHmac } from 'crypto';
import { ConsultationMode, AppointmentKind, AppointmentStatus } from '@doctalk/shared';

describe('Payment Webhook Verification & Processing', () => {
  let paymentsService: PaymentsService;
  let appointmentsService: AppointmentsService;
  let doctorsService: DoctorsService;
  let mockPaymentProvider: MockPaymentProvider;

  beforeEach(() => {
    const prisma = { isConnected: false } as PrismaService;
    doctorsService = new DoctorsService(prisma);
    mockPaymentProvider = new MockPaymentProvider();
    appointmentsService = new AppointmentsService(doctorsService, mockPaymentProvider);
    paymentsService = new PaymentsService(mockPaymentProvider, appointmentsService);
  });

  function generateValidSignature(payload: string): string {
    return createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
  }

  it('rejects webhooks with missing signature or empty payload', () => {
    expect(mockPaymentProvider.verifyWebhookSignature('', '')).toBe(false);
    expect(mockPaymentProvider.verifyWebhookSignature('{"foo":"bar"}', '')).toBe(false);
    expect(mockPaymentProvider.verifyWebhookSignature('', 'some-signature')).toBe(false);
  });

  it('rejects webhooks with previously bypassed signature "test-signature"', () => {
    const payload = JSON.stringify({ event: 'payment.captured' });
    expect(mockPaymentProvider.verifyWebhookSignature(payload, 'test-signature')).toBe(false);
  });

  it('rejects webhooks with invalid or forged HMAC signature', async () => {
    const payload = JSON.stringify({ event: 'payment.captured', id: 'evt_invalid_1' });
    const forgedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    await expect(
      paymentsService.handleRazorpayWebhook(payload, forgedSignature, JSON.parse(payload)),
    ).rejects.toThrow();
  });

  it('accepts webhooks with valid HMAC-SHA256 signature and confirms appointment', async () => {
    // 1. Create a held appointment
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
      'patient-verified-1',
    );

    const apptId = hold.appointment.id;

    // 2. Build payment captured webhook payload
    const webhookData = {
      event: 'payment.captured',
      id: `evt_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: `pay_${Date.now()}`,
            amount: doctor.consultationFeePaise,
            status: 'captured',
            notes: {
              appointmentId: apptId,
            },
          },
        },
      },
    };

    const rawPayload = JSON.stringify(webhookData);
    const validSignature = generateValidSignature(rawPayload);

    // 3. Process webhook
    const result = await paymentsService.handleRazorpayWebhook(rawPayload, validSignature, webhookData);
    expect(result.status).toBe('processed');

    // 4. Verify appointment is now CONFIRMED
    const updatedAppt = await appointmentsService.getById(apptId);
    expect(updatedAppt.status).toBe(AppointmentStatus.CONFIRMED);
  });

  it('enforces idempotency on duplicate webhook deliveries', async () => {
    const eventId = `evt_idempotent_${Date.now()}`;
    const webhookData = {
      event: 'payment.captured',
      id: eventId,
      payload: {
        payment: {
          entity: {
            id: 'pay_idem_1',
            amount: 50000,
            status: 'captured',
            notes: {},
          },
        },
      },
    };

    const rawPayload = JSON.stringify(webhookData);
    const validSignature = generateValidSignature(rawPayload);

    // First delivery processes
    const res1 = await paymentsService.handleRazorpayWebhook(rawPayload, validSignature, webhookData);
    expect(res1.status).toBe('processed');

    // Second delivery with same eventId must return already_processed without re-executing
    const res2 = await paymentsService.handleRazorpayWebhook(rawPayload, validSignature, webhookData);
    expect(res2.status).toBe('already_processed');
  });

  it('rejects confirmation if payment status is not captured', async () => {
    const doctor = (await doctorsService.search({})).doctors[0];
    const startTime = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const endTime = new Date(Date.now() + 48 * 3600 * 1000 + 1800 * 1000).toISOString();

    const hold = await appointmentsService.createHold(
      {
        doctorId: doctor.id,
        slotStartTime: startTime,
        slotEndTime: endTime,
        mode: ConsultationMode.VIDEO,
        kind: AppointmentKind.SCHEDULED,
      },
      'patient-1',
    );

    const webhookData = {
      event: 'payment.captured',
      id: `evt_failed_status_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: 'pay_failed_1',
            amount: doctor.consultationFeePaise,
            status: 'failed', // Not captured!
            notes: {
              appointmentId: hold.appointment.id,
            },
          },
        },
      },
    };

    const rawPayload = JSON.stringify(webhookData);
    const validSignature = generateValidSignature(rawPayload);

    await expect(
      paymentsService.handleRazorpayWebhook(rawPayload, validSignature, webhookData),
    ).rejects.toThrow();
  });
});
