// src/types.ts
// Description: Shared runtime types and interfaces for the SwISD decentralized swarm.
// Expects: Strict TypeScript compiler settings (noImplicitAny, strictNullChecks).
// Provides: Exhaustive, explicit type definitions for CRDTs, networking, tasks, and crypto.

export type PeerRole = 'input' | 'worker' | 'diplomat' | 'auto';

export interface PeerCapabilities {
  peerId: string;
  role: PeerRole;
  availableMemoryBytes: number;
  availableStorageBytes: number;
  modelSupport: ReadonlyArray<string>;
  lastHeartbeat: number;
  signature: Uint8Array;
}

export type LoadScore = number; // Constrained 0.0 to 1.0 at runtime

export interface ReputationEvent {
  eventId: string;
  targetPeerId: string;
  outcome: 'success' | 'failure';
  latencyMs: number;
  timestamp: number;
  signature: Uint8Array;
}

export interface TaskHistoryEvent {
  eventId: string;
  taskId: string;
  action: 'created' | 'fragmented' | 'assigned' | 'completed' | 'preempted' | 'failed';
  peerId: string;
  timestamp: number;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface TaskFragment {
  taskId: string;
  chunkIndex: number;
  totalChunks: number;
  payload: Uint8Array;
  hmac: Uint8Array;
  merkleProof: ReadonlyArray<string>;
}

export interface TaskAssignment {
  taskId: string;
  assignedPeerId: string;
  fragments: ReadonlyArray<TaskFragment>;
  deadlineMs: number;
}

export type UpdateStatus = 'idle' | 'probing' | 'downloading' | 'applying' | 'reverting' | 'updated';

export interface UpdateManifest {
  version: string;
  assetUrl: string;
  sha256: string;
  signature: Uint8Array;
  chunks: ReadonlyArray<string>;
  sizeBytes: number;
  minSupervisorVersion: string;
}

export interface UpdateSchedule {
  version: string;
  scheduledTimeMs: number;
  peerId: string;
}

export interface BloomFilterState {
  filter: Uint8Array;
  hashFunctionsCount: number;
}

export interface GossipMessage<T> {
  messageId: string;
  senderPeerId: string;
  timestamp: number;
  ttlBloom: BloomFilterState;
  payload: T;
  signature: Uint8Array;
}