<!--
1. Relative path: cockpit/src/lib/components/ui/PageShell.svelte
2. Description: Root page layout primitive providing token-driven page padding and frame.
3. Expects: A children snippet and optional extra class.
4. Provides: A non-glued, token-respecting page shell for feature routes.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    children,
    class: className
  }: {
    children: Snippet;
    class?: string;
  } = $props();
</script>

<div class="min-h-screen px-6 py-10 {className ?? ''}">
  <div class="mx-auto flex w-full max-w-360 flex-col gap-6">
    {@render children()}
  </div>
</div>