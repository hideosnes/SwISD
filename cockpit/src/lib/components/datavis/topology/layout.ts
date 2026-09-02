// 1. Relative path: cockpit/src/lib/components/datavis/topology/layout.ts
// 2. Description: Deterministic orbital layout engine with modality color generation and stress arc math.
// 3. Expects: A SwarmTopologyDTO and a validated OrbitalLayoutConfig.
// 4. Provides: computeOrbitalLayout(), defaultOrbitalConfig(), modalityToColor(), and stressArcPath().

import { scaleLinear } from 'd3-scale';
import type { SwarmTopologyDTO, TopologyPeerDTO } from '$lib/server/topology.js';
import type {
  LaidOutPeer,
  OrbitalLayoutConfig,
  OrbitalLayoutResult,
  OrbitalRingKind,
  OrbitalRingModel,
  Point,
  ModalityCode,
} from '../types.js';

const TAU = Math.PI * 2;
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

/**
 * Generates a deterministic HSL color from a modality code.
 * Hashes the code string to a hue (0-360), fixed saturation and lightness.
 */
export function modalityToColor(modality: ModalityCode): string {
  let hash = 0;
  for (let i = 0; i < modality.length; i++) {
    hash = ((hash << 5) - hash) + modality.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/**
 * Generates a stress arc color from load score using piecewise linear HSL interpolation.
 * 0% = blue (hue 210), 50% = yellow (hue 60), 100% = red (hue 0).
 */
export function loadToStressColor(loadScore: number): string {
  const clamped = Math.max(0, Math.min(1, loadScore));
  let hue: number;
  if (clamped < 0.5) {
    hue = 210 - (clamped * 2 * 150);
  } else {
    hue = 60 - ((clamped - 0.5) * 2 * 60);
  }
  return `hsl(${Math.round(hue)}, 80%, 50%)`;
}

/**
 * Computes an SVG arc path for the stress ring.
 * Starts at 6 o'clock (bottom), sweeps clockwise.
 * 0% = no arc, 100% = full circle.
 */
export function stressArcPath(
  cx: number,
  cy: number,
  radius: number,
  loadScore: number
): string {
  if (loadScore <= 0) return '';
  if (loadScore >= 1) {
    // Full circle
    return `M ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy + radius} Z`;
  }

  const sweepAngle = loadScore * TAU;
  const startAngle = Math.PI / 2; // 6 o'clock in SVG coords
  const endAngle = startAngle + sweepAngle;

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);

  const largeArc = sweepAngle > Math.PI ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}