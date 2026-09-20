<!--
1. Relative path: site/src/lib/components/datavis/OrbitExplainer.svelte
2. Description: Interactive orbital swarm explainer. Header + nav tabs + rundown on the left, vertically-centered orbit on the right.
3. Expects: A readonly Rundown dataset, an optional header snippet, CSS tokens from layout.css, and the ui Tabs primitive.
4. Provides: Deterministic SVG orbit map (asymmetric green neighborhood ring, blue outer swarm, lone ghost) with keyboard-accessible actors and a live rundown.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from '$lib/components/ui';
  import type { Rundown, OrbitActorId } from './types';
  import { computeOrbitLayout, ORBIT_VIEWBOX } from './layout';

  let {
    rundowns,
    header
  }: {
    rundowns: readonly Rundown[];
    header?: Snippet;
  } = $props();

  let selected = $state<OrbitActorId>('conductor');

  const orbit = computeOrbitLayout();

  // Static edge geometry derived once from the deterministic layout.
  const siblings = orbit.greenRing.filter((p) => p.role === 'sibling');

  const spokeEdges = orbit.greenRing.map((pip) => ({
    x1: orbit.conductor.x,
    y1: orbit.conductor.y,
    x2: pip.point.x,
    y2: pip.point.y
  }));

  const bridgeEdges = orbit.diplomatBlueTargets.map((bi) => ({
    x1: orbit.diplomat.x,
    y1: orbit.diplomat.y,
    x2: orbit.blueRing[bi].x,
    y2: orbit.blueRing[bi].y
  }));

  const active = $derived(rundowns.find((r) => r.actorId === selected));
  
  // Map rundowns to the strict { id, label } shape required by the Tabs primitive
  const navTabs = $derived(
    rundowns.flatMap((r) => (r.chipLabel ? [{ id: r.actorId, label: r.chipLabel }] : []))
  );

  function handleKeydown(event: KeyboardEvent, id: OrbitActorId): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selected = id;
    }
  }
</script>

