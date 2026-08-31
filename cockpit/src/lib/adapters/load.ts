// 1. Relative path: cockpit/src/lib/adapters/load.ts
// 2. Description: Domain adapter mapping load scores to StatusPill semantic vocabulary.
// 3. Expects: A numeric load score (0-1) from the observability plane.
// 4. Provides: Pure functions to translate domain load metrics into UI primitive statuses.

import type { Status } from '$lib/components/ui/index.js';

export function loadToStatus(loadScore: number | null): Status {
  if (loadScore === null) return 'idle';
  if (loadScore > 0.8) return 'warn'; // Shedding / Critical
  if (loadScore > 0.6) return 'warn'; // Throttled
  return 'idle';
}