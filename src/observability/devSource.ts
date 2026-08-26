// src/observability/devSource.ts
// Description: Development observability source for local testing before Raspberry Pi integration.
// Expects: Basic node identity metadata and an observability event bus.
// Provides: A typed ObservabilitySource with honest local dev placeholders.

import { clampLoadScore } from '../utils.js';
import type { PeerRole } from '../types.js';
import type { ObservabilityEventBus } from './eventBus.js';
import type {
  ObservabilityCrdtInfo,
  ObservabilityDeliveryInfo,
  ObservabilityLoadInfo,
  ObservabilityNetworkInfo,
  ObservabilityProcessInfo,
  ObservabilitySource,
  ObservabilityTaskInfo,
} from './schema.js';

export interface DevObservabilitySourceConfig {
  readonly peerId: string;
  readonly role: PeerRole;
  readonly version: string;
  readonly configSource: 'env' | 'usb' | 'stub';
  readonly startedAt: number;
}

export interface DevObservabilitySource extends ObservabilitySource {
  tick(): void;
}

export function createDevObservabilitySource(
  config: DevObservabilitySourceConfig,
  eventBus: ObservabilityEventBus
): DevObservabilitySource {
  let loadScore = 0;

  const updateLoad = (): void => {
    const mem = process.memoryUsage();
    const heapTotal = Math.max(1, mem.heapTotal);
    const heapRatio = mem.heapUsed / heapTotal;
    const rssRatio = mem.rss / (heapTotal * 2);

    loadScore = clampLoadScore(Math.max(heapRatio, rssRatio));
  };

  return {
    tick(): void {
      updateLoad();

      eventBus.publish({
        topic: 'observability',
        level: 'info',
        message: 'Observability heartbeat',
        details: {
          loadScore,
        },
      });
    },

    getProcessInfo(): ObservabilityProcessInfo {
      return {
        peerId: config.peerId,
        version: config.version,
        role: config.role,
        startedAt: config.startedAt,
        uptimeMs: Date.now() - config.startedAt,
        configSource: config.configSource,
      };
    },

    getNetworkInfo(): ObservabilityNetworkInfo {
      const host = process.env.SWISD_ADMIN_HOST ?? 'localhost';
      const port = process.env.SWISD_ADMIN_PORT ?? '4101';

      return {
        listenAddresses: [`http://${host}:${port}`],
        neighborCount: 0,
        knownPeers: [],
        gossipEnabled: false,
        mdnsActive: false,
      };
    },

    getLoadInfo(): ObservabilityLoadInfo {
      updateLoad();

      return {
        loadScore,
        activeTaskCount: 0,
        queuedTaskCount: 0,
        backpressureState: loadScore > 0.8 ? 'shedding' : loadScore > 0.6 ? 'throttled' : 'idle',
        rejectedTaskCount: 0,
        droppedLowPriorityTaskCount: 0,
      };
    },

    getCrdtInfo(): ObservabilityCrdtInfo {
      return {
        roots: {
          membership: 'pending',
          capabilities: 'pending',
          reputation: 'pending',
          taskHistory: 'pending',
          vectorMetadata: 'pending',
        },
        reputationEventCount: 0,
        reputationReadTimeScore: 0.5,
        taskHistoryEventCount: 0,
      };
    },

    getTaskInfo(): ObservabilityTaskInfo {
      return {
        active: [],
        queued: [],
        recentlyCompleted: [],
        recentlyPreempted: [],
        recentlyFailed: [],
      };
    },

    getDeliveryInfo(): ObservabilityDeliveryInfo {
      return {
        supervisorPresent: false,
        currentAppVersion: config.version,
        previousAppVersion: null,
        heartbeatOk: true,
        updateChannel: 'single',
        updateStatus: 'idle',
      };
    },
  };
}