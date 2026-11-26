/**
 * 1. Relative path: cockpit/src/routes/api/system/requirements/+server.ts
 * 2. Description: BFF proxy endpoint to flag pending requirements (e.g. Tailscale) on remote swarm nodes for the next update.
 * 3. Expects: JSON body with optional target peerId (omitted = broadcast to all discovered nodes) and boolean requirement flags.
 * 4. Provides: Securely proxied mutation to the core's token-guarded admin API.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDiscoveredNodes } from '#lib/server/index.js';

interface RequirementsRequestBody {
  readonly peerId?: string;
  readonly tailscale?: boolean;
}

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as RequirementsRequestBody;
  const coreToken = process.env.SWISD_ADMIN_TOKEN;

  if (!coreToken) {
    throw error(500, 'Core admin token not configured in BFF environment');
  }
  if (typeof body.tailscale !== 'boolean') {
    throw error(400, 'Missing or invalid "tailscale" boolean flag');
  }

  const discovered = getDiscoveredNodes();
  const targets = body.peerId
    ? discovered.filter(n => n.peerId === body.peerId && n.peerId !== 'unknown')
    : discovered.filter(n => n.peerId !== 'unknown');

  if (targets.length === 0) {
    throw error(404, 'No target nodes found for requirements update');
  }

  const results = await Promise.all(targets.map(async (node) => {
    try {
      const res = await fetch(`http://${node.host}:${node.port}/v1/system/requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${coreToken}`,
        },
        body: JSON.stringify({ tailscale: body.tailscale }),
      });
      return { peerId: node.peerId, hostname: node.hostname, status: res.status, ok: res.ok };
    } catch (err) {
      return { peerId: node.peerId, hostname: node.hostname, status: 500, ok: false, message: String(err) };
    }
  }));

  return json({ results });
};
