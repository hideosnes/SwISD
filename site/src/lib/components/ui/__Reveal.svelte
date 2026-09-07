<!--
1. Relative path: site/src/lib/components/ui/Reveal.svelte
2. Description: Scroll-reveal primitive with per-breakpoint variants and child stagger control.
3. Expects: Variant props, delay/stagger timings, and a children snippet.
4. Provides: IntersectionObserver-driven entrance choreography honoring reduced-motion.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type { Snippet } from 'svelte';

  export type RevealVariant = 'up' | 'fade' | 'left' | 'right' | 'none';

  const FROM: Record<RevealVariant, string> = {
    up: 'translateY(2.5rem)',
    fade: 'none',
    left: 'translateX(-2.5rem)',
    right: 'translateX(2.5rem)',
    none: 'none'
  };

  let {
    variant = 'up',
    mobileVariant,
    delay = 0,
    stagger = 0,
    threshold = 0.35,
    children
  }: {
    variant?: RevealVariant;
    mobileVariant?: RevealVariant;
    delay?: number;
    stagger?: number;
    threshold?: number;
    children: Snippet;
  } = $props();

  let el: HTMLDivElement | undefined = $state();
  let inview = $state(false);
  let observer: IntersectionObserver | null = null;

  onMount(() => {
    if (!browser || !el) {
      inview = true;
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inview = true;
            observer?.disconnect();
          }
        }
      },
      { threshold }
    );
    observer.observe(el);
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  let fromDesktop = $derived(FROM[variant]);
  let fromMobile = $derived(FROM[mobileVariant ?? variant]);
</script>

<div
  bind:this={el}
  data-reveal
  data-rv-desktop={variant}
  data-rv-mobile={mobileVariant ?? variant}
  class:rv-inview={inview}
  style="--rv-from-desktop: {fromDesktop}; --rv-from-mobile: {fromMobile}; --rv-delay: {delay}ms; --rv-stagger: {stagger}ms;"
>
  {@render children()}
</div>