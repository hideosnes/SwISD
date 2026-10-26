/**
 * 1. Relative path: cockpit/src/routes/api/peers/[peerId]/ping/+server.ts
 * 2. Description: BFF proxy endpoint to trigger a manual liveness check on a specific remote swarm node.
 * 3. Expects: The target peerId in the URL path.
 * 4. Provides: A real HTTP health check against the target node's admin API, proving liveness and reachability.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDiscoveredNodes } from '#lib/server/index.js';

export const POST: RequestHandler = async ({ params }) => {
  const { peerId } = params;
  
  if (!peerId) {
    return json({ success: false, error: 'Missing peerId' }, { status: 400 });
  }

  const coreToken = process.env.SWISD_ADMIN_TOKEN;
  if (!coreToken) {
    return json({ success: false, error: 'CRITICAL: SWISD_ADMIN_TOKEN not configured in BFF environment' }, { status: 500 });
  }

  const discovered = getDiscoveredNodes();
  const targetNode = discovered.find(n => n.peerId === peerId);

  if (!targetNode) {
    return json({ 
      success: false, 
      error: `Target node ${peerId} not found in discovery map. Ensure it is online and broadcasting via mDNS.` 
    }, { status: 404 });
  }

  try {
    // The most reliable "ping" is hitting the node's own health endpoint. 
    // This proves the node is alive, the network is reachable, and the admin API is responsive.
    const res = await fetch(`http://${targetNode.host}:${targetNode.port}/v1/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${coreToken}`,
      },
      // Short timeout so the UI doesn't hang if the node is ghosted
      signal: AbortSignal.timeout(3000), 
    });

    if (!res.ok) {
      return json({ 
        success: false, 
        error: `Node responded with HTTP ${res.status}. It may be alive but rejecting auth.` 
      }, { status: res.status });
    }

    const healthData = await res.json() as { status: string; peerId: string; version: string };
    
    return json({ 
      success: true, 
      message: `Ping successful. Node is healthy (v${healthData.version}).`,
      latencyMs: Date.now() // We could calculate round-trip time here if needed
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ 
      success: false, 
      error: `Network unreachable or timeout: ${msg}` 
    }, { status: 503 });
  }
};