<!--
1. Relative path: site/src/lib/components/ui/Tabs.svelte
2. Description: WAI-ARIA compliant tabs primitive with snippet-based content, keyboard navigation, and a clean divider-only aesthetic.
3. Expects: Svelte 5 runes, strict TypeScript, $bindable selected value.
4. Provides: Accessible, composable tab interface with left/right arrow key support, strict focus management, and mobile-safe horizontal scrolling.
-->
<script lang="ts">
  type Tab = { id: string; label: string };

  let {
    tabs,
    selected = $bindable(tabs[0].id),
    children
  }: {
    tabs: readonly Tab[];
    selected?: string;
    children?: import('svelte').Snippet<[string]>;
  } = $props();

  function handleKeydown(e: KeyboardEvent, currentIndex: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selected = tabs[(currentIndex + 1) % tabs.length].id;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selected = tabs[(currentIndex - 1 + tabs.length) % tabs.length].id;
    }
  }

  const getTabClass = (isSelected: boolean) => 
    `shrink-0 whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
      isSelected 
        ? 'text-(--color-lime) border-(--color-lime)' 
        : 'text-(--text-muted) border-transparent hover:text-(--text) hover:border-(--border)'
    }`;
</script>

<div class="w-full">
  <div role="tablist" class="flex flex-nowrap overflow-x-auto scrollbar-hide border-b border-(--border) mb-6" aria-label="Tab selection">
    {#each tabs as tab, i}
      <button
        role="tab"
        aria-selected={selected === tab.id}
        aria-controls={`panel-${tab.id}`}
        id={`tab-${tab.id}`}
        tabindex={selected === tab.id ? 0 : -1}
        class={getTabClass(selected === tab.id)}
        onclick={() => selected = tab.id}
        onkeydown={(e) => handleKeydown(e, i)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  
  {#if children}
    <div role="tabpanel" aria-labelledby={`tab-${selected}`} id={`panel-${selected}`} class="focus:outline-none">
      {@render children(selected)}
    </div>
  {/if}
</div>