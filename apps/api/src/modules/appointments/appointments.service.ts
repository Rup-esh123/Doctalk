import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  AppointmentStatus,
  ConsultationMode,
  AppointmentKind,
  ErrorCodes,
  CreateAppointmentInput,
  canTransitionAppointment,
  calculateCommission,
  paiseToRupees,
} from '@doctalk/shared';
import { DoctorsService } from '../doctors/doctors.service.js';
import { PAYMENT_PROVIDER_TOKEN, PaymentProvider } from '../../providers/payment/payment.provider.interface.js';
import { randomUUID } from 'crypto';

export interface StoredAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  mode: ConsultationMode;
  kind: AppointmentKind;
  startTime: string; // ISO
  endTime: string;   // ISO
  status: AppointmentStatus;
  feePaise: number;
  platformFeePaise: number;
  commissionBpsSnapshot: number;
  cancelPolicyVersion: string;
  holdExpiresAt: string;
  patientSymptoms?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private appointments: Map<string, StoredAppointment> = new Map();
  private idempotencyStore: Map<string, any> = new Map();

  constructor(
    private readonly doctorsService: DoctorsService,
    @Inject(PAYMENT_PROVIDER_TOKEN) private readonly paymentProvider: PaymentProvider,
  ) {}

  async createHold(
    input: CreateAppointmentInput,
    patientId: string,
    idempotencyKey?: string,
  ) {
    // 1. Idempotency check
    if (idempotencyKey && this.idempotencyStore.has(idempotencyKey)) {
      this.logger.log(`[Appointments] Idempotent replay for key: ${idempotencyKey}`);
      return this.idempotencyStore.get(idempotencyKey);
    }

    // 2. Doctor verification check (D-006)
    const doctor = await this.doctorsService.getBySlugOrId(input.doctorId);

    // 3. Double-booking check: No overlapping active appointments for this doctor (F3, GiST logic)
    const reqStart = new Date(input.slotStartTime).getTime();
    const reqEnd = new Date(input.slotEndTime).getTime();

    if (reqStart >= reqEnd) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Slot start time must be before end time',
      });
    }

    for (const appt of this.appointments.values()) {
      if (
        appt.doctorId === doctor.id &&
        ['HELD', 'CONFIRMED', 'READY', 'IN_PROGRESS'].includes(appt.status)
      ) {
        const apptStart = new Date(appt.startTime).getTime();
        const apptEnd = new Date(appt.endTime).getTime();

        // Check time overlap: (start1 < end2) && (start2 < end1)
        if (reqStart < apptEnd && apptStart < reqEnd) {
          // If hold has expired, auto-expire it
          if (appt.status === AppointmentStatus.HELD && new Date(appt.holdExpiresAt).getTime() < Date.now()) {
            appt.status = AppointmentStatus.EXPIRED;
          } else {
            throw new ConflictException({
              code: ErrorCodes.SLOT_TAKEN,
              message: 'This time slot is no longer available. Please select another slot.',
            });
          }
        }
      }
    }

    // 4. Snapshots: fee, commission (15% independent, 25% managed), policy version
    const feePaise = doctor.consultationFeePaise;
    const commissionBps = doctor.practiceType === 'MANAGED' ? 2500 : 1500;
    const { commissionPaise, doctorPayablePaise } = calculateCommission(feePaise, commissionBps);

    const appointmentId = randomUUID();
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minute hold

    const newAppointment: StoredAppointment = {
      id: appointmentId,
      patientId,
      doctorId: doctor.id,
      mode: input.mode,
      kind: input.kind || AppointmentKind.SCHEDULED,
      startTime: input.slotStartTime,
      endTime: input.slotEndTime,
      status: AppointmentStatus.HELD,
      feePaise,
      platformFeePaise: 0,
      commissionBpsSnapshot: commissionBps,
      cancelPolicyVersion: '1.0',
      holdExpiresAt,
      patientSymptoms: input.patientSymptoms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.appointments.set(appointmentId, newAppointment);

    // 5. Create Payment Order with Razorpay adapter
    const paymentOrder = await this.paymentProvider.createOrder(
      appointmentId,
      feePaise,
      idempotencyKey || appointmentId,
    );

    const result = {
      appointment: newAppointment,
      paymentOrder,
      doctor: {
        id: doctor.id,
        displayName: doctor.displayName,
        specialties: doctor.specialties,
      },
      feeBreakdown: {
        consultationFeeRupees: paiseToRupees(feePaise),
        platformChargeRupees: 0,
        totalRupees: paiseToRupees(feePaise),
        cancellationPolicySummary: '100% refund if cancelled ≥ 24h prior. 50% refund if cancelled 2–24h prior.',
      },
    };

    if (idempotencyKey) {
      this.idempotencyStore.set(idempotencyKey, result);
    }

    this.logger.log(`[Appointments] Created HELD appointment: ${appointmentId} (expires: ${holdExpiresAt})`);
    return result;
  }

  async getById(id: string): Promise<StoredAppointment> {
    const appt = this.appointments.get(id);
    if (!appt) {
      throw new NotFoundException({
        code: ErrorCodes.APPOINTMENT_NOT_FOUND,
        message: 'Appointment not found',
      });
    }

    // Check if expired hold
    if (appt.status === AppointmentStatus.HELD && new Date(appt.holdExpiresAt).getTime() < Date.now()) {
      appt.status = AppointmentStatus.EXPIRED;
    }

    return appt;
  }

  async confirmByPayment(appointmentId: string, paymentRef: string) {
    const appt = await this.getById(appointmentId);

    if (appt.status !== AppointmentStatus.HELD) {
      throw new ConflictException({
        code: ErrorCodes.INVALID_STATE_TRANSITION,
        message: `Cannot confirm appointment in status: ${appt.status}`,
      });
    }

    if (!canTransitionAppointment(appt.status, AppointmentStatus.CONFIRMED)) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATE_TRANSITION,
        message: 'Invalid transition to CONFIRMED',
      });
    }

    appt.status = AppointmentStatus.CONFIRMED;
    appt.updatedAt = new Date().toISOString();
    this.logger.log(`[Appointments] Confirmed appointment ${appointmentId} via verified payment ref ${paymentRef}`);
    return appt;
  }

  async cancel(appointmentId: string, actorRole: 'PATIENT' | 'DOCTOR' | 'ADMIN', reason: string) {
    const appt = await this.getById(appointmentId);
    const targetStatus =
      actorRole === 'PATIENT'
        ? AppointmentStatus.CANCELLED_BY_PATIENT
        : actorRole === 'DOCTOR'
          ? AppointmentStatus.CANCELLED_BY_DOCTOR
          : AppointmentStatus.CANCELLED_BY_ADMIN;

    if (!canTransitionAppointment(appt.status, targetStatus)) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_STATE_TRANSITION,
        message: `Cannot cancel appointment in status ${appt.status}`,
      });
    }

    // Calculate refund according to architecture 5.4
    const now = Date.now();
    const apptStart = new Date(appt.startTime).getTime();
    const hoursUntilStart = (apptStart - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (actorRole === 'DOCTOR' || actorRole === 'ADMIN') {
      refundPercentage = 100;
    } else {
      if (hoursUntilStart >= 24) {
        refundPercentage = 100;
      } else if (hoursUntilStart >= 2) {
        refundPercentage = 50;
      } else {
        refundPercentage = 0;
      }
    }

    const refundPaise = Math.round((appt.feePaise * refundPercentage) / 100);

    appt.status = targetStatus;
    appt.updatedAt = new Date().toISOString();

    return {
      appointmentId,
      status: targetStatus,
      reason,
      refundPercentage,
      refundPaise,
      refundRupees: paiseToRupees(refundPaise),
    };
  }
}
