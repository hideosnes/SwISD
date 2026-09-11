<!--
1. Relative path: site/src/lib/components/ui/Arrow.svelte
2. Description: Directional arrow icon for link affordance.
3. Expects: A direction prop ('up' | 'down' | 'right' | 'external').
4. Provides: Consistent, animated arrow semantics for in-page, page-to-page, and external navigation.
-->
<script lang="ts">
  let { direction }: { direction: 'up' | 'down' | 'right' | 'external' } = $props();
</script>

<svg class="arrow arrow-{direction}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if direction === 'down'}
    <path d="M6 9l6 6 6-6" />
  {:else if direction === 'up'}
    <path d="M18 15l-6-6-6 6" />
  {:else if direction === 'right'}
    <path d="M9 18l6-6-6-6" />
  {:else if direction === 'external'}
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14L21 3" />
  {/if}
</svg>

<style>
  .arrow {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: -0.125em;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(a:hover) .arrow-down,
  :global(button:hover) .arrow-down { transform: translateY(3px); }

  :global(a:hover) .arrow-up,
  :global(button:hover) .arrow-up { transform: translateY(-3px); }

  :global(a:hover) .arrow-right,
  :global(button:hover) .arrow-right { transform: translateX(3px); }

  :global(a:hover) .arrow-external,
  :global(button:hover) .arrow-external { transform: translate(2px, -2px); }
</style>