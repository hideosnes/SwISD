// 1. Relative path: src/observability/snapshot.ts
// 2. Description: Immutable snapshot builder for the observability plane.
// 3. Expects: An ObservabilitySource, EventBus, and an optional source discriminator.
// 4. Provides: A pure function to build a strictly typed SwarmSnapshot.

import type { ObservabilityEventBus } from './eventBus.js';
import type { SwarmSnapshot, ObservabilitySource } from './schema.js';

export function buildSwarmSnapshot(
  source: ObservabilitySource, 
  eventBus: ObservabilityEventBus,
  snapshotSource: 'live' | 'replay' = 'live'
): SwarmSnapshot {
  return {
    timestamp: Date.now(),
    process: source.getProcessInfo(),
    network: source.getNetworkInfo(),
    load: source.getLoadInfo(),
    crdt: source.getCrdtInfo(),
    tasks: source.getTaskInfo(),
    delivery: source.getDeliveryInfo(),
    peers: source.getPeerInfo(),
    recentEvents: eventBus.recent(), // FIXED: Invoke the method
    source: snapshotSource,
  };
}