export interface SignedUrlResult {
  uploadUrl?: string;
  downloadUrl?: string;
  key: string;
  expiresInSeconds: number;
}

export interface StorageProvider {
  createSignedUploadUrl(key: string, mime: string, maxSizeBytes: number): Promise<SignedUrlResult>;
  createSignedDownloadUrl(key: string, ttlSeconds?: number): Promise<SignedUrlResult>;
  deleteObject(key: string): Promise<boolean>;
}

export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER';
