/**
 * 1. Relative path: src/delivery/identity.ts
 * 2. Description: Manages the persistent peer identity and hostname for the SwISD node, ensuring it survives release updates.
 * 3. Expects: The delivery root path to locate the immutable state directory.
 * 4. Provides: Lazy-loaded, persistent Ed25519 keypair management and hostname persistence.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { hostname as osHostname } from 'node:os';
import { generateEd25519KeyPair, type Ed25519KeyPair } from '../crypto/index.js';
import { bytesToHex, hexToBytes, type HexString } from '../crypto/hex.js';
import { DeliveryFilesystemError } from '../errors.js';

export interface IdentityState {
  readonly peerId: string;
  readonly hostname: string;
  readonly publicKeyDer: Uint8Array;
  readonly privateKeyDer: Uint8Array;
  readonly createdAt: number;
}

export class IdentityManager {
  private readonly stateDir: string;
  private readonly identityPath: string;
  private cachedIdentity: IdentityState | null = null;

  constructor(deliveryRoot: string) {
    this.stateDir = join(deliveryRoot, 'state');
    this.identityPath = join(this.stateDir, 'identity.json');
  }

  public async ensureStateDir(): Promise<void> {
    try {
      await mkdir(this.stateDir, { recursive: true });
    } catch (error: unknown) {
      throw new DeliveryFilesystemError(`Failed to create state directory: ${this.stateDir}`, error);
    }
  }

  public async getOrCreateIdentity(): Promise<IdentityState> {
    if (this.cachedIdentity) {
      return this.cachedIdentity;
    }

    try {
      await access(this.identityPath);
      const raw = await readFile(this.identityPath, { encoding: 'utf-8' });
      const parsed = JSON.parse(raw) as unknown;
      
      if (this.isValidIdentity(parsed)) {
        this.cachedIdentity = {
          peerId: parsed.peerId,
          hostname: parsed.hostname || osHostname(), // Fallback for legacy identities
          publicKeyDer: hexToBytes(parsed.publicKeyHex as HexString),
          privateKeyDer: hexToBytes(parsed.privateKeyHex as HexString),
          createdAt: parsed.createdAt,
        };
        return this.cachedIdentity;
      }
    } catch {
      // File missing or invalid, proceed to generate new identity
    }

    // First-boot identity creation
    const keyPair = generateEd25519KeyPair();
    const envHostname = process.env.SWISD_HOSTNAME;
    const newIdentity: IdentityState = {
      peerId: `swisd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
      hostname: envHostname || osHostname(),
      publicKeyDer: keyPair.publicKey,
      privateKeyDer: keyPair.privateKey,
      createdAt: Date.now(),
    };

    await this.saveIdentity(newIdentity);
    this.cachedIdentity = newIdentity;
    console.log('[Identity] Generated new first-boot peer identity:', newIdentity.peerId, 'hostname:', newIdentity.hostname);
    return newIdentity;
  }

  private isValidIdentity(data: unknown): data is { peerId: string; hostname?: string; publicKeyHex: string; privateKeyHex: string; createdAt: number } {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.peerId === 'string' &&
      typeof obj.publicKeyHex === 'string' &&
      typeof obj.privateKeyHex === 'string' &&
      typeof obj.createdAt === 'number'
    );
  }

  private async saveIdentity(identity: IdentityState): Promise<void> {
    try {
      const serializable = {
        peerId: identity.peerId,
        hostname: identity.hostname,
        publicKeyHex: bytesToHex(identity.publicKeyDer),
        privateKeyHex: bytesToHex(identity.privateKeyDer),
        createdAt: identity.createdAt,
      };
      await writeFile(this.identityPath, JSON.stringify(serializable, null, 2), { encoding: 'utf-8' });
    } catch (error: unknown) {
      throw new DeliveryFilesystemError(`Failed to persist peer identity to ${this.identityPath}`, error);
    }
  }

  public async setHostname(newHostname: string): Promise<void> {
    if (!this.cachedIdentity) {
      throw new DeliveryFilesystemError('Identity not initialized');
    }
    const updated: IdentityState = {
      ...this.cachedIdentity,
      hostname: newHostname,
    };
    await this.saveIdentity(updated);
    this.cachedIdentity = updated;
    console.log('[Identity] Updated hostname to:', newHostname);
  }

  public getHostname(): string {
    return this.cachedIdentity?.hostname || osHostname();
  }
}