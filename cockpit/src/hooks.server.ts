/**
 * 1. Relative path: cockpit/src/hooks.server.ts
 * 2. Description: The BFF bridge. Initializes the headless SwISD core, TrustRegistry, Model machinery, and Sovereignty Layer on SvelteKit server startup.
 * 3. Expects: SvelteKit's Handle hook invocation and environment variables.
 * 4. Provides: A globally available, initialized ObservabilitySource, EventBus, TrustRegistry, Model, Keystone, BondAnchor, ConductorIdentity, and SessionLock singletons via `event.locals`.
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
import { ModelRegistry, ApprovalGate, ModelDownloader, ModelManager } from '$core/models/index.js';
import { Keystone, BondAnchor } from '$core/ownership/index.js';
import { parsePeerRole } from '$core/utils.js';
import { startCockpitDiscovery } from '$lib/server/discovery.js';
import { ConductorIdentity } from '$lib/server/conductorIdentity.js';
import { SessionLock } from '$lib/server/sessionLock.js';
import { createHash } from 'node:crypto';
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
    keystone,
    bondAnchor,
    conductorIdentity,
    sessionLock,
  };

  // Block all API routes if the session is locked (except the session unlock route itself)
  if (sessionLock.isLocked() && !event.url.pathname.startsWith('/api/session')) {
    return new Response(JSON.stringify({ error: 'Session locked' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const response = await resolve(event);
  return response;
};