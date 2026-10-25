// 1. Relative path: cockpit/src/routes/api/models/library/+server.ts
// 2. Description: Dedicated endpoint for the persistent model library with health verification.
// 3. Expects: GET request.
// 4. Provides: The full list of approved, locally persisted models with verified disk status.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json } from '@sveltejs/kit';
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
  readonly healthStatus: 'verified' | 'missing_chunks' | 'not_found';
}

export const GET: RequestHandler = async ({ locals }) => {
  const models = locals.modelRegistry.getAll();
  
  const dtoModels: LibraryModelDto[] = await Promise.all(
    models.map(async (m) => {
      // Strict async resolution to avoid mutable 'let' assignment warnings
      const healthStatus = await (async (): Promise<'verified' | 'missing_chunks' | 'not_found'> => {
        try {
          const exists = await locals.modelManager.checkModelExistsLocally(m.modelId);
          return exists ? 'verified' : 'missing_chunks';
        } catch {
          return 'not_found';
        }
      })();

      return {
        modelId: m.modelId,
        repoId: m.repoId,
        displayName: m.displayName,
        pipelineTag: m.pipelineTag,
        tags: m.tags,
        requiredCapability: m.requiredCapability,
        totalSizeBytes: m.totalSizeBytes,
        createdAt: m.createdAt,
        healthStatus,
      };
    })
  );

  return json({ models: dtoModels });
};