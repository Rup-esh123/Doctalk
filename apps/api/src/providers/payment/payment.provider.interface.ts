export interface PaymentOrderResult {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
}

export interface RefundResult {
  refundId: string;
  amountPaise: number;
  status: string;
}

export interface PaymentProvider {
  createOrder(appointmentId: string, amountPaise: number, idempotencyKey: string): Promise<PaymentOrderResult>;
  verifyWebhookSignature(payloadRaw: string, signature: string): boolean;
  refund(paymentId: string, amountPaise: number, reason: string, idempotencyKey: string): Promise<RefundResult>;
}

export const PAYMENT_PROVIDER_TOKEN = 'PAYMENT_PROVIDER';
