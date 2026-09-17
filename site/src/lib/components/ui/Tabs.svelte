<!--
1. Relative path: site/src/lib/components/ui/Tabs.svelte
2. Description: WAI-ARIA compliant tabs primitive with snippet-based content and keyboard navigation.
3. Expects: Svelte 5 runes, strict TypeScript, $bindable selected value.
4. Provides: Accessible, composable tab interface with left/right arrow key support and strict focus management.
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
</script>

<div class="w-full">
  <div role="tablist" class="flex border-b border-(--border) mb-6" aria-label="Tab selection">
    {#each tabs as tab, i}
      <button
        role="tab"
        aria-selected={selected === tab.id}
        aria-controls={`panel-${tab.id}`}
        id={`tab-${tab.id}`}
        tabindex={selected === tab.id ? 0 : -1}
        class="px-4 py-3 font-mono text-sm font-semibold border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-lime) focus:ring-offset-2 focus:ring-offset-(--bg)"
        class:border-(--color-lime)={selected === tab.id}
        class:text-(--color-lime)={selected === tab.id}
        class:border-transparent={selected !== tab.id}
        class:text-(--text-muted)={selected !== tab.id}
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