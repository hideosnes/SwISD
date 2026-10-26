// 1. Relative path: cockpit/src/routes/api/models/library/+server.ts
// 2. Description: Dedicated endpoint for the persistent model library and failed download intents.
// 3. Expects: GET request.
// 4. Provides: The full list of approved models and repairable failed downloads.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json } from '@sveltejs/kit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { RequestHandler } from './$types.js';

export interface LibraryModelDto {
  readonly modelId: string;
  readonly repoId: string;
  readonly displayName?: string;
  readonly pipelineTag?: string | null;
  readonly tags?: ReadonlyArray<string>;
  readonly requiredCapability: string;
  readonly totalSizeBytes: number;
  readonly createdAt: number;
  readonly healthStatus: 'verified' | 'missing_chunks' | 'not_found' | 'failed';
  readonly isRepairable: boolean;
  readonly sourcePeerId?: string;
}

export const GET: RequestHandler = async ({ locals }) => {
  const models = locals.modelRegistry.getAll();
  const intents = locals.intentRegistry.getAll();
  const map = new Map<string, LibraryModelDto>();

  for (const m of models) {
    // Strict async resolution to avoid mutable 'let' assignment warnings
    const healthStatus = await (async (): Promise<'verified' | 'missing_chunks' | 'not_found'> => {
      try {
        const exists = await locals.modelManager.checkModelExistsLocally(m.modelId);
        return exists ? 'verified' : 'missing_chunks';
      } catch {
        return 'not_found';
      }
    })();

    map.set(m.modelId, {
      modelId: m.modelId,
      repoId: m.repoId,
      displayName: m.displayName,
      pipelineTag: m.pipelineTag,
      tags: m.tags,
      requiredCapability: m.requiredCapability,
      totalSizeBytes: m.totalSizeBytes,
      createdAt: m.createdAt,
      healthStatus,
      isRepairable: healthStatus === 'missing_chunks',
      sourcePeerId: m.sourcePeerId
    });
  }

  for (const intent of intents) {
    if (!map.has(intent.modelId)) {
      const modelDir = join(locals.deliveryRoot, 'models', intent.modelId);
      let healthStatus: 'failed' | 'missing_chunks' = 'failed';
      
      if (existsSync(modelDir)) {
        const manifestPath = join(modelDir, 'manifest.json');
        if (existsSync(manifestPath)) {
          healthStatus = 'missing_chunks';
        }
      }

      map.set(intent.modelId, {
        modelId: intent.modelId,
        repoId: intent.repoId,
        requiredCapability: intent.requiredCapability,
        totalSizeBytes: intent.totalSizeBytes,
        createdAt: intent.createdAt,
        healthStatus,
        isRepairable: true,
        sourcePeerId: intent.sourcePeerId
      });
    }
  }

  return json({ models: Array.from(map.values()) });
};