/**
 * 1. Relative path: src/crypto/argon2.ts
 * 2. Description: Argon2id hashing wrapper using @noble/hashes.
 * 3. Expects: Raw password bytes and optional tuning parameters.
 * 4. Provides: Secure, hex-pure Argon2id hashing and constant-time verification.
 */

import { argon2id } from '@noble/hashes/argon2.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { bytesToHex, hexToBytes, type HexString } from './hex.js';

export interface Argon2idParams {
  readonly time: number;
  readonly memory: number;
  readonly parallelism: number;
  readonly saltLength: number;
  readonly hashLength: number;
}

export const DEFAULT_ARGON2_PARAMS: Argon2idParams = {
  time: 3,
  memory: 65536, // 64MB
  parallelism: 1,
  saltLength: 16,
  hashLength: 32,
};

export type Argon2idHash = string;

export function hashArgon2id(password: Uint8Array, params: Argon2idParams = DEFAULT_ARGON2_PARAMS): Argon2idHash {
  const salt = randomBytes(params.saltLength);
  const hash = argon2id(password, salt, {
    t: params.time,
    m: params.memory,
    p: params.parallelism,
    dkLen: params.hashLength,
  });
  const saltHex = bytesToHex(salt);
  const hashHex = bytesToHex(hash);
  return `$argon2id$v=19$m=${params.memory},t=${params.time},p=${params.parallelism}$${saltHex}$${hashHex}`;
}

export function verifyArgon2id(password: Uint8Array, encoded: Argon2idHash): boolean {
  try {
    const parts = encoded.split('$');
    if (parts.length !== 6 || parts[1] !== 'argon2id' || parts[2] !== 'v=19') return false;
    
    const paramsPart = parts[3];
    const saltHex = parts[4] as HexString;
    const hashHex = parts[5] as HexString;
    
    const paramMatches = paramsPart?.match(/m=(\d+),t=(\d+),p=(\d+)/);
    if (!paramMatches) return false;
    
    const [, mem, time, par] = paramMatches;
    const salt = hexToBytes(saltHex);
    const expectedHash = hexToBytes(hashHex);
    
    const computedHash = argon2id(password, salt, {
      t: Number(time),
      m: Number(mem),
      p: Number(par),
      dkLen: expectedHash.length,
    });
    
    if (computedHash.length !== expectedHash.length) return false;
    
    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < computedHash.length; i++) {
      diff |= computedHash[i]! ^ expectedHash[i]!;
    }
    return diff === 0;
  } catch {
    return false;
  }
}