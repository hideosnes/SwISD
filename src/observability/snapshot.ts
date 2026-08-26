// src/observability/snapshot.ts
// Description: Builds a frozen observability snapshot from a source adapter and event bus.
// Expects: A valid ObservabilitySource and ObservabilityEventBus.
// Provides: An immutable ObservabilitySnapshot for admin consumption.

import { deepFreeze } from '../utils.js';
import type { ObservabilityEventBus } from './eventBus.js';
import type { ObservabilitySnapshot, ObservabilitySource } from './schema.js';

export function buildObservabilitySnapshot(
  source: ObservabilitySource,
  eventBus: ObservabilityEventBus
): Readonly<ObservabilitySnapshot> {
  const snapshot: ObservabilitySnapshot = {
    generatedAt: Date.now(),
    process: source.getProcessInfo(),
    network: source.getNetworkInfo(),
    load: source.getLoadInfo(),
    crdt: source.getCrdtInfo(),
    tasks: source.getTaskInfo(),
    delivery: source.getDeliveryInfo(),
    recentEvents: eventBus.recent(50),
  };

  return deepFreeze(snapshot);
}