// 1. Relative path: src/observability/scenarioEngine.ts
// 2. Description: The deterministic tape recorder for Scenario Replay Mode.
// 3. Expects: A selected Scenario, a speed multiplier, and the core event bus.
// 4. Provides: A fake ObservabilitySource, TrustRegistry, and Discovery state driven by keyframe evaluation.

import type { 
  ObservabilitySource, ObservabilityPeerInfo, ObservabilityLoadInfo, 
  ObservabilityTaskInfo, ObservabilityNetworkInfo, ObservabilityCrdtInfo, 
  ObservabilityProcessInfo, ObservabilityDeliveryInfo, ObservabilityBackpressureState 
} from './schema.js';
import type { TrustRegistry } from '../peer/index.js';
import type { Scenario, ContinuousChannel, StepChannel, TrustState } from './scenarios.js';
import { SCENARIOS } from './scenarios.js';
import type { PeerRole } from '../types.js';

export interface ScenarioEngine extends ObservabilitySource {
  readonly trustRegistry: TrustRegistry;
  readonly getDiscoveredNodes: () => readonly { peerId: string; name: string; port: number; version: string }[];
  setSpeed(speed: number): void;
  play(): void;
  pause(): void;
  tick(wallDeltaMs: number): void;
}

function evaluateContinuous(channel: ContinuousChannel, timeMs: number): number {
  const frames = channel.keyframes;
  if (frames.length === 0) return 0;
  
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (!first || !last) return 0;
  
  if (timeMs <= first.timeMs) return first.value;
  if (timeMs >= last.timeMs) return last.value;
  
  for (let i = 0; i < frames.length - 1; i++) {
    const current = frames[i];
    const next = frames[i + 1];
    if (current && next && timeMs >= current.timeMs && timeMs < next.timeMs) {
      const t = (timeMs - current.timeMs) / (next.timeMs - current.timeMs);
      return current.value + t * (next.value - current.value);
    }
  }
  return 0;
}

function evaluateStep<T>(channel: StepChannel<T>, timeMs: number): T | null {
  const frames = channel.keyframes;
  if (frames.length === 0) return null;
  
  const first = frames[0];
  if (!first || timeMs < first.timeMs) return null;
  
  let current = first.value;
  for (const frame of frames) {
    if (timeMs >= frame.timeMs) current = frame.value;
    else break;
  }
  return current;
}

// Extract exact types from the real TrustRegistry to avoid importing missing internal types
type CorePeerRecord = ReturnType<TrustRegistry['getAllPeers']>[number];
type CorePeerSource = CorePeerRecord['source'];

// FIXED: Dropped 'implements TrustRegistry' to bypass the private 'peers' property origin check
class ScenarioTrustRegistry {
  private overrides = new Map<string, TrustState>();

  constructor(private scenario: Scenario, private now: () => number) {}

  getAllPeers(): CorePeerRecord[] {
    const peers: CorePeerRecord[] = [];
    for (const [peerId, track] of Object.entries(this.scenario.peerTracks)) {
      const presence = evaluateStep(track.presence, this.now());
      if (presence !== 'online') continue;

      const trust = this.overrides.get(peerId) ?? evaluateStep(track.trust, this.now()) ?? 'pending';
      
      peers.push({
        peerId,
        state: trust,
        discoveredAt: track.discovered.keyframes[0]?.timeMs ?? 0,
        trustedAt: trust === 'trusted' ? this.now() : null,
        source: 'mdns' as CorePeerSource, 
      } as unknown as CorePeerRecord);
    }
    return peers;
  }

  trustPeer(peerId: string): boolean { 
    this.overrides.set(peerId, 'trusted'); 
    return true;
  }
  
  rejectPeer(peerId: string): boolean { 
    this.overrides.set(peerId, 'rejected'); 
    return true;
  }
  
  addPendingPeer(peerId: string): void { 
    this.overrides.set(peerId, 'pending'); 
  }

  get peers(): Map<string, CorePeerRecord> { return new Map(); }
  get publicKeys(): Map<string, Uint8Array> { return new Map(); }
  
  discoverPeer(peerId: string, source: CorePeerSource): CorePeerRecord {
    return {
      peerId,
      state: 'pending',
      discoveredAt: this.now(),
      trustedAt: null,
      source,
    } as unknown as CorePeerRecord;
  }
  
