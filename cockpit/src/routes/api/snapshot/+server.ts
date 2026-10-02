/**
 * 1. Relative path: cockpit/src/routes/api/snapshot/+server.ts
 * 2. Description: BFF API route serving the strict SwarmSnapshot DTO.
 * 3. Expects: GET request from the cockpit client.
 * 4. Provides: A JSON-serialized SwarmSnapshot.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import type { RequestHandler } from './$types.js';
import { buildSwarmSnapshot } from '$core/observability/index.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const snapshot = buildSwarmSnapshot(
    locals.coreSource, 
    locals.eventBus, 
    locals.isReplay ? 'replay' : 'live'
  );
  return json(snapshot);
};