// 1. Relative path: src/models/manager.ts
// 2. Description: Generic, model-agnostic lifecycle manager for local AI pipelines. 
//    Enforces RAII-style acquisition, promise deduplication, active-task eviction protection, 
//    and ruthless storage watermark enforcement.
// 3. Expects: A ModelRegistry, delivery root, and strictly typed executor instantiation logic.
// 4. Provides: Lazy initialization, elegant local validation, and safe memory/disk disposal.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { existsSync } from 'node:fs';
import { statfs, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModelRegistry } from './registry.js';
import type { ModelManifest } from './schema.js';
import { SwISDError } from '../errors.js';

/**
 * The abstract contract for a loaded pipeline instance. 
 * Executors must implement this to be managed by the Model Manager.
 */
export interface PipelineInstance {
  readonly modelId: string;
  dispose(): Promise<void> | void;
}

/**
 * Internal state tracking for LRU and concurrency protection.
 */
interface PipelineState {
  readonly manifest: ModelManifest;
  readonly instance: PipelineInstance;
  readonly loadedAt: number;
  lastAccessed: number;
  activeTasks: number;
}

/**
 * The RAII handle returned to callers. Guarantees safe release.
 * Callers must invoke `release()` when the pipeline is no longer needed.
 */
export class PipelineHandle {
  constructor(
    private readonly manager: ModelManager,
    public readonly manifest: ModelManifest,
    public readonly instance: PipelineInstance
  ) {}

  public release(): void {
    this.manager.release(this.manifest.modelId);
    Object.freeze(this); // Prevent further use after release
  }
}

export class ModelManager {
  private readonly pipelines = new Map<string, PipelineState>();
  private readonly loadingPromises = new Map<string, Promise<PipelineState>>();
  private readonly STORAGE_WATERMARK_RATIO = 0.90; // 90% disk usage triggers eviction

  constructor(
    private readonly registry: ModelRegistry,
    private readonly deliveryRoot: string
  ) {}

  /**
   * Beautifully elegant local validation.
   * Verifies not just the manifest, but the existence of every critical chunk.
   */
  public async checkModelExistsLocally(modelId: string): Promise<boolean> {
    const manifest = this.registry.getById(modelId);
    if (!manifest) return false;

    const modelDir = join(this.deliveryRoot, 'models', modelId);
    const manifestPath = join(modelDir, 'manifest.json');

    if (!existsSync(manifestPath)) return false;

    // Ruthless verification: ensure all expected chunks exist on disk
    for (let i = 0; i < manifest.totalChunks; i++) {
      const chunkName = `chunk_${i.toString().padStart(4, '0')}.bin`;
      if (!existsSync(join(modelDir, chunkName))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Acquires a pipeline handle. 
   * Handles lazy initialization, promise deduplication, and active-task tracking.
   */
  public async acquire(modelId: string): Promise<PipelineHandle> {
    const manifest = this.registry.getById(modelId);
    if (!manifest) {
      throw new SwISDError('ERR_MODEL_NOT_FOUND', `Model ${modelId} not in registry`);
    }

    // 1. Check if already loaded
    const existing = this.pipelines.get(modelId);
    if (existing) {
      existing.activeTasks += 1;
      existing.lastAccessed = Date.now();
      return new PipelineHandle(this, manifest, existing.instance);
    }

    // 2. Promise deduplication: if already loading, wait for it
    const existingLoad = this.loadingPromises.get(modelId);
    if (existingLoad) {
      const state = await existingLoad;
      state.activeTasks += 1;
      state.lastAccessed = Date.now();
      return new PipelineHandle(this, manifest, state.instance);
    }

    // 3. Lazy initialization
    const loadPromise = this.loadPipeline(modelId, manifest);
    this.loadingPromises.set(modelId, loadPromise);

    try {
      const state = await loadPromise;
      return new PipelineHandle(this, manifest, state.instance);
    } finally {
      this.loadingPromises.delete(modelId);
    }
  }

  /**
   * Releases a pipeline handle. Decrements active tasks.
   * If active tasks reach 0, the pipeline becomes eligible for LRU eviction.
   */
  public release(modelId: string): void {
    const state = this.pipelines.get(modelId);
    if (!state) return; // Already disposed or never loaded

    state.activeTasks -= 1;
    state.lastAccessed = Date.now();

    if (state.activeTasks <= 0) {
      state.activeTasks = 0; // Clamp to prevent negative values from buggy releases
    }
  }

  /**
   * Explicitly disposes a pipeline. 
   * Will throw if the pipeline is currently executing tasks (activeTasks > 0).
   */
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

  /**
   * Enforces local storage watermarks. 
   * If disk usage exceeds 90%, evicts the oldest IDLE model from disk.
   */
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
    
    if (totalBytes === 0) return; // Safety fallback

    const usedBytes = totalBytes - freeBytes;
    const usageRatio = usedBytes / totalBytes;

    if (usageRatio > this.STORAGE_WATERMARK_RATIO) {
      await this.evictOldestIdleModelFromDisk();
    }
  }

  // --- Private Methods ---

  private async loadPipeline(modelId: string, manifest: ModelManifest): Promise<PipelineState> {
    if (!(await this.checkModelExistsLocally(modelId))) {
      throw new SwISDError('ERR_MODEL_CORRUPT', `Model ${modelId} is missing chunks on disk`);
    }

    // TODO: Inject actual executor instantiation here based on manifest.requiredCapability.
    // For now, we return a mock instance that satisfies the PipelineInstance contract.
    const instance: PipelineInstance = {
      modelId,
      dispose: async () => {
        // Actual framework teardown (e.g., tensor memory release) goes here
      }
    };

    const state: PipelineState = {
      manifest,
      instance,
      loadedAt: Date.now(),
      lastAccessed: Date.now(),
      activeTasks: 1, // Acquire immediately increments this
    };

    this.pipelines.set(modelId, state);
    return state;
  }

  private async evictOldestIdleModelFromDisk(): Promise<void> {
    const allModels = this.registry.getAll();
    
    // Filter to ONLY idle models (not in memory, or in memory with activeTasks === 0)
    const idleModels = allModels.filter(m => {
      const state = this.pipelines.get(m.modelId);
      return !state || state.activeTasks === 0;
    });

    if (idleModels.length === 0) {
      throw new SwISDError('ERR_STORAGE_FULL', 'Storage watermark breached, but all models are actively executing. Cannot evict.');
    }

    // Sort by lastAccessed ascending (oldest first)
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
      // 1. Remove from memory if present
      const state = this.pipelines.get(victim.modelId);
      if (state) {
        await state.instance.dispose();
        this.pipelines.delete(victim.modelId);
      }

      // 2. Ruthlessly delete from disk
      await rm(modelDir, { recursive: true, force: true });

      // Note: In a full CRDT setup, this would emit a tombstone to the ModelRegistryCRDT.
      // For local registry management, the missing chunks will cause checkModelExistsLocally to fail next time.
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new SwISDError('ERR_EVICTION_FAILED', `Failed to evict model ${victim.modelId}: ${msg}`, err);
    }
  }
}