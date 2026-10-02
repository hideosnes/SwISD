/**
 * 1. Relative path: cockpit/src/routes/api/session/status/+server.ts
 * 2. Description: GET endpoint to query the UI-only session lock state.
 * 3. Expects: N/A
 * 4. Provides: Strict DTO for the SessionLockOverlay.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  return json({
    locked: locals.sessionLock.isLocked(),
    hasPassword: locals.sessionLock.hasPassword(),
  });
};