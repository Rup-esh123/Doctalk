export interface RoomSessionToken {
  roomId: string;
  token: string;
  expiresAt: string;
  provider: string;
}

export interface VideoProvider {
  createRoom(appointmentId: string): Promise<{ roomId: string }>;
  issueToken(
    roomId: string,
    userId: string,
    userRole: string,
    ttlSeconds?: number,
  ): Promise<RoomSessionToken>;
  endRoom(roomId: string): Promise<boolean>;
}

export const VIDEO_PROVIDER_TOKEN = 'VIDEO_PROVIDER';
