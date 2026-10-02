/**
 * 1. Relative path: cockpit/src/routes/api/topology/+server.ts
 * 2. Description: BFF API route that aggregates the core's local observability, trust registry, and mDNS discovery into a SwarmTopologyDTO.
 * 3. Expects: GET request from the Conductor Cockpit client.
 * 4. Provides: Strict SwarmTopologyDTO JSON response with device type, modality encoding, and friendly hostnames.
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
  
  // Map discovered nodes to a lookup for friendly hostnames
  const hostnameMap = new Map(discovered.map(n => [n.peerId, n.hostname]));

  const peers: ReadonlyArray<TopologyPeerInput> = peerInfos.map((p) => ({
    peerId: p.peerId,
    hostname: hostnameMap.get(p.peerId) ?? null,
    trustState: p.trustState,
    discoveredAt: p.discoveredAt,
    lastSeenAt: p.trustedAt,
    source: p.source,
    // ExecutorSignature is a branded string in the core; cast safely to string array for the DTO
    capabilities: (p.capabilities ?? []) as unknown as ReadonlyArray<string>,
    loadScore: p.loadScore,
    activeTaskCount: null,
    deviceType: p.deviceType,
    modalities: p.modalities,
  }));

  const dto = buildSwarmTopology({
    generatedAt: Date.now(),
    conductorPeerId: processInfo.peerId,
    peers,
  });

  return json(dto);
};