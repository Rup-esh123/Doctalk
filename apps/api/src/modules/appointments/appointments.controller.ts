import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { createAppointmentSchema, cancelAppointmentSchema } from '@doctalk/shared';
import { Request } from 'express';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async createHold(
    @Body() body: any,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Req() req?: Request,
  ) {
    const input = createAppointmentSchema.parse(body);
    const patientId = (req as any)?.user?.id || 'usr-patient-0000000-0000-0000-0000-000000000001';
    return this.appointmentsService.createHold(input, patientId, idempotencyKey);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.appointmentsService.getById(id);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const input = cancelAppointmentSchema.parse(body);
    return this.appointmentsService.cancel(id, 'PATIENT', input.reason);
  }
}
