// 1. Relative path: src/models/registry.ts
// 2. Description: Persistent, CRDT-backed registry for approved AI models.
// 3. Expects: A delivery root path and signed ModelManifests.
// 4. Provides: A strictly typed, append-only library that survives restarts, with safe removal.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ModelManifest } from './schema.js';
import { bytesToHex, hexToBytes, isHexString } from '../crypto/index.js';
import { SwISDError } from '../errors.js';

export class ModelRegistry {
  private models = new Map<string, ModelManifest>();
  private readonly statePath: string;
  private readonly stateDir: string;

  constructor(
    deliveryRoot: string,
    private readonly verifyManifest?: (manifest: ModelManifest) => boolean
  ) {
    this.stateDir = join(deliveryRoot, 'state');
    this.statePath = join(this.stateDir, 'model-registry.json');
  }

  public async load(): Promise<void> {
    if (!existsSync(this.stateDir)) {
      await mkdir(this.stateDir, { recursive: true });
    }
    if (!existsSync(this.statePath)) return;

    try {
      const raw = await readFile(this.statePath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      for (const [id, rawManifest] of Object.entries(parsed)) {
        const revived = this.reviveManifest(id, rawManifest);
        if (!revived) continue;

        if (this.verifyManifest && !this.verifyManifest(revived)) {
          console.warn(
            `[ModelRegistry] Dropping persisted manifest '${id}': signature verification failed (legacy or tampered state).`
          );
          continue;
        }

        this.models.set(id, revived);
      }
    } catch (err: unknown) {
      console.error('[ModelRegistry] Failed to load state, starting fresh:', err);
    }
  }

  public async add(manifest: ModelManifest): Promise<void> {
    if (this.verifyManifest && !this.verifyManifest(manifest)) {
      throw new SwISDError(
        'ERR_CRYPTO_VERIFICATION_FAILED',
        `Manifest signature verification failed for ${manifest.modelId}; refusing to register.`,
      );
    }
    this.models.set(manifest.modelId, manifest);
    await this.persist();
  }

  public async remove(modelId: string): Promise<void> {
    if (this.models.delete(modelId)) {
      await this.persist();
    }
  }

  public getAll(): ReadonlyArray<ModelManifest> {
    return Array.from(this.models.values());
  }

  public getById(modelId: string): ModelManifest | undefined {
    return this.models.get(modelId);
  }

  private reviveManifest(id: string, rawManifest: unknown): ModelManifest | null {
    if (typeof rawManifest !== 'object' || rawManifest === null) {
      console.warn(`[ModelRegistry] Skipping malformed persisted manifest entry '${id}'.`);
      return null;
    }

    let revivedSignature: Uint8Array = new Uint8Array(0);
    const signature = (rawManifest as Record<string, unknown>).signature;
    if (typeof signature === 'string' && isHexString(signature)) {
      try {
        // Fresh copy into an ArrayBuffer-backed view (same juggling as ed25519.ts).
        revivedSignature = new Uint8Array(hexToBytes(signature));
      } catch (err: unknown) {
        console.warn(`[ModelRegistry] Persisted manifest '${id}' has an undecodable signature; reviving empty.`, err);
      }
    }

    return {
      ...(rawManifest as Omit<ModelManifest, 'signature'>),
      signature: revivedSignature,
    };
  }

  private async persist(): Promise<void> {
    // load() normally creates state/; recreate defensively in case it vanished mid-run.
    await mkdir(this.stateDir, { recursive: true });
    const serializable: Record<string, Record<string, unknown>> = {};
    for (const [id, m] of this.models) {
      serializable[id] = {
        ...m,
        signature: bytesToHex(m.signature)
      };
    }
    await writeFile(this.statePath, JSON.stringify(serializable, null, 2));
  }
}