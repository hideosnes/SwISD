/**
 * 1. Relative path: site/src/lib/components/datavis/layout.ts
 * 2. Description: Deterministic orbital positioning math for the marketing orbit explainer. Pure functions, no DOM.
 * 3. Expects: A fixed square viewBox coordinate space.
 * 4. Provides: computeOrbitLayout() returning conductor, green neighborhood ring (worker/diplomat/siblings in adjacency order), blue outer swarm, lone ghost, radii, and bridge targets.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type GreenRole = 'worker' | 'diplomat' | 'sibling';

export interface GreenPip {
  readonly point: Point;
  readonly role: GreenRole;
}

export interface OrbitLayout {
  readonly conductor: Point;
  readonly worker: Point;
  readonly diplomat: Point;
  readonly ghost: Point;
  readonly greenRing: readonly GreenPip[];
  readonly blueRing: readonly Point[];
  readonly diplomatBlueTargets: readonly number[];
  readonly radii: {
    readonly green: number;
    readonly blue: number;
    readonly limbo: number;
  };
}

export const ORBIT_VIEWBOX = 800;

const CENTER: Point = { x: 400, y: 400 };

function polar(angleDeg: number, radius: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER.x + radius * Math.cos(rad),
    y: CENTER.y + radius * Math.sin(rad)
  };
}

export function computeOrbitLayout(): OrbitLayout {
  const radii = { green: 130, blue: 220, limbo: 320 };

  // Green neighborhood ring. Angular order defines left/right adjacency:
  // worker (top) → sibling (right) → diplomat (bottom) → sibling (left) → back to worker.
  const worker = polar(270, radii.green);
  const diplomat = polar(90, radii.green);
  const greenRing: GreenPip[] = [
    { point: worker, role: 'worker' },
    { point: polar(0, radii.green), role: 'sibling' },
    { point: diplomat, role: 'diplomat' },
    { point: polar(180, radii.green), role: 'sibling' }
  ];

  // Blue outer swarm, parked on the second ring.
  const blueRing: Point[] = [
    polar(60, radii.blue),
    polar(120, radii.blue),
    polar(240, radii.blue)
  ];

  // The diplomat (bottom of the green ring) is the sole bridge, reaching the two flanking blue pips.
  const diplomatBlueTargets = [0, 1];

  // The ghost waits alone in the limbo orbit.
  const ghost = polar(315, radii.limbo);

  return {
    conductor: CENTER,
    worker,
    diplomat,
    ghost,
    greenRing,
    blueRing,
    diplomatBlueTargets,
    radii
  };
}