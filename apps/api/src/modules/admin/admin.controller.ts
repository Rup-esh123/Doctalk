import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@doctalk/shared';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('applications')
  async listApplications(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listApplications({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('applications/:doctorId')
  async getApplicationDetail(@Param('doctorId') doctorId: string) {
    return this.adminService.getApplicationDetail(doctorId);
  }

  @Post('applications/:doctorId/approve')
  async approveApplication(
    @Param('doctorId') doctorId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.approveApplication(doctorId, adminId, body.notes);
  }

  @Post('applications/:doctorId/reject')
  async rejectApplication(
    @Param('doctorId') doctorId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { reason: string; notes?: string },
  ) {
    if (!body.reason) {
      throw new Error('Rejection reason is required');
    }
    return this.adminService.rejectApplication(doctorId, adminId, body.reason, body.notes);
  }

  @Post('applications/:doctorId/request-info')
  async requestMoreInfo(
    @Param('doctorId') doctorId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { reason: string },
  ) {
    if (!body.reason) {
      throw new Error('Reason is required');
    }
    return this.adminService.requestMoreInfo(doctorId, adminId, body.reason);
  }
}
