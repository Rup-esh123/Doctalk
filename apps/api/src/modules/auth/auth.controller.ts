import { Controller, Post, Get, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  loginSchema,
  LoginInput,
  patientRegisterSchema,
  PatientRegisterInput,
  doctorRegisterSchema,
  DoctorRegisterInput,
} from '@doctalk/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = loginSchema.parse(body);
    const result = await this.authService.login(input);

    if (result.accessToken) {
      res.cookie('doctalk_access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 mins
      });
    }

    return result;
  }

  @Post('register/patient')
  async registerPatient(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = patientRegisterSchema.parse(body);
    const result = await this.authService.registerPatient(input);

    if (result.accessToken) {
      res.cookie('doctalk_access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
    }

    return result;
  }

  @Post('register/doctor')
  async registerDoctor(@Body() body: any) {
    const input = doctorRegisterSchema.parse(body);
    return this.authService.registerDoctor(input);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('doctalk_access_token');
    return { message: 'Logged out successfully' };
  }
}
