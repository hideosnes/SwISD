// 1. Relative path: cockpit/src/routes/api/peers/+server.ts
// 2. Description: API endpoint to query and manage the cryptographic trust state of discovered swarm peers.
// 3. Expects: GET for listing peers, POST for updating trust state.
// 4. Provides: Strict DTOs for the Pending Trust UI panel.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const peers = locals.coreSource.getPeerInfo();
  return json({ peers });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json() as unknown;
  
  if (typeof body !== 'object' || body === null) {
    throw error(400, 'Invalid request body');
  }

  const { peerId, action } = body as Record<string, unknown>;

  if (typeof peerId !== 'string' || (action !== 'trust' && action !== 'reject')) {
    throw error(400, 'Missing peerId or invalid action');
  }

  const registry = locals.trustRegistry;
  if (!registry) {
    throw error(500, 'Trust registry not initialized');
  }

  if (action === 'trust') {
    registry.trustPeer(peerId);
  } else {
    registry.rejectPeer(peerId);
  }

  return json({ success: true });
};