// 1. Relative path: cockpit/src/routes/api/models/library/+server.ts
// 2. Description: Dedicated endpoint for the persistent model library.
// 3. Expects: GET request.
// 4. Provides: The full list of approved, locally persisted models.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const models = locals.modelRegistry.getAll();
  return json({ models });
};