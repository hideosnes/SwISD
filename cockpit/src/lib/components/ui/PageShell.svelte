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

<!-- 
  CRITICAL FIX: 
  1. Changed min-h-screen to min-h-full. min-h-screen inside an overflow-auto container 
     causes layout collapse and scrollbar conflicts.
  2. Added responsive padding so it doesn't look glued on smaller screens.
-->
<div class="min-h-full px-2 py-6 lg:px-6 lg:py-10 {className ?? ''}">
  <div class="mx-auto flex w-full max-w-360 flex-col gap-6">
    {@render children()}
  </div>
</div>