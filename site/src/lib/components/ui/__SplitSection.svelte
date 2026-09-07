<!--
1. Relative path: site/src/lib/components/ui/SplitSection.svelte
2. Description: Dual-audience split section; native horizontal carousel on mobile with bindable side.
3. Expects: Section id, half color classes, bindable side state, and left/right snippets.
4. Provides: Desktop 50/50 grid, mobile snap carousel, and global side synchronization.
-->
<script lang="ts">
  import { browser } from '$app/environment';
  import type { Snippet } from 'svelte';

  export type SplitSide = 'left' | 'right';

  let {
    id,
    leftClass = '',
    rightClass = '',
    side = $bindable('left'),
    left,
    right
  }: {
    id: string;
    leftClass?: string;
    rightClass?: string;
    side?: SplitSide;
    left: Snippet;
    right: Snippet;
  } = $props();

  let container: HTMLDivElement | undefined = $state();
  let first = true;

  function apply(smooth: boolean) {
    if (!browser || !container) return;
    container.scrollTo({
      left: side === 'right' ? container.clientWidth : 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  // React to side changes (audience toggle or swipe in another section)
  $effect(() => {
    void side;
    if (first) {
      first = false;
      apply(false);
    } else {
      apply(true);
    }
  });

  // Report mobile swipes back to the bound side so all carousels stay in sync
  function handleScroll() {
    if (!container) return;
    const next: SplitSide = container.scrollLeft > container.clientWidth / 2 ? 'right' : 'left';
    if (next !== side) side = next;
  }
</script>

<section id={id} class="snap-section relative">
  <div class="split" bind:this={container} onscroll={handleScroll}>
    <div class="half {leftClass}">
      {@render left()}
    </div>
    <div class="half {rightClass}">
      {@render right()}
    </div>
  </div>
  <p class="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 text-xs opacity-60 select-none" aria-hidden="true">
    ‹ swipe ›
  </p>
</section>