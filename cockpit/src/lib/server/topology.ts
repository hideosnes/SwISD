/**
 * 1. Relative path: cockpit/src/lib/server/topology.ts
 * 2. Description: BFF-owned DTO contract and pure builder for the swarm topology graph.
 * 3. Expects: Plain cockpit-owned input records from the core ObservabilitySource and mDNS discovery map.
 * 4. Provides: SwarmTopologyDTO contract with device type, modality encoding, friendly hostnames, and liveness state.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import type { DeviceType, ModalityCode } from '$lib/components/datavis/types.js';

export type TopologyTrustState = 'pending' | 'trusted' | 'rejected';
export type TopologyPresenceState = 'online' | 'offline';

export interface TopologyPeerInput {
  readonly peerId: string;
  readonly hostname: string | null;
  readonly trustState: TopologyTrustState;
  readonly discoveredAt: number;
  readonly lastSeenAt: number | null;
  readonly source: string;
  readonly capabilities: ReadonlyArray<string>;
  readonly loadScore: number | null;
  readonly activeTaskCount: number | null;
  readonly deviceType: DeviceType;
  readonly modalities: ReadonlyArray<ModalityCode>;
}

export interface TopologyBuildInput {
  readonly generatedAt: number;
  readonly conductorPeerId: string;
  readonly peers: ReadonlyArray<TopologyPeerInput>;
}

export interface TopologyPeerDTO {
  readonly peerId: string;
  readonly hostname: string | null;
  readonly trustState: TopologyTrustState;
  readonly presence: TopologyPresenceState;
  readonly discoveredAt: number;
  readonly lastSeenAt: number | null;
  readonly source: string;
  readonly capabilities: ReadonlyArray<string>;
  readonly loadScore: number | null;
  readonly activeTaskCount: number | null;
  readonly deviceType: DeviceType;
  readonly modalities: ReadonlyArray<ModalityCode>;
}

export interface SwarmTopologyDTO {
  readonly generatedAt: number;
  readonly conductorPeerId: string;
  readonly swarmSize: number;
  readonly ghostCount: number;
  readonly offlineCount: number;
  readonly peers: ReadonlyArray<TopologyPeerDTO>;
}

const MIN_LOAD_SCORE = 0;
const MAX_LOAD_SCORE = 1;

function sanitizeLoadScore(raw: number | null): number | null {
  if (raw === null) return null;
  if (Number.isNaN(raw)) return null;
  if (!Number.isFinite(raw)) return raw > 0 ? MAX_LOAD_SCORE : MIN_LOAD_SCORE;
  return Math.min(MAX_LOAD_SCORE, Math.max(MIN_LOAD_SCORE, raw));
}

function sanitizeCount(raw: number | null): number | null {
  if (raw === null) return null;
  if (!Number.isFinite(raw)) return null;
  return Math.max(0, Math.trunc(raw));
}

function comparePeerId(a: TopologyPeerDTO, b: TopologyPeerDTO): number {
  if (a.peerId < b.peerId) return -1;
  if (a.peerId > b.peerId) return 1;
  return 0;
}

export function buildSwarmTopology(input: TopologyBuildInput): SwarmTopologyDTO {
  if (input.conductorPeerId.length === 0) {
    throw new TypeError('conductorPeerId must be a non-empty string');
  }

  const deduped = new Map<string, TopologyPeerInput>();
  for (const peer of input.peers) {
    if (peer.peerId.length === 0) {
      throw new TypeError('peerId must be a non-empty string');
    }
    if (peer.peerId === input.conductorPeerId) continue;

    const existing = deduped.get(peer.peerId);
    if (existing === undefined || peer.discoveredAt > existing.discoveredAt) {
      deduped.set(peer.peerId, peer);
    }
  }

  const now = input.generatedAt;
  const peers: ReadonlyArray<TopologyPeerDTO> = [...deduped.values()]
    .map((peer): TopologyPeerDTO => {
      // Determine liveness:
      // - Trusted peers are assumed online (prevents false negatives when mDNS is quiet).
      // - Pending peers must have recent mDNS activity (< 60s) to be considered online.
      const isTrusted = peer.trustState === 'trusted';
      const hasRecentMdns = peer.lastSeenAt !== null && (now - peer.lastSeenAt) < 60_000;
      const isOnline = isTrusted || hasRecentMdns;
      const presence: TopologyPresenceState = isOnline ? 'online' : 'offline';

      return {
        peerId: peer.peerId,
        hostname: peer.hostname,
        trustState: peer.trustState,
        presence,
        discoveredAt: peer.discoveredAt,
        lastSeenAt: peer.lastSeenAt,
        source: peer.source,
        capabilities: [...peer.capabilities],
        loadScore: sanitizeLoadScore(peer.loadScore),
        activeTaskCount: sanitizeCount(peer.activeTaskCount),
        deviceType: peer.deviceType,
        modalities: [...peer.modalities],
      };
    })
    .sort(comparePeerId);

  let swarmSize = 0;
  let ghostCount = 0;
  let offlineCount = 0;
  for (const peer of peers) {
    if (peer.trustState === 'trusted' && peer.presence === 'online') swarmSize += 1;
    else if (peer.trustState === 'pending') ghostCount += 1;
    if (peer.presence === 'offline') offlineCount += 1;
  }

  return {
    generatedAt: input.generatedAt,
    conductorPeerId: input.conductorPeerId,
    swarmSize,
    ghostCount,
    offlineCount,
    peers,
  };
}