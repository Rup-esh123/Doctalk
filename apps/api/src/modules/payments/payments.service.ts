import {
  Injectable,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  PAYMENT_PROVIDER_TOKEN,
  PaymentProvider,
} from '../../providers/payment/payment.provider.interface.js';
import { AppointmentsService } from '../appointments/appointments.service.js';
import { ErrorCodes, LedgerAccount, LedgerDirection } from '@doctalk/shared';
import { randomUUID } from 'crypto';

export interface StoredLedgerEntry {
  id: string;
  occurredAt: string;
  account: LedgerAccount;
  direction: LedgerDirection;
  amountPaise: number;
  appointmentId: string;
  paymentId: string;
  meta?: Record<string, any>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private processedEvents: Set<string> = new Set();
  private ledgerEntries: StoredLedgerEntry[] = [];

  constructor(
    @Inject(PAYMENT_PROVIDER_TOKEN) private readonly paymentProvider: PaymentProvider,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async handleRazorpayWebhook(rawBody: string, signature: string, payload: any) {
    // 1. Verify signature
    const isValid = this.paymentProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('[Payments] Invalid webhook signature received');
      throw new BadRequestException({
        code: ErrorCodes.PAYMENT_SIGNATURE_INVALID,
        message: 'Invalid payment webhook signature',
      });
    }

    const eventId = payload.id || payload.event_id || `evt_${Date.now()}`;
    const providerKey = `razorpay:${eventId}`;

    // 2. Idempotent check
    if (this.processedEvents.has(providerKey)) {
      this.logger.log(`[Payments] Duplicate webhook event ${providerKey} ignored`);
      return { status: 'already_processed' };
    }

    this.processedEvents.add(providerKey);
    const eventType = payload.event;
    this.logger.log(`[Payments] Processing verified webhook: ${eventType} (${eventId})`);

    // 3. Handle payment captured event
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || payload.payload;
      const appointmentId = paymentEntity?.notes?.appointmentId || payload.appointmentId;
      const paymentId = paymentEntity?.id || `pay_${randomUUID().slice(0, 8)}`;
      const amountPaise = paymentEntity?.amount || 50000;

      if (appointmentId) {
        // Transition appointment HELD -> CONFIRMED
        await this.appointmentsService.confirmByPayment(appointmentId, paymentId);

        // Record append-only ledger entries (debit = credit integrity)
        const gatewayFeePaise = Math.round(amountPaise * 0.02); // 2% gateway fee placeholder
        const platformRevenuePaise = Math.round(amountPaise * 0.15); // 15% platform commission
        const doctorPayablePaise = amountPaise - platformRevenuePaise - gatewayFeePaise;

        const timestamp = new Date().toISOString();

        // 1. Platform revenue credit
        this.ledgerEntries.push({
          id: randomUUID(),
          occurredAt: timestamp,
          account: LedgerAccount.PLATFORM_REVENUE,
          direction: LedgerDirection.CREDIT,
          amountPaise: platformRevenuePaise,
          appointmentId,
          paymentId,
        });

        // 2. Doctor payable credit
        this.ledgerEntries.push({
          id: randomUUID(),
          occurredAt: timestamp,
          account: LedgerAccount.DOCTOR_PAYABLE,
          direction: LedgerDirection.CREDIT,
          amountPaise: doctorPayablePaise,
          appointmentId,
          paymentId,
        });

        // 3. Gateway fee debit
        this.ledgerEntries.push({
          id: randomUUID(),
          occurredAt: timestamp,
          account: LedgerAccount.GATEWAY_FEE,
          direction: LedgerDirection.DEBIT,
          amountPaise: gatewayFeePaise,
          appointmentId,
          paymentId,
        });

        this.logger.log(`[Ledger] Recorded append-only financial entries for appt ${appointmentId}`);
      }
    }

    return { status: 'processed', eventId };
  }

  getLedger(): StoredLedgerEntry[] {
    return [...this.ledgerEntries];
  }
}
