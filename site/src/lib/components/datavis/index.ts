/**
 * 1. Relative path: site/src/lib/components/datavis/index.ts
 * 2. Description: Barrel export for the marketing site datavis primitives. Strictly separated from ui/.
 * 3. Expects: Datavis components and their public types.
 * 4. Provides: The sole import surface for feature code consuming datavis.
 */
export { default as OrbitExplainer } from './OrbitExplainer.svelte';
export type { OrbitActorId, Rundown } from './types';