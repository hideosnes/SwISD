// 1. Relative path: cockpit/src/routes/api/discovery/+server.ts
// 2. Description: API endpoint that exposes the BFF's discovered mDNS swarm nodes to the frontend.
// 3. Expects: A valid SvelteKit RequestEvent.
// 4. Provides: A strictly typed JSON array of DiscoveredNode DTOs.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDiscoveredNodes } from '$lib/server/discovery.js';

export const GET: RequestHandler = async () => {
  const nodes = getDiscoveredNodes();
  return json({ nodes });
};