// 1. Relative path: src/models/registry.ts
// 2. Description: Persistent, CRDT-backed registry for approved AI models.
// 3. Expects: A delivery root path and signed ModelManifests.
// 4. Provides: A strictly typed, append-only library that survives restarts.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ModelManifest } from './schema.js';

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export class ModelRegistry {
  private models = new Map<string, ModelManifest>();
  private readonly statePath: string;
  private readonly stateDir: string;

  constructor(deliveryRoot: string) {
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
      const parsed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      
      for (const [id, rawManifest] of Object.entries(parsed)) {
        const signature = rawManifest.signature;
        const revivedSignature = typeof signature === 'string' 
          ? hexToUint8Array(signature) 
          : new Uint8Array(0);
          
        this.models.set(id, {
          ...(rawManifest as Omit<ModelManifest, 'signature'>),
          signature: revivedSignature,
        });
      }
    } catch (err) {
      console.error('[ModelRegistry] Failed to load state, starting fresh:', err);
    }
  }

  public async add(manifest: ModelManifest): Promise<void> {
    this.models.set(manifest.modelId, manifest);
    await this.persist();
  }

  public getAll(): ReadonlyArray<ModelManifest> {
    return Array.from(this.models.values());
  }

  public getById(modelId: string): ModelManifest | undefined {
    return this.models.get(modelId);
  }

  private async persist(): Promise<void> {
    const serializable: Record<string, Record<string, unknown>> = {};
    for (const [id, m] of this.models) {
      serializable[id] = { 
        ...m, 
        signature: uint8ArrayToHex(m.signature) 
      };
    }
    await writeFile(this.statePath, JSON.stringify(serializable, null, 2));
  }
}