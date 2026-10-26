export interface EmailProvider {
  send(
    to: string,
    subject: string,
    template: string,
    vars: Record<string, string | number>,
  ): Promise<boolean>;
}

export const EMAIL_PROVIDER_TOKEN = 'EMAIL_PROVIDER';
