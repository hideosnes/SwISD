// 1. Relative path: cockpit/src/hooks.server.ts
// 2. Description: The BFF bridge. Initializes the headless SwISD core on SvelteKit server startup and injects it into the request lifecycle.
// 3. Expects: SvelteKit's Handle hook invocation.
// 4. Provides: A globally available, initialized ObservabilitySource and EventBus via `event.locals` for all API routes.

import type { Handle } from '@sveltejs/kit';
// FIX: Using explicit relative paths to bypass SvelteKit alias resolution friction
import { ObservabilityEventBus, createDevObservabilitySource } from '../../src/observability/index.js';
import { parsePeerRole } from '../../src/utils.js';

const eventBus = new ObservabilityEventBus(500);
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
  },
  eventBus
);

const obsTimer = setInterval(() => {
  coreSource.tick();
}, 5000);
obsTimer.unref();

export const handle: Handle = async ({ event, resolve }) => {
  event.locals = {
    coreSource,
    eventBus,
  };

  const response = await resolve(event);
  return response;
};