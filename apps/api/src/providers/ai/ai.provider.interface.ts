export interface AiProvider {
  complete(prompt: string, context?: Record<string, unknown>): Promise<string>;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER';
