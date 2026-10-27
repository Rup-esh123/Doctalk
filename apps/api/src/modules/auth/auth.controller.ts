import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  loginSchema,
  patientRegisterSchema,
  doctorRegisterSchema,
  mfaVerifySchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  ErrorCodes,
} from '@doctalk/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = loginSchema.parse(body);
    const result = await this.authService.login(
      input,
      req.ip,
      req.headers['user-agent'],
    );

    if (result.accessToken) {
      res.cookie('doctalk_access_token', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 min
      });
    }
    if (result.refreshToken) {
      res.cookie('doctalk_refresh_token', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    // Don't send raw refresh token in body — it's in the cookie
    const { refreshToken: _rt, ...safeResult } = result;
    return safeResult;
  }

  @Post('register/patient')
  async registerPatient(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = patientRegisterSchema.parse(body);
    const result = await this.authService.registerPatient(input, req.ip);

    if (result.accessToken) {
      res.cookie('doctalk_access_token', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });
    }
    if (result.refreshToken) {
      res.cookie('doctalk_refresh_token', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const { refreshToken: _rt, ...safeResult } = result;
    return safeResult;
  }

  @Post('register/doctor')
  async registerDoctor(@Body() body: any, @Req() req: Request) {
    const input = doctorRegisterSchema.parse(body);
    return this.authService.registerDoctor(input, req.ip);
  }

  // ---------------------------------------------------------------------------
  // Email Verification
  // ---------------------------------------------------------------------------

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    if (!body.token) {
      throw new Error('Verification token is required');
    }
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  async resendVerification(@CurrentUser('id') userId: string) {
    return this.authService.resendVerificationEmail(userId);
  }

  // ---------------------------------------------------------------------------
  // Password Reset
  // ---------------------------------------------------------------------------

  @Post('password-reset/request')
  async requestPasswordReset(@Body() body: any) {
    const input = passwordResetRequestSchema.parse(body);
    return this.authService.requestPasswordReset(input.email);
  }

  @Post('password-reset/confirm')
  async confirmPasswordReset(@Body() body: any) {
    const input = passwordResetConfirmSchema.parse(body);
    return this.authService.confirmPasswordReset(input.token, input.newPassword);
  }

  // ---------------------------------------------------------------------------
  // MFA
  // ---------------------------------------------------------------------------

  @Post('mfa/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollMfa(@CurrentUser('id') userId: string) {
    return this.authService.enrollMfa(userId);
  }

  @Post('mfa/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmMfa(
    @CurrentUser('id') userId: string,
    @Body() body: { totpCode: string },
  ) {
    return this.authService.confirmMfaEnrollment(userId, body.totpCode);
  }

  @Post('mfa/verify')
  async verifyMfa(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = mfaVerifySchema.parse(body);
    const result = await this.authService.verifyMfa(
      input,
      req.ip,
      req.headers['user-agent'],
    );

    if (result.accessToken) {
      res.cookie('doctalk_access_token', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });
    }
    if (result.refreshToken) {
      res.cookie('doctalk_refresh_token', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const { refreshToken: _rt, ...safeResult } = result;
    return safeResult;
  }

  // ---------------------------------------------------------------------------
  // Refresh Token Rotation
  // ---------------------------------------------------------------------------

  @Post('refresh')
  async refreshSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshTokenRaw = req.cookies?.['doctalk_refresh_token'];
    if (!refreshTokenRaw) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_UNAUTHORIZED,
        message: 'Refresh token is required',
      });
    }

    const result = await this.authService.refreshSession(
      refreshTokenRaw,
      req.ip,
      req.headers['user-agent'],
    );

    res.cookie('doctalk_access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('doctalk_refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { refreshToken: _rt, ...safeResult } = result;
    return safeResult;
  }

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get userId from token if available
    let userId: string | undefined;
    try {
      const token =
        req.cookies?.['doctalk_access_token'] ||
        req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const payload = await this.authService.verifyAccessToken(token);
        userId = payload.id;
      }
    } catch {
      // Token may be expired — that's fine, we still clear cookies
    }

    const refreshTokenRaw = req.cookies?.['doctalk_refresh_token'];

    if (userId) {
      await this.authService.logout(userId, refreshTokenRaw);
    }

    res.clearCookie('doctalk_access_token', { path: '/' });
    res.clearCookie('doctalk_refresh_token', { path: '/' });

    return { message: 'Logged out successfully' };
  }
}
