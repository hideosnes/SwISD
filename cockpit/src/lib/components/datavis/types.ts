// 1. Relative path: cockpit/src/lib/components/datavis/types.ts
// 2. Description: Geometry and layout contracts for the datavis layer. Pure visualization vocabulary: points, orbital rings, laid-out peers, layout configuration, device types, and modality codes.
// 3. Expects: A SwarmTopologyDTO from the BFF plus a viewport-sized OrbitalLayoutConfig.
// 4. Provides: Strict prop and result types consumed by TopologyCanvas, SwarmNode, GhostNode, TrustRing, and ModalityLegend.

import type { TopologyPeerDTO } from '$lib/server/topology.js';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type OrbitalRingKind = 'trust' | 'limbo';

export interface OrbitalRingModel {
  readonly kind: OrbitalRingKind;
  readonly center: Point;
  readonly radius: number;
}

export interface OrbitalLayoutConfig {
  readonly width: number;
  readonly height: number;
  readonly conductorRadius: number;
  readonly trustRingRadius: number;
  readonly limboRingRadius: number;
  readonly nodeBaseRadius: number;
  readonly nodeMaxRadius: number;
  readonly angleOffsetRad: number;
}

export interface LaidOutPeer {
  readonly peer: TopologyPeerDTO;
  readonly ring: OrbitalRingKind;
  readonly angleRad: number;
  readonly position: Point;
  readonly nodeRadius: number;
}

export interface OrbitalLayoutResult {
  readonly center: Point;
  readonly conductorRadius: number;
  readonly rings: ReadonlyArray<OrbitalRingModel>;
  readonly peers: ReadonlyArray<LaidOutPeer>;
}

export type DeviceType = 'raspi' | 'arduino' | 'android' | 'ios' | 'windows' | 'linux' | 'apple' | 'unknown';

export type ModalityCode = 'T2T' | 'T2I' | 'I2T' | 'T2A' | 'A2T' | 'I2I' | 'A2A';