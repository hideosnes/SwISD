<!--
1. Relative path: site/src/lib/components/ui/RoadmapTimeline.svelte
2. Description: Vertical timeline primitive with a continuous central spine and alternating leaves.
3. Expects: A readonly list of RoadmapEntry objects and an onSelect callback.
4. Provides: Centered timeline; lime spine-fill propagating up through completed work into the current node; date-over-title leaves; modal-triggering circles and leaves.
-->
<script lang="ts">
  import type { RoadmapEntry } from '$lib/content/roadmap';

  let {
    entries,
    onSelect
  }: {
    entries: readonly RoadmapEntry[];
    onSelect: (entry: RoadmapEntry) => void;
  } = $props();

  // Data is oldest-first; display is newest-at-top.
  const displayEntries = $derived([...entries].reverse());

  function isCircleLime(entry: RoadmapEntry): boolean {
    return entry.status === 'done' || entry.status === 'current';
  }
</script>

<ol class="roadmap-timeline" aria-label="Project roadmap">
  {#each displayEntries as entry (entry.id)}
    <li class="timeline-item" data-side={entry.type === 'milestone' ? 'left' : 'right'}>
      <div
        class="timeline-segment"
        class:lime={entry.status === 'done' || entry.status === 'current'}
        class:half={entry.status === 'current'}
        aria-hidden="true"
      ></div>
      <button
        type="button"
        class="timeline-circle"
        class:lime={isCircleLime(entry)}
        class:current={entry.status === 'current'}
        aria-label={`View details for ${entry.title}`}
        onclick={() => onSelect(entry)}
      >
        {#if entry.status === 'current'}
          <span class="circle-pulse" aria-hidden="true"></span>
        {/if}
      </button>
      <button
        type="button"
        class="timeline-leaf"
        aria-label={`View details for ${entry.title}`}
        onclick={() => onSelect(entry)}
      >
        <span class="leaf-time">{entry.time}</span>
        <span class="leaf-title">{entry.title}</span>
      </button>
    </li>
  {/each}
</ol>