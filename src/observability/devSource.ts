// 1. Relative path: src/observability/devSource.ts
// 2. Description: Development observability source that integrates with the real supervisor status file and trust registry.
// 3. Expects: Basic node identity metadata, an observability event bus, the delivery root path, and the trust registry.
// 4. Provides: A typed ObservabilitySource that reads actual supervisor status and peer trust states synchronously.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { clampLoadScore } from '../utils.js';
import type { PeerRole, UpdateStatus } from '../types.js';
import { isSupervisorStatus } from '../delivery';
import type { TrustRegistry } from '../peer';
import type { ObservabilityEventBus } from './eventBus.js';
import type {
  ObservabilityCrdtInfo,
  ObservabilityDeliveryInfo,
  ObservabilityLoadInfo,
  ObservabilityNetworkInfo,
  ObservabilityPeerInfo,
  ObservabilityProcessInfo,
  ObservabilitySource,
  ObservabilityTaskInfo,
  DeviceType,
  ModalityCode,
} from './schema.js';

export interface DevObservabilitySourceConfig {
  readonly peerId: string;
  readonly role: PeerRole;
  readonly version: string;
  readonly configSource: 'env' | 'usb' | 'stub';
  readonly startedAt: number;
  readonly deliveryRoot: string;
  readonly trustRegistry: TrustRegistry;
}

export interface DevObservabilitySource extends ObservabilitySource {
  tick(): void;
}

export function createDevObservabilitySource(
  config: DevObservabilitySourceConfig,
  eventBus: ObservabilityEventBus
): DevObservabilitySource {
  let loadScore = 0;
  const statusPath = join(config.deliveryRoot, 'state', 'supervisor-status.json');

  const updateLoad = (): void => {
    const mem = process.memoryUsage();
    const heapTotal = Math.max(1, mem.heapTotal);
    const heapRatio = mem.heapUsed / heapTotal;
    const rssRatio = mem.rss / (heapTotal * 2);
    loadScore = clampLoadScore(Math.max(heapRatio, rssRatio));
  };

  const readSupervisorStatusSync = (): ObservabilityDeliveryInfo => {
    try {
      if (existsSync(statusPath)) {
        const raw = readFileSync(statusPath, { encoding: 'utf-8' });
        const parsed = JSON.parse(raw) as unknown;
        
        if (isSupervisorStatus(parsed)) {
          const heartbeatAge = parsed.lastHeartbeatCheck 
            ? Date.now() - parsed.lastHeartbeatCheck 
            : Infinity;
            
          return {
            supervisorPresent: true,
            currentAppVersion: parsed.currentAppVersion,
            previousAppVersion: parsed.previousAppVersion,
            heartbeatOk: heartbeatAge < 20000,
            updateChannel: 'single',
            updateStatus: parsed.updateStatus,
            lastError: parsed.lastError,
            rollbackReason: parsed.rollbackReason,
          };
        }
      }
    } catch {
      // File missing or invalid, fall through to default
    }

    return {
      supervisorPresent: false,
      currentAppVersion: config.version,
      previousAppVersion: null,
      heartbeatOk: true,
      updateChannel: 'single',
      updateStatus: 'idle' as UpdateStatus,
      lastError: null,
      rollbackReason: null,
    };
  };

  return {
    tick(): void {
      updateLoad();
      eventBus.publish({
        topic: 'observability',
        level: 'info',
        message: 'Observability heartbeat',
        details: { loadScore },
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
        mdnsActive: true,
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
      return readSupervisorStatusSync();
    },

    getPeerInfo(): ObservabilityPeerInfo[] {
      return config.trustRegistry.getAllPeers().map(p => ({
        peerId: p.peerId,
        trustState: p.state,
        discoveredAt: p.discoveredAt,
        trustedAt: p.trustedAt,
        source: p.source === 'usb' ? 'manual' : (p.source as 'mdns' | 'genesis'),
        loadScore: null,
        capabilities: null,
        deviceType: 'unknown', // Live mode: peers self-report, default to unknown
        modalities: [], // Live mode: derived from loaded models (Phase B TODO)
      }));
    },
  };
}