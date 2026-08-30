<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/GhostNode.svelte
2. Description: Renders a pending (ghost) swarm peer in the limbo orbit as an interactive SVG node.
3. Expects: A LaidOutPeer model with position, radius, and peer DTO.
4. Provides: A clickable, accessible SVG group representing a peer awaiting trust approval.
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

  const label = $derived(`Pending Peer ${peer.peer.peerId.slice(0, 8)} - Awaiting Trust`);
</script>

<g
  transform="translate({peer.position.x}, {peer.position.y})"
  class="topology-ghost"
  role="button"
  tabindex="0"
  aria-label={label}
  {onclick}
  {onkeydown}
>
  <circle r={peer.nodeRadius} class="topology-ghost__body" />
  <text class="topology-ghost__icon" text-anchor="middle" dominant-baseline="central">?</text>
</g>

<style>
  @layer components {
    .topology-ghost {
      cursor: pointer;
      outline: none;
    }
    .topology-ghost:focus-visible .topology-ghost__body {
      stroke: var(--focus-ring, var(--accent));
      stroke-width: 2px;
    }
    .topology-ghost__body {
      fill: transparent;
      stroke: var(--text-muted, var(--text));
      stroke-width: 1.5px;
      stroke-dasharray: 3 3;
      transition: stroke 0.2s ease;
    }
    .topology-ghost:hover .topology-ghost__body {
      stroke: var(--accent);
    }
    .topology-ghost__icon {
      fill: var(--text-muted, var(--text));
      font-size: 12px;
      font-family: var(--font-mono, monospace);
      pointer-events: none;
      transition: fill 0.2s ease;
    }
    .topology-ghost:hover .topology-ghost__icon {
      fill: var(--accent);
    }
  }
</style>