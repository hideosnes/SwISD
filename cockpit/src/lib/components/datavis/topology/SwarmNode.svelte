<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/SwarmNode.svelte
2. Description: Renders a trusted swarm peer as an interactive SVG node.
3. Expects: A LaidOutPeer model with position, radius, and peer DTO.
4. Provides: A clickable, accessible SVG group representing a trusted peer.
-->
<script lang="ts">
  import type { LaidOutPeer } from '../types.js';

  let { 
    peer, 
    onclick,
    onkeydown
  }: { 
    peer: LaidOutPeer; 
    onclick?: (e: MouseEvent) => void;
    onkeydown?: (e: KeyboardEvent) => void;
  } = $props();

  const label = $derived(`Peer ${peer.peer.peerId.slice(0, 8)} - Load: ${peer.peer.loadScore ?? 'Unknown'}`);
</script>

<g
  transform="translate({peer.position.x}, {peer.position.y})"
  class="topology-node"
  role="button"
  tabindex="0"
  aria-label={label}
  {onclick}
  {onkeydown}
>
  <!-- Outer capability ring (placeholder for future bezel) -->
  <circle r={peer.nodeRadius + 4} class="topology-node__bezel" />
  
  <!-- Main node body -->
  <circle r={peer.nodeRadius} class="topology-node__body" />
  
  <!-- Load indicator (inner dot for backpressure) -->
  {#if peer.peer.loadScore !== null && peer.peer.loadScore > 0.8}
    <circle r={peer.nodeRadius * 0.3} class="topology-node__stress" />
  {/if}
</g>

<style>
  @layer components {
    .topology-node {
      cursor: pointer;
      outline: none;
    }
    .topology-node:focus-visible .topology-node__bezel {
      stroke: var(--focus-ring, var(--accent));
      stroke-width: 2px;
    }
    .topology-node__bezel {
      fill: none;
      stroke: var(--accent);
      stroke-width: 1.5px;
      opacity: 0.5;
      transition: stroke 0.2s ease, opacity 0.2s ease;
    }
    .topology-node:hover .topology-node__bezel {
      opacity: 1;
    }
    .topology-node__body {
      fill: var(--surface);
      stroke: var(--accent);
      stroke-width: 1px;
      transition: fill 0.2s ease;
    }
    .topology-node:hover .topology-node__body {
      fill: var(--surface);
      filter: brightness(1.2);
    }
    .topology-node__stress {
      fill: var(--danger, #ef4444);
    }
  }
</style>