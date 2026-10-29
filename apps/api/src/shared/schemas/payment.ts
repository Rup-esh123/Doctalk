import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

export const razorpayWebhookSchema = z.object({
  entity: z.literal('event'),
  account_id: z.string().optional(),
  event: z.string(),
  contains: z.array(z.string()).optional(),
  payload: z.record(z.any()),
  created_at: z.number(),
});

export type RazorpayWebhookPayload = z.infer<typeof razorpayWebhookSchema>;
