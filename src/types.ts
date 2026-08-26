// 1. Relative path: src/types.ts
// 2. Description: Shared runtime types and interfaces for the SwISD decentralized swarm.
// 3. Expects: Strict TypeScript compiler settings (noImplicitAny, strictNullChecks).
// 4. Provides: Exhaustive, explicit type definitions for CRDTs, networking, tasks, crypto, and delivery.

export type PeerRole = 'input' | 'worker' | 'diplomat' | 'auto';

export interface PeerCapabilities {
  readonly peerId: string;
  readonly role: PeerRole;
  readonly availableMemoryBytes: number;
  readonly availableStorageBytes: number;
  readonly modelSupport: ReadonlyArray<string>;
  readonly lastHeartbeat: number;
  readonly signature: Uint8Array;
}

export type LoadScore = number; // Constrained 0.0 to 1.0 at runtime

export interface ReputationEvent {
  readonly eventId: string;
  readonly targetPeerId: string;
  readonly outcome: 'success' | 'failure';
  readonly latencyMs: number;
  readonly timestamp: number;
  readonly signature: Uint8Array;
}

export interface TaskHistoryEvent {
  readonly eventId: string;
  readonly taskId: string;
  readonly action: 'created' | 'fragmented' | 'assigned' | 'completed' | 'preempted' | 'failed';
  readonly peerId: string;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface TaskFragment {
  readonly taskId: string;
  readonly chunkIndex: number;
  readonly totalChunks: number;
  readonly payload: Uint8Array;
  readonly hmac: Uint8Array;
  readonly merkleProof: ReadonlyArray<string>;
}

export interface TaskAssignment {
  readonly taskId: string;
  readonly assignedPeerId: string;
  readonly fragments: ReadonlyArray<TaskFragment>;
  readonly deadlineMs: number;
}

export type UpdateStatus = 'idle' | 'probing' | 'downloading' | 'applying' | 'reverting' | 'updated';

export interface UpdateManifest {
  readonly version: string;
  readonly assetUrl: string;
  readonly sha256: string;
  readonly signature: Uint8Array;
  readonly chunks: ReadonlyArray<string>;
  readonly sizeBytes: number;
  readonly minSupervisorVersion: string;
}

export interface UpdateSchedule {
  readonly version: string;
  readonly scheduledTimeMs: number;
  readonly peerId: string;
}

export interface BloomFilterState {
  readonly filter: Uint8Array;
  readonly hashFunctionsCount: number;
}

export interface GossipMessage<T> {
  readonly messageId: string;
  readonly senderPeerId: string;
  readonly timestamp: number;
  readonly ttlBloom: BloomFilterState;
  readonly payload: T;
  readonly signature: Uint8Array;
}

export interface AppHeartbeat {
  readonly timestamp: number;
  readonly version: string;
  readonly peerId: string;
  readonly pid: number;
}

export interface SupervisorStatus {
  readonly supervisorVersion: string;
  readonly isRunning: boolean;
  readonly currentAppVersion: string | null;
  readonly previousAppVersion: string | null;
  readonly targetUpdateVersion: string | null;
  readonly updateStatus: UpdateStatus;
  readonly lastHeartbeatCheck: number | null;
  readonly lastError: string | null;
  readonly rollbackReason: string | null;
}