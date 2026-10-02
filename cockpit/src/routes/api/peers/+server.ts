/**
 * 1. Relative path: cockpit/src/routes/api/peers/+server.ts
 * 2. Description: API endpoint to query and manage the cryptographic trust state of discovered swarm peers.
 * 3. Expects: GET for listing peers, POST for updating trust state.
 * 4. Provides: Strict DTOs for the Pending Trust UI panel.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

interface TrustRequestBody {
  readonly peerId: string;
  readonly action: 'trust' | 'reject';
}

export const GET: RequestHandler = async ({ locals }) => {
  const peers = locals.coreSource.getPeerInfo();
  return json({ peers });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as TrustRequestBody;

  if (!body.peerId || (body.action !== 'trust' && body.action !== 'reject')) {
    throw error(400, 'Missing peerId or invalid action');
  }

  if (body.action === 'trust') {
    locals.trustRegistry.trustPeer(body.peerId);
  } else {
    locals.trustRegistry.rejectPeer(body.peerId);
  }

  return json({ success: true });
};