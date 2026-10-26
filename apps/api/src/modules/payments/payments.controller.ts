import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const sig = signature || 'test-signature';
    return this.paymentsService.handleRazorpayWebhook(rawBody, sig, body);
  }

  @Get('ledger')
  getLedger() {
    return this.paymentsService.getLedger();
  }
}
