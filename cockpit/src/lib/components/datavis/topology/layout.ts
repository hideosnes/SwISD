// 1. Relative path: cockpit/src/lib/components/datavis/topology/layout.ts
// 2. Description: Deterministic orbital layout engine for the swarm topology canvas. Conductor sits at the center; trusted peers orbit the trust ring; pending ghosts dock in the limbo orbit; rejected peers are excluded from the canvas entirely. D3 is used strictly as headless math.
// 3. Expects: A SwarmTopologyDTO and a validated OrbitalLayoutConfig sized to the viewport.
// 4. Provides: computeOrbitalLayout() returning stable positions, and defaultOrbitalConfig() deriving proportional radii from viewport dimensions.

import { scaleLinear } from 'd3-scale';

import type { SwarmTopologyDTO, TopologyPeerDTO } from '$lib/server/topology.js';
import type {
  LaidOutPeer,
  OrbitalLayoutConfig,
  OrbitalLayoutResult,
  OrbitalRingKind,
  OrbitalRingModel,
  Point,
} from '../types.js';

const TAU = Math.PI * 2;
// First node of each ring sits at the top of the orbit. Deterministic, not decorative.
const TOP_ANGLE_OFFSET_RAD = -Math.PI / 2;

function comparePeerId(a: TopologyPeerDTO, b: TopologyPeerDTO): number {
  if (a.peerId < b.peerId) return -1;
  if (a.peerId > b.peerId) return 1;
  return 0;
}

function validateConfig(config: OrbitalLayoutConfig): void {
  if (!Number.isFinite(config.width) || config.width <= 0) {
    throw new RangeError('OrbitalLayoutConfig.width must be a positive finite number');
  }
  if (!Number.isFinite(config.height) || config.height <= 0) {
    throw new RangeError('OrbitalLayoutConfig.height must be a positive finite number');
  }
  if (config.trustRingRadius >= config.limboRingRadius) {
    throw new RangeError('trustRingRadius must be strictly smaller than limboRingRadius');
  }
  if (config.nodeBaseRadius > config.nodeMaxRadius) {
    throw new RangeError('nodeBaseRadius must not exceed nodeMaxRadius');
  }
  const halfMinSide = Math.min(config.width, config.height) / 2;
  if (config.limboRingRadius + config.nodeMaxRadius > halfMinSide) {
    throw new RangeError('limbo orbit plus max node radius must fit inside the viewport');
  }
}

function placeRing(
  peers: ReadonlyArray<TopologyPeerDTO>,
  ring: OrbitalRingKind,
  ringRadius: number,
  center: Point,
  angleOffsetRad: number,
  nodeRadiusFor: (loadScore: number) => number,
): ReadonlyArray<LaidOutPeer> {
  const sorted = [...peers].sort(comparePeerId);
  const count = sorted.length;

  return sorted.map((peer, index): LaidOutPeer => {
    const angleRad = angleOffsetRad + TOP_ANGLE_OFFSET_RAD + (TAU * index) / count;
    return {
      peer,
      ring,
      angleRad,
      position: {
        x: center.x + ringRadius * Math.cos(angleRad),
        y: center.y + ringRadius * Math.sin(angleRad),
      },
      // Unknown load renders at base radius. We do not inflate ghosts with fake numbers.
      nodeRadius: nodeRadiusFor(peer.loadScore ?? 0),
    };
  });
}

export function computeOrbitalLayout(
  topology: SwarmTopologyDTO,
  config: OrbitalLayoutConfig,
): OrbitalLayoutResult {
  validateConfig(config);

  const center: Point = { x: config.width / 2, y: config.height / 2 };

  const radiusScale = scaleLinear()
    .domain([0, 1])
    .range([config.nodeBaseRadius, config.nodeMaxRadius])
    .clamp(true);
  const nodeRadiusFor = (loadScore: number): number => radiusScale(loadScore);

  const trusted = topology.peers.filter((peer) => peer.trustState === 'trusted');
  const pending = topology.peers.filter((peer) => peer.trustState === 'pending');
  // Rejected peers are intentionally invisible on the canvas. They live in lists, not maps.

  const peers: ReadonlyArray<LaidOutPeer> = [
    ...placeRing(trusted, 'trust', config.trustRingRadius, center, config.angleOffsetRad, nodeRadiusFor),
    ...placeRing(pending, 'limbo', config.limboRingRadius, center, config.angleOffsetRad, nodeRadiusFor),
  ];

  const rings: ReadonlyArray<OrbitalRingModel> = [
    { kind: 'trust', center, radius: config.trustRingRadius },
    { kind: 'limbo', center, radius: config.limboRingRadius },
  ];

  return {
    center,
    conductorRadius: config.conductorRadius,
    rings,
    peers,
  };
}

export function defaultOrbitalConfig(width: number, height: number): OrbitalLayoutConfig {
  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError('width must be a positive finite number');
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new RangeError('height must be a positive finite number');
  }

  const minSide = Math.min(width, height);
  return {
    width,
    height,
    conductorRadius: minSide * 0.055,
    trustRingRadius: minSide * 0.3,
    limboRingRadius: minSide * 0.44,
    nodeBaseRadius: minSide * 0.03,
    nodeMaxRadius: minSide * 0.052,
    angleOffsetRad: 0,
  };
}