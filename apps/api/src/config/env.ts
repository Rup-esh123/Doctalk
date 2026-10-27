import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

export const envSchema = z
  .object({
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
    PAYMENT_PROVIDER: z.enum(['mock', 'razorpay']).default('mock'),
    RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
    RAZORPAY_KEY_SECRET: z.string().default('mock_razorpay_secret'),
    RAZORPAY_WEBHOOK_SECRET: z.string().default('mock_webhook_secret'),
    VIDEO_PROVIDER: z.enum(['mock', 'livekit', '100ms']).default('mock'),
    EMAIL_PROVIDER: z.enum(['mock', 'resend', 'smtp']).default('mock'),
    STORAGE_PROVIDER: z.enum(['mock', 's3']).default('mock'),
    AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
    ALLOW_DEV_USERS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
    FEATURE_INSTANT_CONSULT: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
    FEATURE_AI_INTAKE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
    FEATURE_AI_SUMMARY: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
    FEATURE_SUBSCRIPTIONS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
    FEATURE_INTL: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      // 1. JWT Access Secret
      if (
        data.JWT_ACCESS_SECRET.includes('development') ||
        data.JWT_ACCESS_SECRET.includes('CHANGE_ME') ||
        data.JWT_ACCESS_SECRET.length < 32
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'Production requires a secure, high-entropy JWT_ACCESS_SECRET of at least 32 characters.',
        });
      }

      // 2. JWT Refresh Secret
      if (
        data.JWT_REFRESH_SECRET.includes('development') ||
        data.JWT_REFRESH_SECRET.includes('CHANGE_ME') ||
        data.JWT_REFRESH_SECRET.length < 32
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'Production requires a secure, high-entropy JWT_REFRESH_SECRET of at least 32 characters.',
        });
      }

      // 3. Clinical Encryption Key
      if (
        data.CLINICAL_ENCRYPTION_KEY === '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' ||
        data.CLINICAL_ENCRYPTION_KEY.length !== 64 ||
        !/^[0-9a-fA-F]{64}$/.test(data.CLINICAL_ENCRYPTION_KEY)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CLINICAL_ENCRYPTION_KEY'],
          message: 'Production requires a valid 32-byte hex CLINICAL_ENCRYPTION_KEY (64 hex characters) not using development placeholder.',
        });
      }

      // 4. Mock Providers must NOT be enabled in production
      if (data.PAYMENT_PROVIDER === 'mock') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['PAYMENT_PROVIDER'],
          message: 'Mock payment provider cannot be enabled in production.',
        });
      }
      if (data.VIDEO_PROVIDER === 'mock') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['VIDEO_PROVIDER'],
          message: 'Mock video provider cannot be enabled in production.',
        });
      }
      if (data.STORAGE_PROVIDER === 'mock') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STORAGE_PROVIDER'],
          message: 'Mock storage provider cannot be enabled in production.',
        });
      }
      if (data.EMAIL_PROVIDER === 'mock') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['EMAIL_PROVIDER'],
          message: 'Mock email provider cannot be enabled in production.',
        });
      }

      // 5. Razorpay Credentials
      if (
        data.RAZORPAY_KEY_ID.includes('placeholder') ||
        data.RAZORPAY_KEY_SECRET.includes('mock') ||
        data.RAZORPAY_WEBHOOK_SECRET.includes('mock')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['RAZORPAY_KEY_ID'],
          message: 'Production requires real, configured Razorpay credentials.',
        });
      }

      // 6. Disallow DEV users in production
      if (data.ALLOW_DEV_USERS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ALLOW_DEV_USERS'],
          message: 'ALLOW_DEV_USERS cannot be enabled in production.',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(envInput: Record<string, any> = process.env): Env {
  const parsed = envSchema.safeParse(envInput);
  if (!parsed.success) {
    console.error('❌ Environment validation failed:', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = validateEnv();
