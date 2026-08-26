// 1. Relative path: src/delivery/identity.ts
// 2. Description: Manages the persistent peer identity for the SwISD node, ensuring it survives release updates.
// 3. Expects: The delivery root path to locate the immutable state directory.
// 4. Provides: Lazy-loaded, persistent Ed25519 keypair management, generating a new identity only on first boot.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { generateEd25519KeyPair, type Ed25519KeyPair } from '../crypto/index.js';
import { DeliveryFilesystemError } from '../errors.js';

export interface IdentityState {
  readonly peerId: string;
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
    } catch (error) {
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
          publicKeyDer: new Uint8Array(parsed.publicKeyDer),
          privateKeyDer: new Uint8Array(parsed.privateKeyDer),
          createdAt: parsed.createdAt,
        };
        return this.cachedIdentity;
      }
    } catch {
      // File missing or invalid, proceed to generate new identity
    }

    // First-boot identity creation
    const keyPair = generateEd25519KeyPair();
    const newIdentity: IdentityState = {
      peerId: `swisd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
      publicKeyDer: keyPair.publicKey,
      privateKeyDer: keyPair.privateKey,
      createdAt: Date.now(),
    };

    await this.saveIdentity(newIdentity);
    this.cachedIdentity = newIdentity;
    
    console.log('[Identity] Generated new first-boot peer identity:', newIdentity.peerId);
    return newIdentity;
  }

  private isValidIdentity(data: unknown): data is { peerId: string; publicKeyDer: number[]; privateKeyDer: number[]; createdAt: number } {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.peerId === 'string' &&
      Array.isArray(obj.publicKeyDer) &&
      Array.isArray(obj.privateKeyDer) &&
      typeof obj.createdAt === 'number'
    );
  }

  private async saveIdentity(identity: IdentityState): Promise<void> {
    try {
      // Convert Uint8Array to regular number array for safe JSON serialization
      const serializable = {
        peerId: identity.peerId,
        publicKeyDer: Array.from(identity.publicKeyDer),
        privateKeyDer: Array.from(identity.privateKeyDer),
        createdAt: identity.createdAt,
      };
      await writeFile(this.identityPath, JSON.stringify(serializable, null, 2), { encoding: 'utf-8' });
    } catch (error) {
      throw new DeliveryFilesystemError(`Failed to persist peer identity to ${this.identityPath}`, error);
    }
  }
}