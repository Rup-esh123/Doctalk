import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, Inject } from '@nestjs/common';
import { DoctorsService } from './doctors.service.js';
import { doctorSearchQuerySchema, UserRole } from '@doctalk/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('doctors')
export class DoctorsController {
  constructor(@Inject(DoctorsService) private readonly doctorsService: DoctorsService) {}

  @Get()
  async search(@Query() rawQuery: Record<string, any>) {
    const parsedQuery = doctorSearchQuerySchema.parse(rawQuery);
    return this.doctorsService.search(parsedQuery);
  }

  @Get('specialties')
  async getSpecialties() {
    return this.doctorsService.getSpecialties();
  }

  // ---------------------------------------------------------------------------
  // Doctor Onboarding (Authenticated)
  // ---------------------------------------------------------------------------

  @Get('me/onboarding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getOnboardingStatus(@CurrentUser('id') userId: string) {
    return this.doctorsService.getOnboardingStatus(userId);
  }

  @Put('me/onboarding/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async updateOnboardingProfile(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.doctorsService.updateOnboardingProfile(userId, body);
  }

  @Post('me/onboarding/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async addCredential(
    @CurrentUser('id') userId: string,
    @Body() body: { type: string; councilName: string; registrationNumber: string; documentFileId?: string },
  ) {
    return this.doctorsService.addCredential(userId, body);
  }

  @Post('me/onboarding/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async submitForVerification(@CurrentUser('id') userId: string) {
    return this.doctorsService.submitForVerification(userId);
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
