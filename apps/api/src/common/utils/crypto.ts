import * as argon2 from 'argon2';
import { randomBytes, createCipheriv, createDecipheriv, timingSafeEqual } from 'crypto';
import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Password hashing — Argon2id (per D-031, architecture.md section 5.1)
// ---------------------------------------------------------------------------

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MiB
  timeCost: 3,
  parallelism: 4,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Token hashing — SHA-256 for storing refresh/verification token hashes
// ---------------------------------------------------------------------------

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

// ---------------------------------------------------------------------------
// AES-256-GCM encryption for TOTP secrets (stored in mfaSecretEnc column)
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

function getEncryptionKey(hexKey: string): Buffer {
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== 32) {
    throw new Error('CLINICAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return key;
}

export function encryptSecret(plaintext: string, keyHex: string): string {
  const key = getEncryptionKey(keyHex);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: hex(iv):hex(tag):hex(ciphertext)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(encrypted: string, keyHex: string): string {
  const key = getEncryptionKey(keyHex);
  const parts = encrypted.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted secret format');
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// ---------------------------------------------------------------------------
// Secure random token generation
// ---------------------------------------------------------------------------

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
