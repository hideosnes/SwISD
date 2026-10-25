// 1. Relative path: cockpit/src/routes/api/models/rename/+server.ts
// 2. Description: Updates the display name of a locally stored model in the registry.
// 3. Expects: POST request with `modelId` and optional `displayName`.
// 4. Provides: Updated model manifest persistence.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

interface RenameRequestBody {
  readonly modelId: string;
  readonly displayName?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as RenameRequestBody;
  
  if (!body.modelId) {
    throw error(400, 'Missing modelId');
  }

  const manifest = locals.modelRegistry.getById(body.modelId);
  if (!manifest) {
    throw error(404, 'Model not found in registry');
  }

  // Create a new manifest with the updated displayName. 
  // In a full CRDT setup, this is an idempotent update operation on the OR-Map.
  const updatedManifest = {
    ...manifest,
    displayName: body.displayName?.trim() || undefined,
  };

  // Assuming the registry supports an 'add' or 'update' method for idempotent upserts
  await locals.modelRegistry.add(updatedManifest);

  return json({ success: true, modelId: body.modelId, displayName: updatedManifest.displayName });
};