// 1. Relative path: cockpit/src/routes/api/models/[modelId]/+server.ts
// 2. Description: Deletes a locally stored model from the registry and disk.
// 3. Expects: DELETE request with modelId in params.
// 4. Provides: Confirmation of deletion or strict error if in use/not found.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { modelId } = params;
  
  if (!modelId) {
    throw error(400, 'Missing modelId');
  }

  try {
    await locals.modelManager.deleteModel(modelId);
    return json({ success: true, modelId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    
    if (msg.includes('ERR_MODEL_IN_USE')) {
      throw error(409, 'Model is currently in use and cannot be deleted.');
    }
    if (msg.includes('ERR_MODEL_NOT_FOUND')) {
      throw error(404, 'Model not found in registry.');
    }
    
    throw error(500, `Failed to delete model: ${msg}`);
  }
};