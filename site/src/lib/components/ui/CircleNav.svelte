<!--
1. Relative path: site/src/lib/components/ui/CircleNav.svelte
2. Description: Fixed right-side dot navigation; purely presentational and color-adaptive.
3. Expects: Sections array, activeIndex, and an onNavigate callback.
4. Provides: One-tap section jumps with variant-contrasting dot colors.
-->
<script lang="ts">
  export type SectionVariant = 'lime' | 'purple';
  export type Section = {
    id: string;
    label: string;
    variant: SectionVariant;
  };

  let {
    sections,
    activeIndex,
    onNavigate
  }: {
    sections: Section[];
    activeIndex: number;
    onNavigate: (index: number) => void;
  } = $props();

  let navColors = $derived.by(() => {
    const variant = sections[activeIndex]?.variant ?? 'purple';
    return {
      dotBorder: variant === 'lime' ? 'var(--color-purple)' : 'var(--color-lime)',
      dotBg: variant === 'lime' ? 'var(--color-purple)' : 'var(--color-lime)'
    };
  });
</script>

<nav class="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3" aria-label="Section navigation">
  {#each sections as section, i}
    <button
      type="button"
      class="w-3 h-3 rounded-full border-2 transition-all duration-300 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
      style="border-color: {navColors.dotBorder}; background-color: {activeIndex === i ? navColors.dotBg : 'transparent'};"
      onclick={() => onNavigate(i)}
      aria-label={`Go to {section.label} section`}
      aria-current={activeIndex === i ? 'true' : 'false'}
    >
    </button>
  {/each}
</nav>