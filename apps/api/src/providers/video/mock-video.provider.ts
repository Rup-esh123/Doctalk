import { Injectable, Logger } from '@nestjs/common';
import { VideoProvider, RoomSessionToken } from './video.provider.interface.js';
import { randomBytes } from 'crypto';

@Injectable()
export class MockVideoProvider implements VideoProvider {
  private readonly logger = new Logger(MockVideoProvider.name);

  async createRoom(appointmentId: string): Promise<{ roomId: string }> {
    const roomId = `room_mock_${appointmentId.replace(/-/g, '').slice(0, 16)}`;
    this.logger.log(`[MockVideo] Created mock room ${roomId} for appointment ${appointmentId}`);
    return { roomId };
  }

  async issueToken(
    roomId: string,
    userId: string,
    userRole: string,
    ttlSeconds = 900,
  ): Promise<RoomSessionToken> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const token = `mock_tok_${userRole.toLowerCase()}_${userId.slice(0, 8)}_${randomBytes(16).toString('hex')}`;
    this.logger.log(`[MockVideo] Issued session token for user ${userId} (${userRole}) in ${roomId}`);
    return {
      roomId,
      token,
      expiresAt,
      provider: 'mock',
    };
  }

  async endRoom(roomId: string): Promise<boolean> {
    this.logger.log(`[MockVideo] Closed mock room ${roomId}`);
    return true;
  }
}
