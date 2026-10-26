import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from './email.provider.interface.js';

@Injectable()
export class MockEmailProvider implements EmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);

  async send(
    to: string,
    subject: string,
    template: string,
    vars: Record<string, string | number>,
  ): Promise<boolean> {
    this.logger.log(
      `[MockEmail] Sent to: ${to} | Subject: "${subject}" | Template: ${template} | Keys: ${Object.keys(vars).join(', ')}`,
    );
    return true;
  }
}
