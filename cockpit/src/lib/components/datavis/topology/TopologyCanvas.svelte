<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/TopologyCanvas.svelte
2. Description: The main SVG container for the swarm topology map. Handles responsive sizing, computes the deterministic orbital layout, and renders the conductor, rings, and peer nodes.
3. Expects: A SwarmTopologyDTO from the BFF API.
4. Provides: A fully interactive, accessible SVG topology canvas.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwarmTopologyDTO } from '$lib/server/index.js';
  import { computeOrbitalLayout, defaultOrbitalConfig, type OrbitalLayoutResult } from '../index.js';
  
  import TrustRing from './TrustRing.svelte';
  import SwarmNode from './SwarmNode.svelte';
  import GhostNode from './GhostNode.svelte';

  let { 
    topology,
    onPeerClick
  }: { 
    topology: SwarmTopologyDTO;
    onPeerClick?: (peerId: string) => void;
  } = $props();

  let svgElement: SVGSVGElement | undefined = $state();
  let dimensions = $state({ width: 800, height: 600 });
  
  let layout: OrbitalLayoutResult | null = $derived.by(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return null;
    const config = defaultOrbitalConfig(dimensions.width, dimensions.height);
    return computeOrbitalLayout(topology, config);
  });

  onMount(() => {
    if (!svgElement) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        dimensions = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        };
      }
    });
    
    observer.observe(svgElement);
    
    return () => observer.disconnect();
  });

  function handleNodeClick(peerId: string) {
    onPeerClick?.(peerId);
  }
  
  function handleNodeKeydown(e: KeyboardEvent, peerId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNodeClick(peerId);
    }
  }
</script>

<svg 
  bind:this={svgElement}
  class="topology-canvas"
  viewBox="0 0 {dimensions.width} {dimensions.height}"
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label="Swarm topology map showing {topology.swarmSize} trusted peers and {topology.ghostCount} pending peers."
>
  {#if layout}
    <!-- Orbital Rings -->
    {#each layout.rings as ring (ring.kind)}
      <TrustRing {ring} />
    {/each}

    <!-- Conductor Center Node -->
    <g transform="translate({layout.center.x}, {layout.center.y})" class="topology-conductor">
      <circle r={layout.conductorRadius} class="topology-conductor__body" />
      <text class="topology-conductor__label" text-anchor="middle" dominant-baseline="central">C</text>
    </g>

    <!-- Peer Nodes -->
    {#each layout.peers as laidOut (laidOut.peer.peerId)}
      {#if laidOut.ring === 'trust'}
        <SwarmNode 
          peer={laidOut} 
          onclick={() => handleNodeClick(laidOut.peer.peerId)}
          onkeydown={(e) => handleNodeKeydown(e, laidOut.peer.peerId)}
        />
      {:else if laidOut.ring === 'limbo'}
        <GhostNode 
          peer={laidOut} 
          onclick={() => handleNodeClick(laidOut.peer.peerId)}
          onkeydown={(e) => handleNodeKeydown(e, laidOut.peer.peerId)}
        />
      {/if}
    {/each}
  {/if}
</svg>

<style>
  @layer components {
    .topology-canvas {
      width: 100%;
      height: 100%;
      display: block;
      background-color: var(--bg);
    }
    .topology-conductor {
      pointer-events: none;
    }
    .topology-conductor__body {
      fill: var(--accent);
      stroke: var(--bg);
      stroke-width: 2px;
    }
    .topology-conductor__label {
      fill: var(--bg);
      font-size: 16px;
      font-weight: bold;
      font-family: var(--font-mono, monospace);
    }
  }
</style>