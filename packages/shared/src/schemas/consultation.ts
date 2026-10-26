import { z } from 'zod';

export const sendChatMessageSchema = z.object({
  appointmentId: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(4000),
  fileId: z.string().uuid().optional(),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

export const joinConsultationSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type JoinConsultationInput = z.infer<typeof joinConsultationSchema>;
