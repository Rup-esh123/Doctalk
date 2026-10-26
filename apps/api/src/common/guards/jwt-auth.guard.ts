import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { env } from '../../config/env.js';
import { ErrorCodes } from '@doctalk/shared';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeaderOrCookie(request);

    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_UNAUTHORIZED,
        message: 'Authentication token required',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: env.JWT_ACCESS_SECRET,
      });
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_TOKEN_EXPIRED,
        message: 'Invalid or expired authentication session',
      });
    }
  }

  private extractTokenFromHeaderOrCookie(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (request.cookies && request.cookies['doctalk_access_token']) {
      return request.cookies['doctalk_access_token'];
    }
    return undefined;
  }
}
