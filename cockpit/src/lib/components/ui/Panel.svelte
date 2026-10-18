<!--
1. Relative path: cockpit/src/lib/components/ui/Panel.svelte
2. Description: Padded cockpit panel primitive for sections and telemetry groups.
3. Expects: Optional index/title, density variant, children snippet.
4. Provides: Token-driven padding, surface, border, and section heading. Overrides --field-bg for child inputs to create an inset well effect.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    index?: string;
    title?: string;
    density?: 'default' | 'compact' | 'spacious';
    children: Snippet;
  };

  let {
    index,
    title,
    density = 'default',
    children
  }: Props = $props();

  const densityClass = $derived(
    density === 'compact' ? 'p-3 gap-2' : 
    density === 'spacious' ? 'p-8 gap-6' : 
    'p-5 gap-4'
  );
</script>

<section 
  class="flex flex-col rounded-md border border-border bg-surface {densityClass}"
  /* CHAMELEON OVERRIDE: When inside a medium surface (Panel), the field drops to the darkest shade (--bg) for an inset well effect. */
  style="--field-bg: var(--bg);"
>
  {#if title}
    <h2 class="border-b border-border pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-text-2">
      {#if index}<span class="text-accent">{index}</span> · {/if}
      {title}
    </h2>
  {/if}

  {@render children()}
</section>