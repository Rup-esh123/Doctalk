import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DoctorsModule } from './modules/doctors/doctors.module.js';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    ProvidersModule,
    HealthModule,
    AuthModule,
    DoctorsModule,
    AppointmentsModule,
    PaymentsModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
