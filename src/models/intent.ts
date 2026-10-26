// 1. Relative path: src/models/intent.ts
// 2. Description: Persistent registry for download intents, allowing repair of failed or incomplete downloads.
// 3. Expects: A delivery root path.
// 4. Provides: A strictly typed, persistent store for download parameters that survives crashes.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface DownloadIntent {
  readonly modelId: string;
  readonly repoId: string;
  readonly requiredCapability: string;
  readonly sourcePeerId: string;
  readonly totalSizeBytes: number;
  readonly createdAt: number;
}

export class IntentRegistry {
  private intents = new Map<string, DownloadIntent>();
  private readonly statePath: string;
  private readonly stateDir: string;

  constructor(deliveryRoot: string) {
    this.stateDir = join(deliveryRoot, 'state');
    this.statePath = join(this.stateDir, 'download-intents.json');
  }

  public async load(): Promise<void> {
    if (!existsSync(this.stateDir)) await mkdir(this.stateDir, { recursive: true });
    if (!existsSync(this.statePath)) return;
    try {
      const raw = await readFile(this.statePath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, DownloadIntent>;
      for (const [id, intent] of Object.entries(parsed)) {
        this.intents.set(id, intent);
      }
    } catch (err) {
      console.error('[IntentRegistry] Failed to load state:', err);
    }
  }

  public async save(intent: DownloadIntent): Promise<void> {
    this.intents.set(intent.modelId, intent);
    await this.persist();
  }

  public async remove(modelId: string): Promise<void> {
    if (this.intents.delete(modelId)) await this.persist();
  }

  public get(modelId: string): DownloadIntent | undefined {
    return this.intents.get(modelId);
  }

  public getAll(): ReadonlyArray<DownloadIntent> {
    return Array.from(this.intents.values());
  }

  private async persist(): Promise<void> {
    const serializable: Record<string, DownloadIntent> = {};
    for (const [id, intent] of this.intents) {
      serializable[id] = intent;
    }
    await writeFile(this.statePath, JSON.stringify(serializable, null, 2));
  }
}