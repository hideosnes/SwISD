/**
 * 1. Relative path: cockpit/src/lib/server/conductorIdentity.ts
 * 2. Description: Conductor device Ed25519 identity and enrollment client.
 * 3. Expects: A state directory path.
 * 4. Provides: Persistent, lazy-loaded Ed25519 keypair for the Conductor BFF.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { generateEd25519KeyPair, signEd25519 } from '$core/crypto/index.js';
import { bytesToHex, hexToBytes, type HexString } from '$core/crypto/hex.js';
import { DeliveryFilesystemError } from '$core/errors.js';

interface ConductorIdentityFile {
  readonly publicKeyHex: HexString;
  readonly privateKeyHex: HexString;
}

export class ConductorIdentity {
  private readonly cockpitDir: string;
  private readonly identityPath: string;
  private state: ConductorIdentityFile | null = null;

  constructor(stateDir: string) {
    this.cockpitDir = join(stateDir, 'cockpit');
    this.identityPath = join(this.cockpitDir, 'conductor-identity.json');
  }

  public async initialize(): Promise<void> {
    await mkdir(this.cockpitDir, { recursive: true });
    try {
      await access(this.identityPath);
      const raw = await readFile(this.identityPath, 'utf-8');
      const parsed = JSON.parse(raw) as ConductorIdentityFile;
      this.state = parsed;
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        const kp = generateEd25519KeyPair();
        this.state = {
          publicKeyHex: bytesToHex(kp.publicKey),
          privateKeyHex: bytesToHex(kp.privateKey),
        };
        await writeFile(this.identityPath, JSON.stringify(this.state, null, 2), 'utf-8');
      } else {
        throw new DeliveryFilesystemError('Failed to load conductor identity', err);
      }
    }
  }

  public getPublicKeyHex(): HexString {
    if (!this.state) throw new Error('ConductorIdentity not initialized');
    return this.state.publicKeyHex;
  }

  public getKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
    if (!this.state) throw new Error('ConductorIdentity not initialized');
    return {
      publicKey: hexToBytes(this.state.publicKeyHex),
      privateKey: hexToBytes(this.state.privateKeyHex),
    };
  }

  public sign(payload: Uint8Array): Uint8Array {
    if (!this.state) throw new Error('ConductorIdentity not initialized');
    return signEd25519(hexToBytes(this.state.privateKeyHex), payload);
  }
}