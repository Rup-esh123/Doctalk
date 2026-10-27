import { Module, Global } from '@nestjs/common';
import { VIDEO_PROVIDER_TOKEN } from './video/video.provider.interface.js';
import { MockVideoProvider } from './video/mock-video.provider.js';
import { PAYMENT_PROVIDER_TOKEN } from './payment/payment.provider.interface.js';
import { MockPaymentProvider } from './payment/mock-payment.provider.js';
import { EMAIL_PROVIDER_TOKEN } from './email/email.provider.interface.js';
import { MockEmailProvider } from './email/mock-email.provider.js';
import { STORAGE_PROVIDER_TOKEN } from './storage/storage.provider.interface.js';
import { MockStorageProvider } from './storage/mock-storage.provider.js';
import { AI_PROVIDER_TOKEN } from './ai/ai.provider.interface.js';
import { MockAiProvider } from './ai/mock-ai.provider.js';
import { env } from '../config/env.js';

@Global()
@Module({
  providers: [
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      useFactory: () => {
        if (env.NODE_ENV === 'production' && env.PAYMENT_PROVIDER === 'mock') {
          throw new Error('Fatal: MockPaymentProvider cannot be used in production environment');
        }
        return new MockPaymentProvider();
      },
    },
    {
      provide: VIDEO_PROVIDER_TOKEN,
      useFactory: () => {
        if (env.NODE_ENV === 'production' && env.VIDEO_PROVIDER === 'mock') {
          throw new Error('Fatal: MockVideoProvider cannot be used in production environment');
        }
        return new MockVideoProvider();
      },
    },
    {
      provide: EMAIL_PROVIDER_TOKEN,
      useFactory: () => {
        if (env.NODE_ENV === 'production' && env.EMAIL_PROVIDER === 'mock') {
          throw new Error('Fatal: MockEmailProvider cannot be used in production environment');
        }
        return new MockEmailProvider();
      },
    },
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: () => {
        if (env.NODE_ENV === 'production' && env.STORAGE_PROVIDER === 'mock') {
          throw new Error('Fatal: MockStorageProvider cannot be used in production environment');
        }
        return new MockStorageProvider();
      },
    },
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: () => {
        return new MockAiProvider();
      },
    },
  ],
  exports: [
    VIDEO_PROVIDER_TOKEN,
    PAYMENT_PROVIDER_TOKEN,
    EMAIL_PROVIDER_TOKEN,
    STORAGE_PROVIDER_TOKEN,
    AI_PROVIDER_TOKEN,
  ],
})
export class ProvidersModule {}
