// 1. Relative path: cockpit/src/routes/api/scenario/+server.ts
// 2. Description: DEV-only BFF API route for controlling the Scenario Replay engine.
// 3. Expects: POST requests with action payloads (play, pause, speed).
// 4. Provides: Control surface for the replay tape recorder.

import type { RequestHandler } from './$types.js';
import { json, error } from '@sveltejs/kit';
import { SCENARIOS } from '$core/observability/index.js';

export const GET: RequestHandler = async ({ locals }) => {
  if (!import.meta.env.DEV) throw error(404, 'Not found');
  
  return json({
    active: locals.isReplay,
    scenarios: SCENARIOS.map(s => ({ id: s.id, title: s.title, durationMs: s.durationMs })),
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!import.meta.env.DEV) throw error(404, 'Not found');
  if (!locals.isReplay || !locals.replayEngine) {
    throw error(400, 'Replay mode is not active. Set SWISD_REPLAY env var.');
  }

  const body = await request.json() as { action: 'play' | 'pause' | 'speed', value?: number };
  
  if (body.action === 'play') locals.replayEngine.play();
  else if (body.action === 'pause') locals.replayEngine.pause();
  else if (body.action === 'speed' && typeof body.value === 'number') locals.replayEngine.setSpeed(body.value);
  else throw error(400, 'Invalid action');

  return json({ success: true });
};