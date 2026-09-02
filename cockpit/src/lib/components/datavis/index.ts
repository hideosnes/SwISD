// 1. Relative path: cockpit/src/lib/components/datavis/index.ts
// 2. Description: Barrel for the datavis layer. The single import surface for all computational geometry and visualization contracts.
// 3. Expects: Consumers to import exclusively from this barrel, never from deep paths.
// 4. Provides: Orbital layout engine, geometry types, topology DTO type re-exports, and Svelte visualization components.

export { computeOrbitalLayout, defaultOrbitalConfig } from './topology/layout.js';
export type {
  LaidOutPeer,
  OrbitalLayoutConfig,
  OrbitalLayoutResult,
  OrbitalRingKind,
  OrbitalRingModel,
  Point,
} from './types.js';
export type {
  SwarmTopologyDTO,
  TopologyPeerDTO,
  TopologyTrustState,
} from '$lib/server/index.js';

export { default as TopologyCanvas } from './topology/TopologyCanvas.svelte';
export { default as SwarmNode } from './topology/SwarmNode.svelte';
export { default as GhostNode } from './topology/GhostNode.svelte';
export { default as TrustRing } from './topology/TrustRing.svelte';
export { default as TopologyAnatomyBench } from './topology/TopologyAnatomyBench.svelte';