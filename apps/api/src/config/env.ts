import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  WEB_PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgresql://doctalk_user:doctalk_password@localhost:5432/doctalk?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(16).default('development_jwt_access_secret_key_minimum_length_32_chars!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('development_jwt_refresh_secret_key_minimum_length_32_chars!'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CLINICAL_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().default('mock_razorpay_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mock_webhook_secret'),
  VIDEO_PROVIDER: z.enum(['mock', 'livekit', '100ms']).default('mock'),
  EMAIL_PROVIDER: z.enum(['mock', 'resend', 'smtp']).default('mock'),
  STORAGE_PROVIDER: z.enum(['mock', 's3']).default('mock'),
  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  FEATURE_INSTANT_CONSULT: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  FEATURE_AI_INTAKE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  FEATURE_AI_SUMMARY: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  FEATURE_SUBSCRIPTIONS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  FEATURE_INTL: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Environment validation failed:', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = validateEnv();
