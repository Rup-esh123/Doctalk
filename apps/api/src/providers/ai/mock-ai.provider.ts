import { Injectable, Logger } from '@nestjs/common';
import { AiProvider } from './ai.provider.interface.js';

@Injectable()
export class MockAiProvider implements AiProvider {
  private readonly logger = new Logger(MockAiProvider.name);

  async complete(prompt: string): Promise<string> {
    this.logger.log(`[MockAi] Executing mock assistive completion (length: ${prompt.length})`);
    return `[AI-ASSISTED DRAFT — REQUIRES CLINICIAN REVIEW AND APPROVAL]: Patient reported symptoms structured summary draft.`;
  }
}