<div class="orbit-explainer">
  <div class="orbit-info">
    {#if header}
      <div class="orbit-header">
        {@render header()}
      </div>
    {/if}

    <div class="orbit-tabs">
      <Tabs tabs={navTabs} bind:selected>
        {#snippet children(id)}
          <div class="rundown" aria-live="polite">
            {#key id}
              <div class="rundown-inner">
                {#if active && active.actorId === id}
                  <p class="rundown-body">{active.text}</p>
                {/if}
              </div>
            {/key}
          </div>
        {/snippet}
      </Tabs>
    </div>
  </div>

  <div class="orbit-canvas">
    <svg
      viewBox="0 0 {ORBIT_VIEWBOX} {ORBIT_VIEWBOX}"
      role="group"
      aria-label="Interactive swarm architecture orbit diagram. Select a node to explore how the swarm works."
    >
      <!-- Orbital rings -->
      <g class="decor" aria-hidden="true">
        <circle class="ring ring-green" cx={orbit.conductor.x} cy={orbit.conductor.y} r={orbit.radii.green} />
        <circle class="ring ring-blue" cx={orbit.conductor.x} cy={orbit.conductor.y} r={orbit.radii.blue} />
        <circle class="ring ring-limbo" cx={orbit.conductor.x} cy={orbit.conductor.y} r={orbit.radii.limbo} />
      </g>

      <!-- Conductor spokes: chunk flow radiating to the green neighborhood ring -->
      <g class="decor" aria-hidden="true">
        {#each spokeEdges as e, i (i)}
          <line class="spoke" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
        {/each}
      </g>

      <!-- Diplomat bridges: the sole link out to the blue outer swarm -->
      <g class="decor" aria-hidden="true">
        {#each bridgeEdges as e, i (i)}
          <line class="bridge" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
        {/each}
      </g>

      <!-- Blue pips: the neighboring swarm on the second ring -->
      <g class="decor" aria-hidden="true">
        {#each orbit.blueRing as b, i (i)}
          <circle class="blue-pip" cx={b.x} cy={b.y} r="9" />
        {/each}
      </g>

      <!-- Green siblings: decorative members of the neighborhood ring -->
      <g class="decor" aria-hidden="true">
        {#each siblings as s, i (i)}
          <circle class="green-sibling" cx={s.point.x} cy={s.point.y} r="10" />
        {/each}
      </g>

      <!-- CONDUCTOR -->
      <g
        class="actor"
        class:selected={selected === 'conductor'}
        role="button"
        tabindex="0"
        aria-label="The Conductor: workload execution. Blind ingress, targeted egress."
        aria-pressed={selected === 'conductor'}
        onclick={() => selected = 'conductor'}
        onkeydown={(e) => handleKeydown(e, 'conductor')}
      >
        <circle class="focus-ring" cx={orbit.conductor.x} cy={orbit.conductor.y} r="44" />
        <circle class="select-ring" cx={orbit.conductor.x} cy={orbit.conductor.y} r="38" />
        <circle class="conductor-glow" cx={orbit.conductor.x} cy={orbit.conductor.y} r="52" />
        <circle class="node node-conductor" cx={orbit.conductor.x} cy={orbit.conductor.y} r="30" />
        <text class="actor-label" x={orbit.conductor.x} y={orbit.conductor.y + 68} text-anchor="middle" aria-hidden="true">Conductor</text>
      </g>

      <!-- WORKER -->
      <g
        class="actor"
        class:selected={selected === 'worker'}
        role="button"
        tabindex="0"
        aria-label="The Worker: task mediation. A stateless peer advertising capabilities."
        aria-pressed={selected === 'worker'}
        onclick={() => selected = 'worker'}
        onkeydown={(e) => handleKeydown(e, 'worker')}
      >
        <circle class="focus-ring" cx={orbit.worker.x} cy={orbit.worker.y} r="27" />
        <circle class="select-ring" cx={orbit.worker.x} cy={orbit.worker.y} r="23" />
        <circle class="node node-green" cx={orbit.worker.x} cy={orbit.worker.y} r="16" />
        <text class="actor-label" x={orbit.worker.x} y={orbit.worker.y - 28} text-anchor="middle" aria-hidden="true">Worker</text>
      </g>

      <!-- DIPLOMAT -->
      <g
        class="actor"
        class:selected={selected === 'diplomat'}
        role="button"
        tabindex="0"
        aria-label="The Diplomat: deep networking. The green bridge to the blue outer swarm."
        aria-pressed={selected === 'diplomat'}
        onclick={() => selected = 'diplomat'}
        onkeydown={(e) => handleKeydown(e, 'diplomat')}
      >
        <circle class="focus-ring" cx={orbit.diplomat.x} cy={orbit.diplomat.y} r="27" />
        <circle class="select-ring" cx={orbit.diplomat.x} cy={orbit.diplomat.y} r="23" />
        <circle class="node node-green" cx={orbit.diplomat.x} cy={orbit.diplomat.y} r="16" />
        <text class="actor-label" x={orbit.diplomat.x} y={orbit.diplomat.y + 38} text-anchor="middle" aria-hidden="true">Diplomat</text>
      </g>

      <!-- GHOST -->
      <g
        class="actor"
        class:selected={selected === 'ghost'}
        role="button"
        tabindex="0"
        aria-label="The Ghost: trust boundary. A pending peer awaiting operator trust."
        aria-pressed={selected === 'ghost'}
        onclick={() => selected = 'ghost'}
        onkeydown={(e) => handleKeydown(e, 'ghost')}
      >
        <circle class="focus-ring focus-ring-purple" cx={orbit.ghost.x} cy={orbit.ghost.y} r="25" />
        <circle class="select-ring select-ring-purple" cx={orbit.ghost.x} cy={orbit.ghost.y} r="21" />
        <circle class="node node-ghost" cx={orbit.ghost.x} cy={orbit.ghost.y} r="14" />
        <text class="actor-label" x={orbit.ghost.x} y={orbit.ghost.y + 36} text-anchor="middle" aria-hidden="true">Ghost · Pending</text>
      </g>
    </svg>
  </div>
</div>

<style>
  .orbit-explainer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 3rem;
    align-items: center;
    overflow: hidden;
  }

  .orbit-info {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    align-self: start;
    min-width: 0;
  }

  .orbit-header { display: block; }

  .rundown { max-width: 640px; }

  .rundown-body {
    color: var(--color-gray-400);
    font-size: 1rem;
    line-height: 1.7;
  }

  .orbit-canvas {
    width: 100%;
    max-width: 560px;
    justify-self: center;
    min-width: 0;
  }

  .orbit-canvas svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .decor { pointer-events: none; }

  .ring { fill: none; }
  .ring-green { stroke: var(--color-lime); opacity: 0.14; stroke-width: 1; }
  .ring-blue { stroke: var(--color-purple); opacity: 0.16; stroke-width: 1; }
  .ring-limbo { stroke: var(--color-purple); opacity: 0.18; stroke-dasharray: 3 8; stroke-width: 1.5; }

  .spoke { stroke: var(--color-lime); opacity: 0.3; stroke-width: 1.5; stroke-dasharray: 3 7; }
  .bridge { stroke: var(--color-purple); opacity: 0.5; stroke-width: 1.5; stroke-dasharray: 4 6; }

  .blue-pip { fill: var(--color-purple); opacity: 0.55; }
  .green-sibling { fill: var(--color-lime); opacity: 0.4; }

  .node-conductor { fill: var(--color-lime); }
  .node-green { fill: var(--color-lime); opacity: 0.95; }
  .node-ghost { fill: none; stroke: var(--color-purple); stroke-dasharray: 4 4; stroke-width: 2; opacity: 0.85; }
  .conductor-glow { fill: var(--color-lime-glow); }

  .actor { cursor: pointer; }
  .actor:focus { outline: none; }

  .focus-ring { fill: none; stroke: var(--color-lime); stroke-width: 2; opacity: 0; }
  .focus-ring-purple { stroke: var(--color-purple); }
  .actor:focus-visible .focus-ring { opacity: 0.9; }

  .select-ring { fill: none; stroke: var(--color-lime); stroke-width: 1.5; opacity: 0; }
  .select-ring-purple { stroke: var(--color-purple); }
  .actor.selected .select-ring { opacity: 0.55; }

  .actor-label {
    fill: var(--color-gray-500);
    font-family: var(--font-mono);
    font-size: 18px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    pointer-events: none;
  }

  @keyframes dashflow { to { stroke-dashoffset: -40; } }
  @keyframes breathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.55; } }
  @keyframes rundownIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  @media (prefers-reduced-motion: no-preference) {
    .spoke { animation: dashflow 2.6s linear infinite; }
    .conductor-glow { animation: breathe 4s ease-in-out infinite; }
    .rundown-inner { animation: rundownIn 0.3s ease; }
  }

  @media (max-width: 900px) {
    .orbit-explainer { grid-template-columns: 1fr; gap: 2.5rem; }
    .orbit-canvas { max-width: 480px; }
  }
</style>