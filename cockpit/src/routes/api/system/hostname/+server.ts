/**
 * 1. Relative path: cockpit/src/routes/api/system/hostname/+server.ts
 * 2. Description: BFF proxy endpoint to update a specific remote core node's persistent hostname.
 * 3. Expects: JSON body with the target peerId and the new hostname.
 * 4. Provides: Securely proxied mutation to the remote core's token-guarded admin API, with full error surfacing.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDiscoveredNodes } from '$lib/server/index.js';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as { peerId: string; hostname: string };
  
  if (!body.peerId || !body.hostname || typeof body.hostname !== 'string' || body.hostname.trim().length === 0) {
    return json({ success: false, error: 'Invalid peerId or hostname provided' }, { status: 400 });
  }

  const coreToken = process.env.SWISD_ADMIN_TOKEN;
  if (!coreToken) {
    return json({ success: false, error: 'CRITICAL: SWISD_ADMIN_TOKEN not configured in BFF environment' }, { status: 500 });
  }

  const discovered = getDiscoveredNodes();
  const targetNode = discovered.find(n => n.peerId === body.peerId);

  if (!targetNode) {
    return json({ 
      success: false, 
      error: `Node is not currently reachable via mDNS. Ensure the Pi is online, on the same network, and its mDNS broadcast is active.` 
    }, { status: 404 });
  }

  try {
    const res = await fetch(`http://${targetNode.host}:${targetNode.port}/v1/system/hostname`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coreToken}`,
      },
      body: JSON.stringify({ hostname: body.hostname.trim() }),
    });

    const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
    const errorMessage = data.error || data.message || `HTTP ${res.status}`;

    if (!res.ok) {
      return json({ success: false, error: `Core rejected update: ${errorMessage}` }, { status: res.status });
    }

    return json({ success: true, hostname: body.hostname.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[BFF] Failed to update hostname on ${targetNode.host}:${targetNode.port}:`, err);
    return json({ success: false, error: `Network error: ${msg}` }, { status: 500 });
  }
};