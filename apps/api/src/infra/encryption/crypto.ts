import crypto from 'crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard IV length for AES-GCM is 12 bytes
const KEY_BUFFER = Buffer.from(env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a plaintext string using AES-256-GCM symmetric encryption.
 * Outputs a string in the format "iv:ciphertext:authTag" for database storage (Standards Rule 7).
 * 
 * @param plaintext - The string to encrypt
 * @returns The colon-separated encrypted payload (hex encoded)
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${ciphertext}:${authTag}`;
}

/**
 * Decrypts a hex-encoded string formatted as "iv:ciphertext:authTag" using AES-256-GCM.
 * 
 * @param encryptedPayload - The colon-separated encrypted payload
 * @returns The decrypted UTF-8 plaintext string
 */
export function decrypt(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format. Expected "iv:ciphertext:authTag"');
  }

  const [ivHex, ciphertextHex, authTagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertextHex, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}
