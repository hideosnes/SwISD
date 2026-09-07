<!--
1. Relative path: site/src/lib/components/ui/TopNav.svelte
2. Description: Sticky menu bar; lives at the hero hem, docks magnetically to the top on scroll.
3. Expects: Sections array, activeIndex, and an optional onNavigate callback for engine-driven jumps.
4. Provides: Glassmorphic adaptive bar with mock links and an accessible mobile menu.
-->
<script lang="ts">
  import type { Section } from './CircleNav.svelte';

  let {
    activeIndex,
    sections,
    onNavigate
  }: {
    activeIndex: number;
    sections: Section[];
    onNavigate?: (id: string) => void;
  } = $props();

  let mobileMenuOpen = $state(false);

  const mockLinks = ['Docs', 'Use Cases', 'GitHub', 'Contact'];

  let navColors = $derived.by(() => {
    const variant = sections[activeIndex]?.variant ?? 'purple';
    return {
      bg: variant === 'lime' ? 'color-mix(in srgb, var(--color-lime) 88%, transparent)' : 'color-mix(in srgb, var(--color-purple) 88%, transparent)',
      fg: variant === 'lime' ? 'var(--color-purple)' : 'var(--color-lime)'
    };
  });

  function handleBrand(event: Event) {
    if (onNavigate) {
      event.preventDefault();
      onNavigate('hero');
    }
  }
</script>

<header class="topnav" style="background: {navColors.bg}; color: {navColors.fg};">
  <div class="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
    <a href="#hero" onclick={handleBrand} class="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
      SwISD
    </a>

    <nav class="hidden md:flex gap-8" aria-label="Main navigation">
      {#each mockLinks as link}
        <a href="#" class="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:underline">
          {link}
        </a>
      {/each}
    </nav>

    <button
      type="button"
      class="md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-current"
      onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
      aria-label="Toggle mobile menu"
      aria-expanded={mobileMenuOpen}
    >
      {#if mobileMenuOpen}
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      {:else}
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      {/if}
    </button>
  </div>

  {#if mobileMenuOpen}
    <nav class="md:hidden border-t border-current/20" style="background: {navColors.bg};" aria-label="Mobile navigation">
      <div class="px-6 py-4 flex flex-col gap-4">
        {#each mockLinks as link}
          <a href="#" class="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">
            {link}
          </a>
        {/each}
      </div>
    </nav>
  {/if}
</header>