/**
 * 1. Relative path: cockpit/src/hooks.server.ts
 * 2. Description: The BFF bridge. Initializes the headless SwISD core, TrustRegistry, Model machinery, Sovereignty Layer, and CredentialManager on SvelteKit server startup.
 * 3. Expects: SvelteKit's Handle hook invocation and environment variables.
 * 4. Provides: A globally available, initialized ObservabilitySource, EventBus, TrustRegistry, Model, Keystone, BondAnchor, ConductorIdentity, SessionLock, and CredentialManager singletons via `event.locals`.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import type { Handle } from '@sveltejs/kit';
import {
	ObservabilityEventBus,
	createDevObservabilitySource,
	createScenarioEngine,
	type ObservabilitySource,
	type ScenarioEngine
} from '$core/observability/index.js';
import { TrustRegistry } from '$core/peer/index.js';
import {
	ModelRegistry,
	ApprovalGate,
	ModelDownloader,
	ModelManager,
	IntentRegistry,
	ModelSigner,
	type DownloadProgress,
	type ModelManifest
} from '$core/models/index.js';
import { Keystone, BondAnchor } from '$core/ownership/index.js';
import { CredentialManager } from '$core/config/credentials.js';
import { parsePeerRole } from '$core/utils.js';
import { startCockpitDiscovery } from '$lib/server/discovery.js';
import { ConductorIdentity } from '$lib/server/conductorIdentity.js';
import { SessionLock } from '$lib/server/sessionLock.js';
import { join } from 'node:path';

const eventBus = new ObservabilityEventBus(500);
const role = parsePeerRole(process.env.SWISD_ROLE);
const peerId = process.env.SWISD_DEV_PEER_ID ?? `cockpit-dev-${process.pid}`;
const version = process.env.SWISD_VERSION ?? '0.0.1';
const deliveryRoot = process.env.SWISD_DELIVERY_ROOT ?? '../.swisd/delivery';
const stateDir = join(deliveryRoot, 'state');

const replayId = process.env.SWISD_REPLAY;
const isReplay = typeof replayId === 'string' && replayId.length > 0;

let coreSource: ObservabilitySource;
let trustRegistry: TrustRegistry;
let replayEngine: ScenarioEngine | null = null;

const keystone = new Keystone({ stateDir });
await keystone.initialize();

const bondAnchor = new BondAnchor({ stateDir });
await bondAnchor.initialize();

const conductorIdentity = new ConductorIdentity(stateDir);
await conductorIdentity.initialize();

const sessionLock = new SessionLock(stateDir);
await sessionLock.initialize();

const credentialManager = new CredentialManager(stateDir);
await credentialManager.initialize();

if (isReplay && replayId) {
	const speed = parseFloat(process.env.SWISD_REPLAY_SPEED ?? '1');
	replayEngine = createScenarioEngine(replayId, speed, eventBus);
	coreSource = replayEngine;
	trustRegistry = replayEngine.trustRegistry;

	const replayTimer = setInterval(() => replayEngine!.tick(250), 250);
	replayTimer.unref();
} else {
	trustRegistry = new TrustRegistry();

	const devSource = createDevObservabilitySource(
		{
			peerId,
			role,
			version,
			configSource: 'env',
			startedAt: Date.now(),
			deliveryRoot,
			trustRegistry
		},
		eventBus
	);

	startCockpitDiscovery(trustRegistry);

	const obsTimer = setInterval(() => devSource.tick(), 5000);
	obsTimer.unref();

	coreSource = devSource;
}

// --- THE IMMORTAL SINGLETON PATTERN ---
// Attach to globalThis to survive Vite HMR reloads.
// Without this, hot-reloading creates a new instance, severing the SSE telemetry bridge.
const g = globalThis as typeof globalThis & {
	__swisd_modelSigner?: ModelSigner;
	__swisd_modelRegistry?: ModelRegistry;
	__swisd_intentRegistry?: IntentRegistry;
	__swisd_approvalGate?: ApprovalGate;
	__swisd_modelDownloader?: ModelDownloader;
	__swisd_modelManager?: ModelManager;
	__swisd_downloadProgress?: Record<string, DownloadProgress>;
};

if (!g.__swisd_modelSigner) {
	const signer = new ModelSigner(stateDir);
	await signer.load();
	g.__swisd_modelSigner = signer;
}
const modelSigner = g.__swisd_modelSigner;

const signPayload = async (payload: string): Promise<Uint8Array> => {
	return modelSigner.signPayload(payload);
};

if (!g.__swisd_modelRegistry) {
	// Manifests are only registered when the signer's Ed25519 key verifies them —
	// forgeable or legacy manifests are rejected at the single registry choke point.
	g.__swisd_modelRegistry = new ModelRegistry(deliveryRoot, (manifest: ModelManifest) =>
		modelSigner.verifyManifest(manifest)
	);
	await g.__swisd_modelRegistry.load();
}
const modelRegistry = g.__swisd_modelRegistry;

if (!g.__swisd_intentRegistry) {
	g.__swisd_intentRegistry = new IntentRegistry(deliveryRoot);
	await g.__swisd_intentRegistry.load();
}
const intentRegistry = g.__swisd_intentRegistry;

if (!g.__swisd_approvalGate) {
	g.__swisd_approvalGate = new ApprovalGate();
}
const approvalGate = g.__swisd_approvalGate;

if (!g.__swisd_modelDownloader) {
	g.__swisd_modelDownloader = new ModelDownloader(
		modelRegistry,
		deliveryRoot,
		signPayload,
		credentialManager
	);
}
const modelDownloader = g.__swisd_modelDownloader;

if (!g.__swisd_modelManager) {
	g.__swisd_modelManager = new ModelManager(
		modelRegistry,
		intentRegistry,
		modelDownloader,
		deliveryRoot,
		credentialManager
	);
}

const modelManager = g.__swisd_modelManager;
// --- END IMMORTAL SINGLETONS ---

// Shared SSE telemetry record lives on globalThis so HMR re-evals reuse both the
// record and the single listener — never a duplicate subscription on the emitter.
// Terminal states (completed/failed) are evicted after a grace period so the
// record stays bounded and polling clients stop receiving stale end-states.
const PROGRESS_TERMINAL_TTL_MS = 15_000;

if (!g.__swisd_downloadProgress) {
	const progressRecord: Record<string, DownloadProgress> = {};
	const pendingEvictions = new Map<string, ReturnType<typeof setTimeout>>();

	g.__swisd_downloadProgress = progressRecord;
	modelDownloader.on('progress', (data: unknown) => {
		if (typeof data !== 'object' || data === null || !('modelId' in data)) return;
		const progressData = data as { modelId?: string; status?: DownloadProgress['status'] };
		if (typeof progressData.modelId !== 'string') return;
		const modelId = progressData.modelId;
		progressRecord[modelId] = data as DownloadProgress;

		const pending = pendingEvictions.get(modelId);
		if (pending) {
			clearTimeout(pending);
			pendingEvictions.delete(modelId);
		}

		if (progressData.status === 'completed' || progressData.status === 'failed') {
			const timer = setTimeout(() => {
				delete progressRecord[modelId];
				pendingEvictions.delete(modelId);
			}, PROGRESS_TERMINAL_TTL_MS);
			timer.unref();
			pendingEvictions.set(modelId, timer);
		}
	});
}
const downloadProgress = g.__swisd_downloadProgress;
// --- END PROGRESS TELEMETRY ---

export const handle: Handle = async ({ event, resolve }) => {
	event.locals = {
		coreSource,
		eventBus,
		trustRegistry,
		modelRegistry,
		intentRegistry,
		approvalGate,
		modelDownloader,
		modelManager,
		modelSigner,
		downloadProgress,
		isReplay,
		replayEngine,
		keystone,
		bondAnchor,
		conductorIdentity,
		sessionLock,
		credentialManager,
		peerId,
		deliveryRoot
	};

	if (sessionLock.isLocked() && !event.url.pathname.startsWith('/api/session')) {
		return new Response(JSON.stringify({ error: 'Session locked' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const response = await resolve(event);
	return response;
};
