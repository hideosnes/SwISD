<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/ModalityLegend.svelte
2. Description: Dynamic legend showing colored dots and modality codes for all available modalities.
3. Expects: An array of modality codes present in the current topology.
4. Provides: A compact, themed legend rendered at the bottom of the topology canvas.
-->
<script lang="ts">
  import type { ModalityCode } from '../types.js';
  import { modalityToColor } from './layout.js';

  let { modalities }: { modalities: ReadonlyArray<ModalityCode> } = $props();

  const uniqueModalities = $derived([...new Set(modalities)].sort());
</script>

<div class="modality-legend" role="region" aria-label="Modality legend">
  {#each uniqueModalities as modality}
    <div class="modality-legend__item">
      <span class="modality-legend__dot" style="background-color: {modalityToColor(modality)}"></span>
      <span class="modality-legend__code">{modality}</span>
    </div>
  {/each}
</div>

<style>
  @layer components {
    .modality-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.5rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
    }
    .modality-legend__item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .modality-legend__dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .modality-legend__code {
      color: var(--text-muted);
    }
  }
</style>