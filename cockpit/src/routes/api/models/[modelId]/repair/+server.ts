// 1. Relative path: cockpit/src/routes/api/models/[modelId]/repair/+server.ts
// 2. Description: Triggers the repair pipeline for a failed or incomplete model download.
// 3. Expects: POST request with modelId in params.
// 4. Provides: Re-initiation of the download pipeline using the persisted intent.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ params, locals }) => {
  const { modelId } = params;
  if (!modelId) {
    throw error(400, 'Missing modelId');
  }

  try {
    await locals.modelManager.repairModel(modelId);
    return json({ success: true, modelId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ERR_MODEL_NOT_FOUND')) {
      throw error(404, 'No download intent found. Cannot repair.');
    }
    throw error(500, `Failed to repair model: ${msg}`);
  }
};