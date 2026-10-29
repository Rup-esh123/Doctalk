import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  Req,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  UserRole,
  ErrorCodes,
} from '../../shared';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('appointments')
export class AppointmentsController {
  constructor(@Inject(AppointmentsService) private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createHold(
    @Body() body: any,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Req() req?: Request,
  ) {
    const user = (req as any)?.user;
    if (!user || !user.id) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_UNAUTHORIZED,
        message: 'Authentication required to book an appointment',
      });
    }

    const input = createAppointmentSchema.parse(body);
    return this.appointmentsService.createHold(input, user.id, idempotencyKey);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any)?.user;
    const appt = await this.appointmentsService.getById(id);

    // Resource-level authorization: caller must be patient, doctor, or admin
    const isAuthorized =
      user.role === UserRole.ADMIN ||
      appt.patientId === user.id ||
      appt.doctorId === user.id;

    if (!isAuthorized) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'You are not authorized to view this appointment',
      });
    }

    return appt;
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any)?.user;
    const appt = await this.appointmentsService.getById(id);

    // Resource-level authorization: caller must be patient, doctor, or admin
    const isAuthorized =
      user.role === UserRole.ADMIN ||
      appt.patientId === user.id ||
      appt.doctorId === user.id;

    if (!isAuthorized) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_FORBIDDEN,
        message: 'You are not authorized to cancel this appointment',
      });
    }

    const actorRole =
      user.role === UserRole.ADMIN
        ? 'ADMIN'
        : user.id === appt.doctorId
          ? 'DOCTOR'
          : 'PATIENT';

    const input = cancelAppointmentSchema.parse(body);
    return this.appointmentsService.cancel(id, actorRole, input.reason);
  }
}
