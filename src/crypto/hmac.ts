/**
 * 1. Relative path: src/crypto/hmac.ts
 * 2. Description: HMAC-SHA256 data-plane cryptographic primitives for high-throughput stream validation.
 * 3. Expects: Uint8Array for both the symmetric key and the data payload.
 * 4. Provides: Deterministic, side-effect-free HMAC generation and constant-time verification.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Generates an HMAC-SHA256 message authentication code.
 * @param key - The symmetric key (Uint8Array).
 * @param data - The data payload to authenticate (Uint8Array).
 * @returns The resulting HMAC as a Uint8Array.
 */
export function generateHmac(key: Uint8Array, data: Uint8Array): Uint8Array {
  const hmac = createHmac('sha256', key);
  hmac.update(data);
  return new Uint8Array(hmac.digest());
}

/**
 * Verifies an HMAC-SHA256 message authentication code using constant-time comparison.
 * @param key - The symmetric key (Uint8Array).
 * @param data - The data payload to verify (Uint8Array).
 * @param expectedMac - The expected MAC to compare against (Uint8Array).
 * @returns True if the MAC is valid, false otherwise.
 */
export function verifyHmac(key: Uint8Array, data: Uint8Array, expectedMac: Uint8Array): boolean {
  const actualMac = generateHmac(key, data);
  
  // Prevent timing attacks by using constant-time comparison
  if (actualMac.length !== expectedMac.length) {
    return false;
  }
  
  return timingSafeEqual(actualMac, expectedMac);
}