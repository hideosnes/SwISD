// 1. Relative path: src/models/manager.ts
// 2. Description: Generic, model-agnostic lifecycle manager for local AI pipelines.
// 3. Expects: A ModelRegistry and delivery root.
// 4. Provides: Lazy initialization, local validation, and memory disposal.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ModelRegistry } from './registry.js';

export class ModelManager {
  private loadedPipelines = new Map<string, unknown>();

  constructor(
    private readonly registry: ModelRegistry,
    private readonly deliveryRoot: string
  ) {}

  public checkModelExistsLocally(modelId: string): boolean {
    const manifest = this.registry.getById(modelId);
    if (!manifest) return false;
    const manifestPath = join(this.deliveryRoot, 'models', modelId, 'manifest.json');
    return existsSync(manifestPath);
  }

  public async lazyInit(modelId: string): Promise<unknown> {
    if (this.loadedPipelines.has(modelId)) {
      return this.loadedPipelines.get(modelId);
    }
    if (!this.checkModelExistsLocally(modelId)) {
      throw new Error(`Model ${modelId} not found locally`);
    }
    // Placeholder: In reality, this would load the GGUF/transformers pipeline
    const pipeline = { modelId, loadedAt: Date.now() };
    this.loadedPipelines.set(modelId, pipeline);
    return pipeline;
  }

  public dispose(modelId: string): void {
    this.loadedPipelines.delete(modelId);
  }

  public disposeAll(): void {
    this.loadedPipelines.clear();
  }
}