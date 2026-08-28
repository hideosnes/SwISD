// 1. Relative path: cockpit/src/hooks.server.ts
// 2. Description: The BFF bridge. Initializes the headless SwISD core and TrustRegistry on SvelteKit server startup, and injects them into the request lifecycle.
// 3. Expects: SvelteKit's Handle hook invocation.
// 4. Provides: A globally available, initialized ObservabilitySource, EventBus, and TrustRegistry via `event.locals` for all API routes.

import type { Handle } from '@sveltejs/kit';
import { ObservabilityEventBus, createDevObservabilitySource } from '$core/observability/index.js';
import { TrustRegistry } from '$core/peer/index.js';
import { parsePeerRole } from '$core/utils.js';
import { startCockpitDiscovery } from '$lib/server/discovery.js';

// Initialize the core state ONCE at server startup
const eventBus = new ObservabilityEventBus(500);
const trustRegistry = new TrustRegistry();
const role = parsePeerRole(process.env.SWISD_ROLE);
const peerId = process.env.SWISD_DEV_PEER_ID ?? `cockpit-dev-${process.pid}`;
const version = process.env.SWISD_VERSION ?? '0.0.1';
const deliveryRoot = process.env.SWISD_DELIVERY_ROOT ?? '../.swisd/delivery'; 

const coreSource = createDevObservabilitySource(
  {
    peerId,
    role,
    version,
    configSource: 'env',
    startedAt: Date.now(),
    deliveryRoot,
    trustRegistry,
  },
  eventBus
);

// Start the heartbeat tick
const obsTimer = setInterval(() => {
  coreSource.tick();
}, 5000);
obsTimer.unref();

// Start the mDNS discovery listener, injecting the trust registry
startCockpitDiscovery(trustRegistry);

export const handle: Handle = async ({ event, resolve }) => {
  // Inject the core instances into the request locals
  event.locals = {
    coreSource,
    eventBus,
    trustRegistry,
  };

  const response = await resolve(event);
  return response;
};