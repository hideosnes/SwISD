// 1. Relative path: cockpit/src/routes/design/wizard/preview/+server.ts
// 2. Description: Dev-only server route that serves the REAL renderWizardPage() artifact to the preview bench iframe.
// 3. Expects: $core/provision barrel (renderWizardPage), wizardSim for forced-state overrides; dev-gated + loopback only.
// 4. Provides: GET returns the verbatim portal HTML — with no query params it resets the sim for a live flow.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import type { RequestHandler } from './$types.js';
import { renderWizardPage, type PortalState } from '$core/provision/index.js';
import { forceSimState, isSimRequestAllowed, resetSim } from '#lib/server/wizardSim.js';

const PORTAL_STATES: ReadonlyArray<PortalState> = ['idle', 'joining', 'joined', 'failed'];

export const GET: RequestHandler = (event) => {
	if (!isSimRequestAllowed(event)) return new Response(null, { status: 404 });

	const params = event.url.searchParams;
	const forced = params.get('state');
	const state = forced !== null && (PORTAL_STATES as ReadonlyArray<string>).includes(forced) ? (forced as PortalState) : null;

	let html: string;
	if (state === null) {
		// Live flow: fresh episode, the sim takes over from here.
		resetSim();
		html = renderWizardPage('idle');
	} else {
		const error = params.get('error') ?? undefined;
		const ssid = params.get('ssid') ?? undefined;
		forceSimState(state, { error: error ?? undefined, ssid:ssid ?? undefined });
		html = renderWizardPage(state, error, ssid);
	}

	return new Response(html, {
		status: 200,
		headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
	});
};
