// src/storage/capacity.ts
// Description: Elastic Capacity Allocation engine. Calculates swarm-wide storage watermarks and determines replication factors without static roles.
// Expects: Gossiped peer storage capabilities and current chunk replication counts.
// Provides: Dynamic replication targets and load-shedding decisions based on real-time swarm topology.

import { PeerCapabilities } from '../types.js';
import { SwISDError } from '../errors.js';

export interface SwarmCapacitySnapshot {
  readonly totalCapacityBytes: number;
  readonly usedCapacityBytes: number;
  readonly peerCapacities: ReadonlyMap<string, PeerStorageCapacity>;
}

export interface PeerStorageCapacity {
  readonly peerId: string;
  readonly availableBytes: number;
  readonly totalBytes: number;
  readonly lastUpdated: number;
}

/**
 * Calculates the target replication factor for a given payload size based on swarm capacity.
 * Ensures we don't over-replicate and choke the swarm, or under-replicate and risk data loss.
 */
export function calculateTargetReplicationFactor(
  payloadSizeBytes: number,
  swarmSnapshot: SwarmCapacitySnapshot,
  minReplicas: number = 3
): number {
  if (!Number.isFinite(payloadSizeBytes) || payloadSizeBytes <= 0) {
    throw new SwISDError('ERR_UNKNOWN', 'Payload size must be a positive finite number.');
  }

  if (!Number.isInteger(minReplicas) || minReplicas < 1) {
    throw new SwISDError('ERR_UNKNOWN', 'Minimum replica count must be a positive integer.');
  }

  if (!Number.isFinite(swarmSnapshot.totalCapacityBytes) || !Number.isFinite(swarmSnapshot.usedCapacityBytes)) {
    throw new SwISDError('ERR_UNKNOWN', 'Swarm capacity snapshot contains invalid capacity values.');
  }

  const totalAvailable = swarmSnapshot.totalCapacityBytes - swarmSnapshot.usedCapacityBytes;

  if (!Number.isFinite(totalAvailable) || totalAvailable <= 0) {
    return 1;
  }

  // If the swarm doesn't have enough raw space to hold at least minReplicas, we are in trouble.
  if (totalAvailable < payloadSizeBytes * minReplicas) {
    // Fallback: replicate as many times as we physically can, or 1 if we're completely full.
    return Math.max(1, Math.floor(totalAvailable / payloadSizeBytes));
  }

  // Standard policy: Aim for minReplicas, but scale up if we have massive excess capacity.
  const excessRatio = totalAvailable / (payloadSizeBytes * minReplicas);
  if (excessRatio > 5) {
    return minReplicas + 2; // Over-replicate slightly for extreme resilience
  }

  return minReplicas;
}

/**
 * Selects the best peers to host new chunks based on available capacity.
 * Sorts peers by available space descending, ensuring we don't fill up a single Pi.
 */
export function selectHostPeers(
  swarmSnapshot: SwarmCapacitySnapshot,
  requiredCount: number,
  excludePeerIds: ReadonlySet<string> = new Set()
): ReadonlyArray<string> {
  if (!Number.isInteger(requiredCount) || requiredCount <= 0) {
    return [];
  }

  const candidates: PeerStorageCapacity[] = [];

  for (const [peerId, cap] of swarmSnapshot.peerCapacities) {
    if (excludePeerIds.has(peerId)) continue;
    if (!Number.isFinite(cap.availableBytes) || cap.availableBytes <= 0) continue;
    candidates.push(cap);
  }

  // Sort by available space descending (richest peers first)
  candidates.sort((a, b) => b.availableBytes - a.availableBytes);

  return candidates.slice(0, requiredCount).map(c => c.peerId);
}