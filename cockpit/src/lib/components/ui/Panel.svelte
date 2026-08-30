<!--
1. Relative path: cockpit/src/lib/components/ui/Panel.svelte
2. Description: Padded cockpit panel primitive for sections and telemetry groups.
3. Expects: Optional index/title, density variant, children snippet.
4. Provides: Token-driven padding, surface, border, and section heading.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    index?: string;
    title?: string;
    density?: 'default' | 'compact' | 'spacious';
    children: Snippet;
    // We DO NOT accept a raw `class` prop to override core layout.
  };

  let {
    index,
    title,
    density = 'default',
    children
  }: Props = $props();

  // Map semantic props to token-bound classes. No magic numbers.
  const densityClass = $derived(
    density === 'compact' ? 'p-3 gap-2' : 
    density === 'spacious' ? 'p-8 gap-6' : 
    'p-5 gap-4'
  );
</script>

<section class="flex flex-col rounded-md border border-border bg-surface {densityClass}">
  {#if title}
    <h2 class="border-b border-border pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-text-2">
      {#if index}<span class="text-accent">{index}</span> · {/if}
      {title}
    </h2>
  {/if}

  {@render children()}
</section>