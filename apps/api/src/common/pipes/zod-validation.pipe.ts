import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { ErrorCodes } from '@doctalk/shared';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed for request payload',
          details: error.flatten().fieldErrors,
        });
      }
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid request input',
      });
    }
  }
}
