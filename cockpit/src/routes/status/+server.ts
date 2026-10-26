// 1. Relative path: cockpit/src/routes/status/+server.ts
// 2. Description: Dev-only emulated portal status endpoint that mirrors the real captive portal's poll API for the wizard preview bench.
// 3. Expects: wizardSim (dev-gated); the wizard's polling JS hits this exactly as it would the Pi's port 80.
// 4. Provides: GET /status returning the strict { status, error, ssid } snapshot; silently dead in production builds.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import type { RequestHandler } from './$types.js';
import { getSimSnapshot, isSimRequestAllowed } from '#lib/server/wizardSim.js';

export const GET: RequestHandler = (event) => {
	if (!isSimRequestAllowed(event)) return new Response(null, { status: 404 });

	const snapshot = getSimSnapshot();
	return new Response(
		JSON.stringify({ status: snapshot.state, error: snapshot.error ?? null, ssid: snapshot.joinedSsid ?? null }),
		{ status: 200, headers: { 'content-type': 'application/json' } }
	);
};
