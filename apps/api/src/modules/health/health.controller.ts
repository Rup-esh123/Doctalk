import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { env } from '../../config/env.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('liveness')
  liveness() {
    return {
      status: 'ok',
      service: 'DocTALK API',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  async readiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: this.prisma.isConnected ? 'connected' : 'local_fallback',
      providers: {
        video: env.VIDEO_PROVIDER,
        payment: 'razorpay_test',
        email: env.EMAIL_PROVIDER,
        storage: env.STORAGE_PROVIDER,
        ai: env.FEATURE_AI_INTAKE ? 'active' : 'disabled',
      },
      featureFlags: {
        instantConsult: env.FEATURE_INSTANT_CONSULT,
        aiIntake: env.FEATURE_AI_INTAKE,
        aiSummary: env.FEATURE_AI_SUMMARY,
        subscriptions: env.FEATURE_SUBSCRIPTIONS,
        intl: env.FEATURE_INTL,
      },
    };
  }
}
