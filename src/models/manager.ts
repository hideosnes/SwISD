// 1. Relative path: src/models/manager.ts
// 2. Description: Generic, model-agnostic lifecycle manager for local AI pipelines. 
// 3. Expects: A ModelRegistry, IntentRegistry, ModelDownloader, and delivery root.
// 4. Provides: Lazy initialization, elegant local validation, safe disposal, and repair of failed downloads.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { existsSync } from 'node:fs';
import { statfs, rm, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chunkFileName } from './framing.js';
import type { ModelRegistry } from './registry.js';
import type { IntentRegistry } from './intent.js';
import type { ModelDownloader } from './downloader.js';
import type { ModelManifest, ModelFile } from './schema.js';
import { fetchHuggingFaceMetadata } from './huggingface.js';
import { SwISDError } from '../errors.js';
import type { CredentialManager } from '../config/credentials.js';

export interface PipelineInstance {
  readonly modelId: string;
  dispose(): Promise<void> | void;
}

interface PipelineState {
  readonly manifest: ModelManifest;
  readonly instance: PipelineInstance;
  readonly loadedAt: number;
  lastAccessed: number;
  activeTasks: number;
}

export class PipelineHandle {
  constructor(
    private readonly manager: ModelManager,
    public readonly manifest: ModelManifest,
    public readonly instance: PipelineInstance
  ) {}

  public release(): void {
    this.manager.release(this.manifest.modelId);
    Object.freeze(this);
  }
}

export class ModelManager {
  private readonly pipelines = new Map<string, PipelineState>();
  private readonly loadingPromises = new Map<string, Promise<PipelineState>>();
  private readonly STORAGE_WATERMARK_RATIO = 0.90;

  constructor(
    private readonly registry: ModelRegistry,
    private readonly intentRegistry: IntentRegistry,
    private readonly downloader: ModelDownloader,
    private readonly deliveryRoot: string,
    private readonly credentialManager: CredentialManager
  ) {}

  public async checkModelExistsLocally(modelId: string): Promise<boolean> {
    const manifest = this.registry.getById(modelId);
    if (!manifest) return false;

    const modelDir = join(this.deliveryRoot, 'models', modelId);

    // One async directory listing instead of one synchronous existsSync per chunk:
    // a multi-GB model is tens of thousands of chunks, and sync stat calls on the
    // request path would stall the BFF event loop.
    let entries: string[];
    try {
      entries = await readdir(modelDir);
    } catch {
      return false;
    }

    const presentFiles = new Set(entries);
    if (!presentFiles.has('manifest.json')) return false;

    for (let i = 0; i < manifest.totalChunks; i++) {
      if (!presentFiles.has(chunkFileName(i))) {
        return false;
      }
    }

    return true;
  }

