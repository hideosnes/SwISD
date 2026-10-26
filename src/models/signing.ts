// 1. Relative path: src/models/signing.ts
// 2. Description: Persistent Ed25519 model-manifest signing and verification for the heavy payload pipeline.
// 3. Expects: A writable state directory and Ed25519 crypto primitives from the crypto module.
// 4. Provides: Canonical manifest payload serialization, a persistent keypair (ModelSigner), and strict manifest verification.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  generateEd25519KeyPair,
  signEd25519,
  verifyEd25519,
  bytesToHex,
  hexToBytes,
  isHexString,
} from '../crypto/index.js';
import type { ModelManifest } from './schema.js';
import { SwISDError } from '../errors.js';

const KEY_FILE_NAME = 'model-signing-key.json';
const ED25519_SIGNATURE_BYTES = 64;

const encoder = new TextEncoder();

export type ManifestSignaturePayload = Omit<ModelManifest, 'signature'>;

/**
 * Canonical serialization of the exact fields covered by the signature.
 * Field order and shape MUST stay in lockstep with the ingest manifest builder,
 * otherwise previously-signed manifests fail verification.
 */
export function buildManifestSignaturePayload(manifest: ManifestSignaturePayload): string {
  return JSON.stringify({
    modelId: manifest.modelId,
    repoId: manifest.repoId,
    files: manifest.files,
    merkleRoot: manifest.merkleRoot,
    totalChunks: manifest.totalChunks,
    totalSizeBytes: manifest.totalSizeBytes,
    chunkSizeBytes: manifest.chunkSizeBytes,
    requiredCapability: manifest.requiredCapability,
    sourcePeerId: manifest.sourcePeerId,
    createdAt: manifest.createdAt,
  });
}

interface StoredKeyPair {
  readonly publicKey: unknown;
  readonly privateKey: unknown;
}

/**
 * Persistent Ed25519 keypair pinned under <stateDir>/model-signing-key.json (hex per Data Purity).
 * Signs manifest payloads and verifies manifests against an unforgeable signature.
 */
export class ModelSigner {
  private publicKey: Uint8Array | null = null;
  private privateKey: Uint8Array | null = null;

  constructor(private readonly stateDir: string) {}

  public async load(): Promise<void> {
    await mkdir(this.stateDir, { recursive: true });
    const keyPath = join(this.stateDir, KEY_FILE_NAME);

    if (existsSync(keyPath)) {
      try {
        const parsed: unknown = JSON.parse(await readFile(keyPath, 'utf-8'));
        if (this.applyStoredKeyPair(parsed)) return;
        console.warn('[ModelSigner] Signing key file is malformed; regenerating a fresh keypair.');
      } catch (error: unknown) {
        console.warn('[ModelSigner] Signing key file unreadable; regenerating a fresh keypair.', error);
      }
    }

    await this.generateAndPersist(keyPath);
  }

  private applyStoredKeyPair(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    const record = value as Record<string, unknown>;
    if (typeof record.publicKey !== 'string' || typeof record.privateKey !== 'string') return false;
    if (!isHexString(record.publicKey) || !isHexString(record.privateKey)) return false;

    try {
      const publicKey = hexToBytes(record.publicKey);
      const privateKey = hexToBytes(record.privateKey);
      if (publicKey.length === 0 || privateKey.length === 0) return false;
      this.publicKey = publicKey;
      this.privateKey = privateKey;
      return true;
    } catch {
      return false;
    }
  }

  private async generateAndPersist(keyPath: string): Promise<void> {
    const keyPair = generateEd25519KeyPair();
    const stored: StoredKeyPair = {
      publicKey: bytesToHex(keyPair.publicKey),
      privateKey: bytesToHex(keyPair.privateKey),
    };
    await writeFile(keyPath, JSON.stringify(stored, null, 2), { mode: 0o600 });
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
    console.log('[ModelSigner] Generated fresh Ed25519 model-signing keypair.');
  }

  private requireKeys(): { readonly publicKey: Uint8Array; readonly privateKey: Uint8Array } {
    if (!this.publicKey || !this.privateKey) {
      throw new SwISDError('ERR_INVALID_STATE', 'ModelSigner used before load(); call load() first.');
    }
    return { publicKey: this.publicKey, privateKey: this.privateKey };
  }

  public async signPayload(payload: string): Promise<Uint8Array> {
    const keys = this.requireKeys();
    return signEd25519(keys.privateKey, encoder.encode(payload));
  }

  public verifyPayload(payload: string, signature: Uint8Array): boolean {
    if (!this.publicKey) return false;
    return verifyEd25519(this.publicKey, encoder.encode(payload), signature);
  }

  public verifyManifest(manifest: ModelManifest): boolean {
    if (manifest.signature.length !== ED25519_SIGNATURE_BYTES) return false;
    return this.verifyPayload(buildManifestSignaturePayload(manifest), manifest.signature);
  }
}
