import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentOrderResult, RefundResult } from './payment.provider.interface.js';
import { createHmac, randomBytes } from 'crypto';
import { env } from '../../config/env.js';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);

  async createOrder(
    appointmentId: string,
    amountPaise: number,
    idempotencyKey: string,
  ): Promise<PaymentOrderResult> {
    const orderId = `order_mock_${randomBytes(8).toString('hex')}`;
    this.logger.log(
      `[MockPayment] Created mock payment order ${orderId} for appt ${appointmentId} (${amountPaise} paise, key: ${idempotencyKey})`,
    );
    return {
      orderId,
      amountPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    };
  }

  verifyWebhookSignature(payloadRaw: string, signature: string): boolean {
    if (!signature) return false;
    const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payloadRaw)
      .digest('hex');
    // In mock/test mode allow 'test-signature' or exact match
    return signature === expected || signature === 'test-signature';
  }

  async refund(
    paymentId: string,
    amountPaise: number,
    reason: string,
    idempotencyKey: string,
  ): Promise<RefundResult> {
    const refundId = `rfnd_mock_${randomBytes(8).toString('hex')}`;
    this.logger.log(
      `[MockPayment] Processed mock refund ${refundId} for payment ${paymentId} (${amountPaise} paise, reason: ${reason}, key: ${idempotencyKey})`,
    );
    return {
      refundId,
      amountPaise,
      status: 'PROCESSED',
    };
  }
}