  public async repairModel(modelId: string): Promise<void> {
    const intent = this.intentRegistry.get(modelId);
    if (!intent) {
      throw new SwISDError('ERR_MODEL_NOT_FOUND', `No download intent found for ${modelId}. Cannot repair.`);
    }

    // Fetch ground-truth metadata from HuggingFace to ensure accurate file sizes
    const token = this.credentialManager.getHuggingFaceToken();
    const metadata = await fetchHuggingFaceMetadata(intent.repoId, token);

    // Map metadata to ModelFile array for the downloader
    const selectedFiles: ReadonlyArray<ModelFile> = metadata.files.map(f => ({
      path: f.rfilename,
      sizeBytes: f.sizeBytes ?? 0,
      isRequired: true,
    }));

    // Fire and forget the download. startDownload handles directory purging internally.
    this.downloader.startDownload(
      intent.repoId,
      selectedFiles,
      intent.requiredCapability,
      intent.sourcePeerId
    ).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ModelManager] Repair download failed for ${modelId}:`, msg);
    });
  }

  public async acquire(modelId: string): Promise<PipelineHandle> {
    const manifest = this.registry.getById(modelId);
    if (!manifest) {
      throw new SwISDError('ERR_MODEL_NOT_FOUND', `Model ${modelId} not in registry`);
    }

    const existing = this.pipelines.get(modelId);
    if (existing) {
      existing.activeTasks += 1;
      existing.lastAccessed = Date.now();
      return new PipelineHandle(this, manifest, existing.instance);
    }

    const existingLoad = this.loadingPromises.get(modelId);
    if (existingLoad) {
      const state = await existingLoad;
      state.activeTasks += 1;
      state.lastAccessed = Date.now();
      return new PipelineHandle(this, manifest, state.instance);
    }

    const loadPromise = this.loadPipeline(modelId, manifest);
    this.loadingPromises.set(modelId, loadPromise);

    try {
      const state = await loadPromise;
      return new PipelineHandle(this, manifest, state.instance);
    } finally {
      this.loadingPromises.delete(modelId);
    }
  }

  public release(modelId: string): void {
    const state = this.pipelines.get(modelId);
    if (!state) return;

    state.activeTasks -= 1;
    state.lastAccessed = Date.now();

    if (state.activeTasks <= 0) {
      state.activeTasks = 0;
    }
  }

  public async dispose(modelId: string): Promise<void> {
    const state = this.pipelines.get(modelId);
    if (!state) return;

    if (state.activeTasks > 0) {
      throw new SwISDError(
        'ERR_MODEL_IN_USE', 
        `Cannot dispose model ${modelId}: ${state.activeTasks} active task(s) are currently executing.`
      );
    }

    await state.instance.dispose();
    this.pipelines.delete(modelId);
  }

  public async deleteModel(modelId: string): Promise<void> {
    const manifest = this.registry.getById(modelId);
    const intent = this.intentRegistry.get(modelId);

    if (!manifest && !intent) {
      throw new SwISDError('ERR_MODEL_NOT_FOUND', `Model ${modelId} not found in registry or intents`);
    }

    const state = this.pipelines.get(modelId);
    if (state && state.activeTasks > 0) {
      throw new SwISDError(
        'ERR_MODEL_IN_USE', 
        `Cannot delete model ${modelId}: ${state.activeTasks} active task(s) are currently executing.`
      );
    }

    if (state) {
      await state.instance.dispose();
      this.pipelines.delete(modelId);
    }

    const modelDir = resolve(join(this.deliveryRoot, 'models', modelId));
    if (existsSync(modelDir)) {
      try {
        await rm(modelDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new SwISDError('ERR_DELETION_FAILED', `Failed to purge model directory ${modelId}: ${msg}`, err);
      }
    }

    if (manifest) await this.registry.remove(modelId);
    if (intent) await this.intentRegistry.remove(modelId);
  }

  public async enforceStorageWatermark(): Promise<void> {
    let stats: import('node:fs').StatsFs;
    try {
      stats = await statfs(this.deliveryRoot);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new SwISDError('ERR_STORAGE_CHECK', `Failed to read disk stats: ${msg}`, err);
    }

    const totalBytes = Number(stats.bsize) * Number(stats.blocks);
    const freeBytes = Number(stats.bsize) * Number(stats.bfree);
    
    if (totalBytes === 0) return;

    const usedBytes = totalBytes - freeBytes;
    const usageRatio = usedBytes / totalBytes;

    if (usageRatio > this.STORAGE_WATERMARK_RATIO) {
      await this.evictOldestIdleModelFromDisk();
    }
  }

  private async loadPipeline(modelId: string, manifest: ModelManifest): Promise<PipelineState> {
    if (!(await this.checkModelExistsLocally(modelId))) {
      throw new SwISDError('ERR_MODEL_CORRUPT', `Model ${modelId} is missing chunks on disk`);
    }

    const instance: PipelineInstance = {
      modelId,
      dispose: async () => {}
    };

    const state: PipelineState = {
      manifest,
      instance,
      loadedAt: Date.now(),
      lastAccessed: Date.now(),
      activeTasks: 1,
    };

    this.pipelines.set(modelId, state);
    return state;
  }

  private async evictOldestIdleModelFromDisk(): Promise<void> {
    const allModels = this.registry.getAll();
    
    const idleModels = allModels.filter(m => {
      const state = this.pipelines.get(m.modelId);
      return !state || state.activeTasks === 0;
    });

    if (idleModels.length === 0) {
      throw new SwISDError('ERR_STORAGE_FULL', 'Storage watermark breached, but all models are actively executing. Cannot evict.');
    }

    idleModels.sort((a, b) => {
      const stateA = this.pipelines.get(a.modelId);
      const stateB = this.pipelines.get(b.modelId);
      const timeA = stateA ? stateA.lastAccessed : 0;
      const timeB = stateB ? stateB.lastAccessed : 0;
      return timeA - timeB;
    });

    const victim = idleModels[0];
    if (!victim) return;

    const modelDir = join(this.deliveryRoot, 'models', victim.modelId);
    
    try {
      const state = this.pipelines.get(victim.modelId);
      if (state) {
        await state.instance.dispose();
        this.pipelines.delete(victim.modelId);
      }

      await rm(modelDir, { recursive: true, force: true });
      await this.registry.remove(victim.modelId);
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new SwISDError('ERR_EVICTION_FAILED', `Failed to evict model ${victim.modelId}: ${msg}`, err);
    }
  }
}