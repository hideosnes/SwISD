<!--
1. Relative path: cockpit/src/lib/components/ui/Panel.svelte
2. Description: Padded cockpit panel primitive for sections and telemetry groups.
3. Expects: Optional index/title, children snippet, and optional class.
4. Provides: Token-driven padding, surface, border, and section heading.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    index,
    title,
    children,
    class: className
  }: {
    index?: string;
    title?: string;
    children: Snippet;
    class?: string;
  } = $props();
</script>

<section class="flex flex-col gap-4 rounded-md border border-border bg-surface p-5 {className ?? ''}">
  {#if title}
    <h2 class="border-b border-border pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-text-2">
      {#if index}<span class="text-accent">{index}</span> · {/if}
      {title}
    </h2>
  {/if}

  {@render children()}
</section>