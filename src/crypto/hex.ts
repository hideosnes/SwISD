/**
 * 1. Relative path: src/crypto/hex.ts
 * 2. Description: Centralized hex serialization enforcing Data Purity.
 * 3. Expects: Uint8Array and 0x-prefixed lowercase hex strings.
 * 4. Provides: Type-safe, deterministic hex encoding/decoding.
 */

export type HexString = `0x${string}`;

export function bytesToHex(bytes: Uint8Array): HexString {
  let hex = '0x';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      hex += byte.toString(16).padStart(2, '0');
    }
  }
  return hex as HexString;
}

export function hexToBytes(hex: HexString): Uint8Array {
  if (!hex.startsWith('0x')) {
    throw new Error(`Invalid hex string: must start with 0x, got ${hex}`);
  }
  const clean = hex.slice(2);
  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid hex length: must be even, got ${clean.length}`);
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

export function isHexString(value: string): value is HexString {
  return /^0x[0-9a-f]+$/.test(value);
}