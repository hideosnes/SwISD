// 1. Relative path: cockpit/src/lib/server/wizardSim.ts
// 2. Description: Dev-only emulated captive portal state machine powering the wizard preview bench (cockpit/src/routes/design/wizard).
// 3. Expects: Strict DTOs from $core/provision (isPortalJoinRequest), and callers that are dev-gated — this sim must never answer in a production build.
// 4. Provides: Join submission with fake latency, status snapshots, forced-state overrides, and the Bad-* SSID failure rule.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { dev } from '$app/env';
import { isPortalJoinRequest, type PortalState } from '$core/provision/index.js';
import type { RequestEvent } from '@sveltejs/kit';

const JOIN_LATENCY_MS = 2500;

interface SimState {
	state: PortalState;
	error: string | undefined;
	joinedSsid: string | undefined;
}

let sim: SimState = { state: 'idle', error: undefined, joinedSsid: undefined };
let joinTimer: ReturnType<typeof setTimeout> | null = null;

export function resetSim(): void {
	if (joinTimer !== null) {
		clearTimeout(joinTimer);
		joinTimer = null;
	}
	sim = { state: 'idle', error: undefined, joinedSsid: undefined };
}

export interface ForcedStateOptions {
	readonly error?: string;
	readonly ssid?: string;
}

/** Freeze the sim at a chosen state — the preview route's ?state= override. */
export function forceSimState(state: PortalState, options: ForcedStateOptions = {}): void {
	if (joinTimer !== null) {
		clearTimeout(joinTimer);
		joinTimer = null;
	}
	sim = { state, error: options.error, joinedSsid: options.ssid };
}

export type SimJoinOutcome =
	| { readonly accepted: true }
	| { readonly accepted: false; readonly alreadyBusy: true; readonly message: 'A join is already in progress' }
	| { readonly accepted: false; readonly message: string };

/** Validate exactly like the real portal, then simulate the join outcome. SSIDs starting "Bad-" fail auth. */
export function submitSimJoin(rawBody: unknown): SimJoinOutcome {
	if (!isPortalJoinRequest(rawBody)) {
		return { accepted: false, message: 'Invalid join payload' };
	}
	if (sim.state === 'joining') {
		return { accepted: false, alreadyBusy: true, message: 'A join is already in progress' };
	}
	if (joinTimer !== null) {
		clearTimeout(joinTimer);
		joinTimer = null;
	}

	const request = rawBody;
	sim = { state: 'joining', error: undefined, joinedSsid: undefined };

	joinTimer = setTimeout(() => {
		joinTimer = null;
		if (request.ssid.startsWith('Bad-')) {
			sim = { state: 'failed', error: 'psk rejected by example network', joinedSsid: undefined };
			return;
		}
		sim = { state: 'joined', error: undefined, joinedSsid: request.ssid };
	}, JOIN_LATENCY_MS);

	return { accepted: true };
}

export function getSimSnapshot(): Readonly<SimState> {
	return sim;
}

/** Dev gate for every sim-backed route: 404 outside dev, 404 off private networks. */
export function isSimRequestAllowed(event: RequestEvent): boolean {
	if (!dev) {
		console.warn('[WizardSim] rejected: not dev');
		return false;
	}
	try {
		const address = event.getClientAddress();
		const ok =
			address.startsWith('127.') ||
			address === '::1' ||
			address.startsWith('10.') ||
			address.startsWith('192.168.') ||
			(address.startsWith('172.') && in172Range(address));
		if (!ok) console.warn('[WizardSim] rejected: client address not private:', address);
		return ok;
	} catch {
		console.warn('[WizardSim] rejected: no client address');
		return false;
	}
}

function in172Range(address: string): boolean {
	const secondOctet = Number.parseInt(address.split('.')[1] ?? '', 10);
	return secondOctet >= 16 && secondOctet <= 31;
}
