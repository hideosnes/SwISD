/**
 * 1. Relative path: src/crdt/structures.ts
 * 2. Description: Strict TypeScript interfaces for the custom Merkle-DAG structured CRDTs (OR-Set, LWW, G-Set, OR-Map).
 * 3. Expects: Cryptographic signatures, timestamps, and Merkle-DAG node references.
 * 4. Provides: The foundational state shapes for peer membership, capabilities, reputation, task history, and vector metadata.
 */

import type { ReputationEvent, TaskHistoryEvent, PeerCapabilities } from '../types.js';

export interface ORSetElement<T> {
  readonly value: T;
  readonly uniqueTag: string;
}

export interface ORSet<T> {
  readonly elements: ReadonlyArray<ORSetElement<T>>;
  readonly tombstones: ReadonlySet<string>;
}

export interface LWWRegister<T> {
  readonly value: T;
  readonly timestamp: number;
  readonly writerPeerId: string;
  readonly signature: Uint8Array;
}

export interface GSet<T> {
  readonly elements: ReadonlySet<T>;
}

export interface ORMap<K, V> {
  readonly entries: ReadonlyMap<K, ORSet<V>>;
}

// --- SwISD Specific CRDT Mappings ---

export interface PeerMembershipCRDT extends ORSet<string> {} // Set of PeerIds

export interface DeviceCapabilitiesCRDT extends LWWRegister<PeerCapabilities> {}

export interface ReputationLogCRDT extends GSet<ReputationEvent> {}

export interface TaskHistoryCRDT extends GSet<TaskHistoryEvent> {}

export interface VectorMetadataCRDT extends ORMap<string, string> {} // Key: embedding ID, Value: peer ID holding it