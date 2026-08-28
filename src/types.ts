// 1. Relative path: src/types.ts
// 2. Description: Shared runtime types and interfaces for the SwISD decentralized swarm.
// 3. Expects: Strict TypeScript compiler settings (noImplicitAny, strictNullChecks).
// 4. Provides: Exhaustive, explicit type definitions for CRDTs, networking, tasks, crypto, delivery, and peer trust.

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

// --- Execution & Routing Types ---

export interface ExecutionPayload {
  readonly taskId: string;
  readonly requiredExecutorType: string;
  readonly chunkCids: ReadonlyArray<string>;
  readonly deadlineMs: number;
  readonly returnAddress: string; // Peer ID of the Conductor/Requester
}

export interface TaskResultPayload {
  readonly taskId: string;
  readonly resultCid: string;
  readonly returnAddress: string;
  readonly success: boolean;
  readonly errorMessage?: string;
}

export type GossipPayload = ExecutionPayload | TaskResultPayload | ReputationEvent | TaskHistoryEvent;

export interface GossipMessage<T extends GossipPayload = GossipPayload> {
  readonly messageId: string;
  readonly senderPeerId: string;
  readonly timestamp: number;
  readonly ttlBloom: BloomFilterState;
  readonly payload: T;
  readonly signature: Uint8Array;
}

// --- Strict Type Guards ---

export function isExecutionPayload(payload: unknown): payload is ExecutionPayload {
  const p = payload as Record<string, unknown>;
  return (
    typeof p?.taskId === 'string' &&
    typeof p?.requiredExecutorType === 'string' &&
    Array.isArray(p?.chunkCids) &&
    p.chunkCids.every((cid) => typeof cid === 'string') &&
    typeof p?.deadlineMs === 'number' &&
    typeof p?.returnAddress === 'string'
  );
}

export function isTaskResultPayload(payload: unknown): payload is TaskResultPayload {
  const p = payload as Record<string, unknown>;
  return (
    typeof p?.taskId === 'string' &&
    typeof p?.resultCid === 'string' &&
    typeof p?.returnAddress === 'string' &&
    typeof p?.success === 'boolean' &&
    (p.errorMessage === undefined || typeof p.errorMessage === 'string')
  );
}

// --- Heartbeat & Supervisor Types ---

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

// --- Genesis & Trust Protocol Types ---

export type PeerTrustState = 'pending' | 'trusted' | 'rejected';

export interface PeerTrustRecord {
  readonly peerId: string;
  readonly state: PeerTrustState;
  readonly discoveredAt: number;
  readonly trustedAt: number | null;
  readonly source: 'mdns' | 'gossip' | 'usb';
}

export interface GenesisConfig {
  readonly ssid: string;
  readonly psk: string;
}