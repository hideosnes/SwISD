// 1. Relative path: src/observability/schema.ts
// 2. Description: Strict schema types for the SwISD observability plane.
// 3. Expects: Runtime state providers and typed event payloads.
// 4. Provides: Exhaustive observability contracts for snapshots, events, and source adapters.

import type { LoadScore, PeerRole, UpdateStatus } from '../types.js';
import type { ExecutorSignature } from '../tasks/index.js';

export type ObservabilityEventLevel = 'info' | 'warn' | 'error';

export type ObservabilityEventTopic =
  | 'admin'
  | 'network'
  | 'peer'
  | 'task'
  | 'crdt'
  | 'gossip'
  | 'load'
  | 'delivery'
  | 'observability'
  | 'system'
  | 'performance'
  | 'trust';

export type ObservabilityEventDetails = Readonly<Record<string, string | number | boolean | null>>;

export interface ObservabilityEventInput {
  readonly topic: ObservabilityEventTopic;
  readonly level: ObservabilityEventLevel;
  readonly message: string;
  readonly details?: ObservabilityEventDetails;
}

export interface ObservabilityEvent {
  readonly sequence: number;
  readonly timestamp: number;
  readonly topic: ObservabilityEventTopic;
  readonly level: ObservabilityEventLevel;
  readonly message: string;
  readonly details: ObservabilityEventDetails;
}

export interface ObservabilityProcessInfo {
  readonly peerId: string;
  readonly version: string;
  readonly role: PeerRole;
  readonly startedAt: number;
  readonly uptimeMs: number;
  readonly configSource: 'usb' | 'env' | 'stub';
}

export interface ObservabilityNetworkInfo {
  readonly listenAddresses: ReadonlyArray<string>;
  readonly neighborCount: number;
  readonly knownPeers: ReadonlyArray<string>;
  readonly gossipEnabled: boolean;
  readonly mdnsActive: boolean;
}

export type ObservabilityBackpressureState = 'idle' | 'throttled' | 'shedding';

export interface ObservabilityLoadInfo {
  readonly loadScore: LoadScore;
  readonly activeTaskCount: number;
  readonly queuedTaskCount: number;
  readonly backpressureState: ObservabilityBackpressureState;
  readonly rejectedTaskCount: number;
  readonly droppedLowPriorityTaskCount: number;
}

export interface ObservabilityCrdtRoots {
  readonly membership: string;
  readonly capabilities: string;
  readonly reputation: string;
  readonly taskHistory: string;
  readonly vectorMetadata: string;
}

export interface ObservabilityCrdtInfo {
  readonly roots: ObservabilityCrdtRoots;
  readonly reputationEventCount: number;
  readonly reputationReadTimeScore: number;
  readonly taskHistoryEventCount: number;
}

export interface ObservabilityTaskInfo {
  readonly active: ReadonlyArray<string>;
  readonly queued: ReadonlyArray<string>;
  readonly recentlyCompleted: ReadonlyArray<string>;
  readonly recentlyPreempted: ReadonlyArray<string>;
  readonly recentlyFailed: ReadonlyArray<string>;
}

export interface ObservabilityDeliveryInfo {
  readonly supervisorPresent: boolean;
  readonly currentAppVersion: string | null;
  readonly previousAppVersion: string | null;
  readonly heartbeatOk: boolean;
  readonly updateChannel: 'single';
  readonly updateStatus: UpdateStatus;
  readonly lastError: string | null;
  readonly rollbackReason: string | null;
}

export type ObservabilityPeerTrustState = 'pending' | 'trusted' | 'rejected';
export type ObservabilityPeerSource = 'mdns' | 'genesis' | 'manual' | 'replay';

// Phase B: Device type and modality encoding
export type DeviceType = 'raspi' | 'arduino' | 'android' | 'ios' | 'windows' | 'linux' | 'apple' | 'unknown';
export type ModalityCode = 'T2T' | 'T2I' | 'I2T' | 'T2A' | 'A2T' | 'I2I' | 'A2A';

export interface ObservabilityPeerInfo {
  readonly peerId: string;
  readonly trustState: ObservabilityPeerTrustState;
  readonly discoveredAt: number;
  readonly trustedAt: number | null;
  readonly source: ObservabilityPeerSource;
  readonly loadScore: number | null;
  readonly capabilities: ReadonlyArray<ExecutorSignature> | null;
  readonly deviceType: DeviceType;
  readonly modalities: ReadonlyArray<ModalityCode>;
}

export interface SwarmSnapshot {
  readonly timestamp: number;
  readonly process: ObservabilityProcessInfo;
  readonly network: ObservabilityNetworkInfo;
  readonly load: ObservabilityLoadInfo;
  readonly crdt: ObservabilityCrdtInfo;
  readonly tasks: ObservabilityTaskInfo;
  readonly delivery: ObservabilityDeliveryInfo;
  readonly peers: ReadonlyArray<ObservabilityPeerInfo>;
  readonly recentEvents: ReadonlyArray<ObservabilityEvent>;
  readonly source: 'live' | 'replay';
}

export interface ObservabilitySource {
  getProcessInfo(): ObservabilityProcessInfo;
  getNetworkInfo(): ObservabilityNetworkInfo;
  getLoadInfo(): ObservabilityLoadInfo;
  getCrdtInfo(): ObservabilityCrdtInfo;
  getTaskInfo(): ObservabilityTaskInfo;
  getDeliveryInfo(): ObservabilityDeliveryInfo;
  getPeerInfo(): ReadonlyArray<ObservabilityPeerInfo>;
}