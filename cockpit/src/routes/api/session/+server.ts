/**
 * 1. Relative path: cockpit/src/routes/api/session/+server.ts
 * 2. Description: POST endpoint to manage the UI-only session lock.
 * 3. Expects: JSON body with `action` ('lock' | 'unlock' | 'set') and optional `phrase`.
 * 4. Provides: Success boolean and lock state.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

interface SessionBody {
  readonly action: 'lock' | 'unlock' | 'set';
  readonly phrase?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as SessionBody;
  
  if (body.action === 'set') {
    if (!body.phrase) throw error(400, 'Missing phrase for set action');
    await locals.sessionLock.setPassword(body.phrase);
    return json({ success: true, locked: false });
  }
  
  if (body.action === 'lock') {
    locals.sessionLock.lock();
    return json({ success: true, locked: true });
  }
  
  if (body.action === 'unlock') {
    if (!body.phrase) throw error(400, 'Missing phrase for unlock action');
    const ok = await locals.sessionLock.verify(body.phrase);
    if (!ok) throw error(401, 'Invalid session password');
    return json({ success: true, locked: false });
  }

  throw error(400, 'Invalid action');
};