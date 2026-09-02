// 1. Relative path: cockpit/src/hooks.server.ts
// 2. Description: The BFF bridge. Initializes the headless SwISD core, TrustRegistry, and Model machinery on SvelteKit server startup. Swaps to ScenarioEngine when SWISD_REPLAY is set.
// 3. Expects: SvelteKit's Handle hook invocation and environment variables.
// 4. Provides: A globally available, initialized ObservabilitySource, EventBus, TrustRegistry, and Model singletons via `event.locals`.

import type { Handle } from '@sveltejs/kit';
import { 
  ObservabilityEventBus, 
  createDevObservabilitySource, 
  createScenarioEngine,
  type ObservabilitySource,
  type ScenarioEngine 
} from '$core/observability/index.js';
import { TrustRegistry } from '$core/peer/index.js';
import { ModelRegistry, ApprovalGate, ModelDownloader, ModelManager } from '$core/models/index.js';
import { parsePeerRole } from '$core/utils.js';
import { startCockpitDiscovery } from '$lib/server/discovery.js';
import { createHash } from 'node:crypto';

const eventBus = new ObservabilityEventBus(500);
const role = parsePeerRole(process.env.SWISD_ROLE);
const peerId = process.env.SWISD_DEV_PEER_ID ?? `cockpit-dev-${process.pid}`;
const version = process.env.SWISD_VERSION ?? '0.0.1';
const deliveryRoot = process.env.SWISD_DELIVERY_ROOT ?? '../.swisd/delivery'; 

const replayId = process.env.SWISD_REPLAY;
const isReplay = typeof replayId === 'string' && replayId.length > 0;

let coreSource: ObservabilitySource;
let trustRegistry: TrustRegistry;
let replayEngine: ScenarioEngine | null = null;

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
    { peerId, role, version, configSource: 'env', startedAt: Date.now(), deliveryRoot, trustRegistry },
    eventBus
  );
  
  startCockpitDiscovery(trustRegistry);
  
  const obsTimer = setInterval(() => devSource.tick(), 5000);
  obsTimer.unref();
  
  coreSource = devSource;
}

const modelRegistry = new ModelRegistry(deliveryRoot);
await modelRegistry.load();

const approvalGate = new ApprovalGate();

const signPayload = async (payload: string): Promise<Uint8Array> => {
  return new Uint8Array(createHash('sha256').update(payload).digest());
};

const modelDownloader = new ModelDownloader(modelRegistry, deliveryRoot, signPayload);
const modelManager = new ModelManager(modelRegistry, deliveryRoot);

export const handle: Handle = async ({ event, resolve }) => {
  event.locals = {
    coreSource,
    eventBus,
    trustRegistry,
    modelRegistry,
    approvalGate,
    modelDownloader,
    modelManager,
    isReplay,
    replayEngine,
  };

  const response = await resolve(event);
  return response;
};