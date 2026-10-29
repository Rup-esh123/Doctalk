import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  Req,
  UseGuards,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole, ErrorCodes } from '../../shared';

@Controller('payments')
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature?: string,
    @Req() req?: Request,
  ) {
    if (!signature) {
      throw new BadRequestException({
        code: ErrorCodes.PAYMENT_SIGNATURE_INVALID,
        message: 'Missing Razorpay webhook signature header (x-razorpay-signature)',
      });
    }

    const rawBody =
      (req as any)?.rawBody?.toString('utf8') ||
      (typeof body === 'string' ? body : JSON.stringify(body));

    return this.paymentsService.handleRazorpayWebhook(rawBody, signature, body);
  }

  @Get('ledger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getLedger() {
    return this.paymentsService.getLedger();
  }
}
