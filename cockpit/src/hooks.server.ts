// 1. Relative path: cockpit/src/hooks.server.ts
// 2. Description: The BFF bridge. Initializes the headless SwISD core, TrustRegistry, and Model machinery on SvelteKit server startup.
// 3. Expects: SvelteKit's Handle hook invocation.
// 4. Provides: A globally available, initialized ObservabilitySource, EventBus, TrustRegistry, and Model singletons via `event.locals`.

import type { Handle } from '@sveltejs/kit';
import { ObservabilityEventBus, createDevObservabilitySource } from '$core/observability/index.js';
import { TrustRegistry } from '$core/peer/index.js';
import { ModelRegistry, ApprovalGate, ModelDownloader, ModelManager } from '$core/models/index.js';
import { parsePeerRole } from '$core/utils.js';
import { startCockpitDiscovery } from '$lib/server/discovery.js';
import { createHash } from 'node:crypto';

// Initialize the core state ONCE at server startup
const eventBus = new ObservabilityEventBus(500);
const trustRegistry = new TrustRegistry();
const role = parsePeerRole(process.env.SWISD_ROLE);
const peerId = process.env.SWISD_DEV_PEER_ID ?? `cockpit-dev-${process.pid}`;
const version = process.env.SWISD_VERSION ?? '0.0.1';
const deliveryRoot = process.env.SWISD_DELIVERY_ROOT ?? '../.swisd/delivery'; 

const coreSource = createDevObservabilitySource(
  { peerId, role, version, configSource: 'env', startedAt: Date.now(), deliveryRoot, trustRegistry },
  eventBus
);

// P4 Singletons
const modelRegistry = new ModelRegistry(deliveryRoot);
await modelRegistry.load();

const approvalGate = new ApprovalGate();

// Dummy signPayload for the BFF context (In production, this comes from the core IdentityManager)
const signPayload = async (payload: string): Promise<Uint8Array> => {
  return new Uint8Array(createHash('sha256').update(payload).digest());
};

const modelDownloader = new ModelDownloader(modelRegistry, deliveryRoot, signPayload);
const modelManager = new ModelManager(modelRegistry, deliveryRoot);

const obsTimer = setInterval(() => coreSource.tick(), 5000);
obsTimer.unref();

startCockpitDiscovery(trustRegistry);

export const handle: Handle = async ({ event, resolve }) => {
  event.locals = {
    coreSource,
    eventBus,
    trustRegistry,
    modelRegistry,
    approvalGate,
    modelDownloader,
    modelManager,
  };

  const response = await resolve(event);
  return response;
};