// 1. Relative path: cockpit/src/routes/api/snapshot/+server.ts
// 2. Description: API endpoint that proxies the core's observability snapshot to the frontend.
// 3. Expects: A valid SvelteKit RequestEvent with initialized core locals.
// 4. Provides: A strictly typed, JSON-serializable ObservabilitySnapshot for the Svelte 5 frontend to consume.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { buildObservabilitySnapshot } from '../../../../../src/observability/index.js';

export const GET: RequestHandler = async ({ locals }) => {
  const { coreSource, eventBus } = locals;
  
  const snapshot = buildObservabilitySnapshot(coreSource, eventBus);
  
  return json(snapshot);
};