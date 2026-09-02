<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/TrustRing.svelte
2. Description: Renders a single orbital ring (trust or limbo) as an SVG circle.
3. Expects: An OrbitalRingModel containing center coordinates, radius, and kind.
4. Provides: A themed, accessible SVG circle primitive for the topology canvas.
-->
<script lang="ts">
  import type { OrbitalRingModel } from '../types.js';

  let { ring }: { ring: OrbitalRingModel } = $props();
</script>

<circle
  cx={ring.center.x}
  cy={ring.center.y}
  r={ring.radius}
  class="topology-ring"
  class:topology-ring--trust={ring.kind === 'trust'}
  class:topology-ring--limbo={ring.kind === 'limbo'}
  aria-hidden="true"
/>

<style>
  @layer components {
    .topology-ring {
      fill: none;
      stroke-width: 1px;
      stroke: var(--text-muted);
      opacity: 0.4;
      transition: stroke 0.3s ease;
    }
    .topology-ring--trust {
      stroke: var(--accent);
      opacity: 0.6;
    }
    .topology-ring--limbo {
      stroke: var(--text-muted);
      stroke-dasharray: 4 4;
      opacity: 0.5;
    }
  }
</style>