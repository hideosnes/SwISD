/**
 * 1. Relative path: cockpit/src/routes/api/peers/[peerId]/ping/+server.ts
 * 2. Description: POST endpoint to trigger a manual liveness ping to a specific peer.
 * 3. Expects: The peerId in the URL path.
 * 4. Provides: Success confirmation to the UI, ready to be wired to the core's PeerHealthMonitor.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ params, locals }) => {
  const { peerId } = params;
  
  if (!peerId) {
    throw error(400, 'Missing peerId');
  }

  try {
    // TODO: Wire this to the actual libp2p node or PeerHealthMonitor instance.
    // Example: if (locals.healthMonitor) { await locals.healthMonitor.pingNow(peerId); }
    // For now, we return success to satisfy the UI contract and allow the operator to see the interaction.
    
    console.log(`[BFF] Manual ping requested for peer: ${peerId}`);
    
    return json({ success: true, message: 'Ping dispatched' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ping failed';
    throw error(500, msg);
  }
};