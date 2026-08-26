// 1. Relative path: src/delivery/verifier.ts
// 2. Description: SHA-256 and Ed25519 artifact verification engine for SwISD releases.
// 3. Expects: File paths to the artifact, its SHA-256 checksum file, and its Ed25519 signature file, plus the public key.
// 4. Provides: Cryptographic validation of release integrity and authenticity, throwing DeliveryArtifactError on failure.

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { verifyEd25519 } from '../crypto/index.js';
import { DeliveryArtifactError } from '../errors.js';

export interface VerificationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

export async function verifyReleaseArtifact(
  artifactPath: string,
  sha256Path: string,
  signaturePath: string,
  publicKeyDer: Uint8Array
): Promise<VerificationResult> {
  try {
    const [artifactBuffer, sha256Buffer, signatureBuffer] = await Promise.all([
      readFile(artifactPath),
      readFile(sha256Path, { encoding: 'utf-8' }),
      readFile(signaturePath),
    ]);

    const expectedSha256 = sha256Buffer.trim().toLowerCase();
    const actualSha256 = createHash('sha256').update(artifactBuffer).digest('hex').toLowerCase();

    if (expectedSha256 !== actualSha256) {
      return {
        isValid: false,
        error: `SHA-256 mismatch. Expected: ${expectedSha256}, Actual: ${actualSha256}`,
      };
    }

    const isValidSig = verifyEd25519(publicKeyDer, artifactBuffer, new Uint8Array(signatureBuffer));
    if (!isValidSig) {
      return {
        isValid: false,
        error: 'Ed25519 signature verification failed.',
      };
    }

    return { isValid: true };
  } catch (error) {
    throw new DeliveryArtifactError('Failed to read or verify release artifact files', error);
    // Note: The throw is caught by the caller; the return type allows graceful handling if preferred, 
    // but throwing on filesystem/read errors is safer than returning a masked isValid: false.
  }
}