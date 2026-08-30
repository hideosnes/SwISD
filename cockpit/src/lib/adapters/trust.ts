// 1. Relative path: cockpit/src/lib/adapters/trust.ts
// 2. Description: Domain-to-primitive adapters. Maps swarm trust states onto the StatusPill's semantic vocabulary so primitives never learn swarm concepts.
// 3. Expects: TopologyTrustState values from the BFF topology DTO.
// 4. Provides: trustToStatus() returning the primitive's Status union.

import type { TopologyTrustState } from '$lib/server/index.js';
import type { Status } from '$lib/components/ui/index.js';

export function trustToStatus(state: TopologyTrustState): Status {
  switch (state) {
    case 'trusted':
      return 'live';
    case 'pending':
      return 'warn';
    case 'rejected':
      return 'idle';
  }
}