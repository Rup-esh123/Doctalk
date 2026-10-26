import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider, SignedUrlResult } from './storage.provider.interface.js';

@Injectable()
export class MockStorageProvider implements StorageProvider {
  private readonly logger = new Logger(MockStorageProvider.name);

  async createSignedUploadUrl(key: string, mime: string, maxSizeBytes: number): Promise<SignedUrlResult> {
    this.logger.log(`[MockStorage] Issued signed upload URL for key: ${key} (mime: ${mime}, max: ${maxSizeBytes})`);
    return {
      uploadUrl: `https://storage.local.doctalk.in/upload/${key}?sig=mock_upload_sig`,
      key,
      expiresInSeconds: 300,
    };
  }

  async createSignedDownloadUrl(key: string, ttlSeconds = 300): Promise<SignedUrlResult> {
    this.logger.log(`[MockStorage] Issued signed download URL for key: ${key} (ttl: ${ttlSeconds}s)`);
    return {
      downloadUrl: `https://storage.local.doctalk.in/download/${key}?sig=mock_download_sig`,
      key,
      expiresInSeconds: ttlSeconds,
    };
  }

  async deleteObject(key: string): Promise<boolean> {
    this.logger.log(`[MockStorage] Deleted object with key: ${key}`);
    return true;
  }
}
