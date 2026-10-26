// 1. Relative path: cockpit/src/routes/join/+server.ts
// 2. Description: Dev-only emulated portal endpoint that mirrors the real captive portal's origin-root API so the actual wizard artifact is clickable in the preview bench.
// 3. Expects: wizardSim (dev-gated); the wizard posts raw JSON here exactly as it would to the Pi's port 80.
// 4. Provides: POST /join with the real validation guard and simulated latency; silently dead in production builds.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import type { RequestHandler } from './$types.js';
import { isSimRequestAllowed, submitSimJoin } from '#lib/server/wizardSim.js';

const DENIED = (): Response => new Response(null, { status: 404 });

export const POST: RequestHandler = async (event) => {
	if (!isSimRequestAllowed(event)) return DENIED();

	let parsed: unknown;
	try {
		parsed = JSON.parse(await event.request.text()) as unknown;
	} catch {
		return new Response(JSON.stringify({ status: 'failed', reason: 'invalid-request', message: 'Malformed JSON body' }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}

	const outcome = submitSimJoin(parsed);
	if (!outcome.accepted) {
		const busy = 'alreadyBusy' in outcome && outcome.alreadyBusy;
		return new Response(
			JSON.stringify({ status: 'failed', reason: 'invalid-request', message: outcome.message }),
			{ status: busy ? 409 : 400, headers: { 'content-type': 'application/json' } }
		);
	}
	return new Response(JSON.stringify({ status: 'joining' }), {
		status: 202,
		headers: { 'content-type': 'application/json' }
	});
};
