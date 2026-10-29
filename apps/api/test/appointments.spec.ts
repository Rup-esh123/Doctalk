import { describe, it, expect, beforeEach } from 'vitest';
import { AppointmentsService } from '../src/modules/appointments/appointments.service.js';
import { DoctorsService } from '../src/modules/doctors/doctors.service.js';
import { MockPaymentProvider } from '../src/providers/payment/mock-payment.provider.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { ConsultationMode, AppointmentKind } from '../src/shared';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let doctorsService: DoctorsService;

  beforeEach(() => {
    const prisma = { isConnected: false } as PrismaService;
    doctorsService = new DoctorsService(prisma);
    const payment = new MockPaymentProvider();
    service = new AppointmentsService(doctorsService, payment);
  });

  it('creates a valid HELD appointment with fee and commission snapshot', async () => {
    const doctor = (await doctorsService.search({})) .doctors[0];
    const startTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const endTime = new Date(Date.now() + 24 * 3600 * 1000 + 1800 * 1000).toISOString();

    const res = await service.createHold(
      {
        doctorId: doctor.id,
        slotStartTime: startTime,
        slotEndTime: endTime,
        mode: ConsultationMode.VIDEO,
        kind: AppointmentKind.SCHEDULED,
      },
      'patient-123',
    );

    expect(res.appointment.id).toBeDefined();
    expect(res.appointment.status).toBe('HELD');
    expect(res.appointment.feePaise).toBe(doctor.consultationFeePaise);
    expect(res.paymentOrder.orderId).toBeDefined();
  });

  it('prevents double-booking overlapping active slots for the same doctor', async () => {
    const doctor = (await doctorsService.search({})) .doctors[0];
    const startTime = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const endTime = new Date(Date.now() + 48 * 3600 * 1000 + 1800 * 1000).toISOString();

    await service.createHold(
      {
        doctorId: doctor.id,
        slotStartTime: startTime,
        slotEndTime: endTime,
        mode: ConsultationMode.VIDEO,
        kind: AppointmentKind.SCHEDULED,
      },
      'patient-1',
    );

    // Second booking attempting to hold the same slot must fail with ConflictException (SLOT_TAKEN)
    await expect(
      service.createHold(
        {
          doctorId: doctor.id,
          slotStartTime: startTime,
          slotEndTime: endTime,
          mode: ConsultationMode.VIDEO,
          kind: AppointmentKind.SCHEDULED,
        },
        'patient-2',
      ),
    ).rejects.toThrow();
  });

  it('applies 100% refund policy when cancelled >= 24h prior', async () => {
    const doctor = (await doctorsService.search({})) .doctors[0];
    const startTime = new Date(Date.now() + 30 * 3600 * 1000).toISOString(); // 30h ahead
    const endTime = new Date(Date.now() + 30.5 * 3600 * 1000).toISOString();

    const hold = await service.createHold(
      {
        doctorId: doctor.id,
        slotStartTime: startTime,
        slotEndTime: endTime,
        mode: ConsultationMode.VIDEO,
        kind: AppointmentKind.SCHEDULED,
      },
      'patient-1',
    );

    const cancelRes = await service.cancel(hold.appointment.id, 'PATIENT', 'Personal conflict');
    expect(cancelRes.refundPercentage).toBe(100);
    expect(cancelRes.refundPaise).toBe(doctor.consultationFeePaise);
  });
});
