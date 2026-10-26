import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { DoctorsService } from './doctors.service.js';
import { doctorSearchQuerySchema, DoctorSearchQuery } from '@doctalk/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  async search(@Query() rawQuery: Record<string, any>) {
    const parsedQuery = doctorSearchQuerySchema.parse(rawQuery);
    return this.doctorsService.search(parsedQuery);
  }

  @Get('specialties')
  async getSpecialties() {
    return this.doctorsService.getSpecialties();
  }

  @Get(':idOrSlug')
  async getByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.doctorsService.getBySlugOrId(idOrSlug);
  }

  @Get(':id/slots')
  async getSlots(
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    return this.doctorsService.getAvailableSlots(id, date);
  }
}
