import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes, ApiErrorResponse } from '@doctalk/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId || (request.headers['x-request-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCodes.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again later.';
    let details: Record<string, unknown> | Array<unknown> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        code = obj.code || this.defaultCodeForStatus(status);
        message = obj.message || exception.message;
        details = obj.details;
      }
    } else {
      // Unhandled non-HTTP exception: log internally with stack trace, but scrub from user response
      this.logger.error(
        `[${requestId}] Unhandled Exception: ${(exception as any)?.message || exception}`,
        (exception as any)?.stack,
      );
    }

    const errorPayload: ApiErrorResponse = {
      code: code as any,
      message,
      ...(details ? { details } : {}),
      requestId,
    };

    response.status(status).json(errorPayload);
  }

  private defaultCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.AUTH_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCodes.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCodes.RATE_LIMIT_EXCEEDED;
      default:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
