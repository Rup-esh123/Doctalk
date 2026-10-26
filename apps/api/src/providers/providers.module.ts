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

@Global()
@Module({
  providers: [
    { provide: VIDEO_PROVIDER_TOKEN, useClass: MockVideoProvider },
    { provide: PAYMENT_PROVIDER_TOKEN, useClass: MockPaymentProvider },
    { provide: EMAIL_PROVIDER_TOKEN, useClass: MockEmailProvider },
    { provide: STORAGE_PROVIDER_TOKEN, useClass: MockStorageProvider },
    { provide: AI_PROVIDER_TOKEN, useClass: MockAiProvider },
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
