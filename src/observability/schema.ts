// src/observability/schema.ts
// Description: Strict schema types for the SwISD observability plane.
// Expects: Runtime state providers and typed event payloads.
// Provides: Exhaustive observability contracts for snapshots, events, and source adapters.

import type { LoadScore, PeerRole, UpdateStatus } from '../types.js';

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
  | 'observability';

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
  readonly currentAppVersion: string;
  readonly previousAppVersion: string | null;
  readonly heartbeatOk: boolean;
  readonly updateChannel: 'single';
  readonly updateStatus: UpdateStatus;
}

export interface ObservabilitySnapshot {
  readonly generatedAt: number;
  readonly process: ObservabilityProcessInfo;
  readonly network: ObservabilityNetworkInfo;
  readonly load: ObservabilityLoadInfo;
  readonly crdt: ObservabilityCrdtInfo;
  readonly tasks: ObservabilityTaskInfo;
  readonly delivery: ObservabilityDeliveryInfo;
  readonly recentEvents: ReadonlyArray<ObservabilityEvent>;
}

export interface ObservabilitySource {
  getProcessInfo(): ObservabilityProcessInfo;
  getNetworkInfo(): ObservabilityNetworkInfo;
  getLoadInfo(): ObservabilityLoadInfo;
  getCrdtInfo(): ObservabilityCrdtInfo;
  getTaskInfo(): ObservabilityTaskInfo;
  getDeliveryInfo(): ObservabilityDeliveryInfo;
}