  registerPublicKey(peerId: string, key: Uint8Array): void {}
  
  getPublicKey(peerId: string): Uint8Array | undefined { return undefined; }
  
  getPeer(peerId: string): CorePeerRecord | undefined { return undefined; }
  
  removePeer(peerId: string): boolean { return false; }
}

export function createScenarioEngine(scenarioId: string, initialSpeed: number): ScenarioEngine {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);

  let scenarioTimeMs = 0;
  let speed = initialSpeed;
  let playing = true;

  const now = () => scenarioTimeMs;
  const trustRegistry = new ScenarioTrustRegistry(scenario, now);

  return {
    // FIXED: Cast the mock to satisfy the interface without violating private property origins
    trustRegistry: trustRegistry as unknown as TrustRegistry,
    getDiscoveredNodes: () => {
      const nodes: { peerId: string; name: string; port: number; version: string }[] = [];
      for (const [peerId, track] of Object.entries(scenario.peerTracks)) {
        const disc = evaluateStep(track.discovered, now());
        if (disc) nodes.push({ peerId, ...disc });
      }
      return nodes;
    },
    setSpeed: (s) => { speed = s; },
    play: () => { playing = true; },
    pause: () => { playing = false; },
    tick: (wallDeltaMs) => {
      if (!playing) return;
      scenarioTimeMs += wallDeltaMs * speed;
      if (scenario.loop && scenarioTimeMs > scenario.durationMs) {
        scenarioTimeMs = scenarioTimeMs % scenario.durationMs;
      }
    },

    getProcessInfo: (): ObservabilityProcessInfo => ({
      peerId: '0xconductor', 
      version: '1.0.0-replay', 
      role: 'worker' as PeerRole, 
      startedAt: Date.now() - scenarioTimeMs, 
      uptimeMs: scenarioTimeMs, 
      configSource: 'env',
    }),
    getNetworkInfo: (): ObservabilityNetworkInfo => ({
      listenAddresses: ['http://localhost:4101'], 
      neighborCount: Object.keys(scenario.peerTracks).length,
      knownPeers: Object.keys(scenario.peerTracks), 
      gossipEnabled: true, 
      mdnsActive: true,
    }),
    getLoadInfo: (): ObservabilityLoadInfo => {
      const loads = Object.values(scenario.peerTracks)
        .map(t => evaluateContinuous(t.load, now()))
        .filter(l => l > 0);
      const avg = loads.length > 0 ? loads.reduce((a, b) => a + b, 0) / loads.length : 0;
      let state: ObservabilityBackpressureState = 'idle';
      if (avg > 0.8) state = 'shedding';
      else if (avg > 0.6) state = 'throttled';
      
      return {
        loadScore: avg, 
        activeTaskCount: 0, 
        queuedTaskCount: 0,
        backpressureState: state,
        rejectedTaskCount: 0, 
        droppedLowPriorityTaskCount: 0,
      };
    },
    getCrdtInfo: (): ObservabilityCrdtInfo => ({
      roots: { membership: 'replay', capabilities: 'replay', reputation: 'replay', taskHistory: 'replay', vectorMetadata: 'replay' },
      reputationEventCount: 0, 
      reputationReadTimeScore: 0.5, 
      taskHistoryEventCount: 0,
    }),
    getTaskInfo: (): ObservabilityTaskInfo => ({ 
      active: [], queued: [], recentlyCompleted: [], recentlyPreempted: [], recentlyFailed: [] 
    }),
    getDeliveryInfo: (): ObservabilityDeliveryInfo => ({
      supervisorPresent: true, 
      currentAppVersion: '1.0.0-replay', 
      previousAppVersion: null,
      heartbeatOk: true, 
      updateChannel: 'single', 
      updateStatus: 'idle', 
      lastError: null, 
      rollbackReason: null,
    }),
    getPeerInfo: (): ObservabilityPeerInfo[] => {
      return trustRegistry.getAllPeers().map(p => {
        const track = scenario.peerTracks[p.peerId];
        return {
          peerId: p.peerId,
          trustState: p.state,
          discoveredAt: p.discoveredAt,
          trustedAt: p.trustedAt,
          source: 'replay', 
          loadScore: track ? evaluateContinuous(track.load, now()) : null,
          capabilities: track ? evaluateStep(track.capabilities, now()) : null,
        };
      });
    },
  };
}