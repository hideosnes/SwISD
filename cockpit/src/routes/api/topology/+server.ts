/**
 * 1. Relative path: cockpit/src/routes/api/topology/+server.ts
 * 2. Description: BFF API route that aggregates the core's local observability, trust registry, and mDNS discovery into a SwarmTopologyDTO.
 * 3. Expects: GET request from the Conductor Cockpit client.
 * 4. Provides: Strict SwarmTopologyDTO JSON response with device type, modality encoding, friendly hostnames, and liveness state.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { buildSwarmTopology, type TopologyPeerInput, getDiscoveredNodes } from '$lib/server/index.js';

export const GET: RequestHandler = async ({ locals }) => {
  const processInfo = locals.coreSource.getProcessInfo();
  const peerInfos = locals.coreSource.getPeerInfo();
  const discovered = getDiscoveredNodes();
  
  // Map discovered nodes to a lookup for friendly hostnames and lastSeen timestamps
  const discoveryMap = new Map(discovered.map(n => [n.peerId, { hostname: n.hostname, lastSeen: n.lastSeen }]));

  const peers: ReadonlyArray<TopologyPeerInput> = peerInfos.map((p) => {
    const discovery = discoveryMap.get(p.peerId);
    
    // Liveness logic:
    // 1. Local node (conductor) is always online (it doesn't mDNS to itself).
    // 2. Remote node with mDNS discovery: use mDNS lastSeen.
    // 3. Remote trusted node without mDNS: fall back to trustedAt (trust implies recent liveness).
    // 4. Remote pending node without mDNS: null (offline).
    let lastSeenAt: number | null = null;
    if (p.peerId === processInfo.peerId) {
      lastSeenAt = Date.now(); // Local node is always online
    } else if (discovery?.lastSeen) {
      lastSeenAt = discovery.lastSeen;
    } else if (p.trustState === 'trusted' && p.trustedAt !== null) {
      lastSeenAt = p.trustedAt; // Pragmatic fallback: trust implies liveness
    }

    return {
      peerId: p.peerId,
      hostname: discovery?.hostname ?? null,
      trustState: p.trustState,
      discoveredAt: p.discoveredAt,
      lastSeenAt,
      source: p.source,
      capabilities: (p.capabilities ?? []) as unknown as ReadonlyArray<string>,
      loadScore: p.loadScore,
      activeTaskCount: null,
      deviceType: p.deviceType,
      modalities: p.modalities,
    };
  });

  const dto = buildSwarmTopology({
    generatedAt: Date.now(),
    conductorPeerId: processInfo.peerId,
    peers,
  });

  return json(dto);
};