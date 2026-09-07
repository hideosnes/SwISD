/**
 * 1. Relative path: site/src/lib/components/datavis/types.ts
 * 2. Description: Strict DTOs for the marketing orbit explainer.
 * 3. Expects: Consumers to supply a readonly rundown dataset.
 * 4. Provides: OrbitActorId union and Rundown contract for actor → pillar explanations.
 */

export type OrbitActorId = 'conductor' | 'worker' | 'diplomat' | 'ghost';

export interface Rundown {
  readonly actorId: OrbitActorId;
  readonly pillar: string;
  readonly title: string;
  readonly text: string;
  readonly chipLabel?: string;
}