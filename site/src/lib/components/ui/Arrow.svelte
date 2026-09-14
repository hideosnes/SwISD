<!--
1. Relative path: site/src/lib/components/ui/Arrow.svelte
2. Description: Directional SVG arrow primitive for UI navigation and indicators.
3. Expects: A strictly typed direction and an optional class string for styling.
4. Provides: A consistent, accessible SVG arrow that obeys the Single-Source Doctrine.
-->
<script lang="ts">
  let {
    direction,
    class: className = ''
  }: {
    direction: 'up' | 'down' | 'left' | 'right' | 'external';
    class?: string;
  } = $props();
</script>

<svg
  class={className}
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if direction === 'up'}
    <path d="M12 19V5M5 12l7-7 7 7" />
  {:else if direction === 'down'}
    <path d="M12 5v14M5 12l7 7 7-7" />
  {:else if direction === 'left'}
    <path d="M19 12H5M12 19l-7-7 7-7" />
  {:else if direction === 'right'}
    <path d="M5 12h14M12 5l7 7-7 7" />
  {:else if direction === 'external'}
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
  {/if}
</svg>