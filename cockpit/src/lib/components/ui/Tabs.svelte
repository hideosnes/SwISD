<!--
1. Relative path: cockpit/src/lib/components/ui/Tabs.svelte
2. Description: Accessible, token-themed Tabs primitive using Svelte 5 snippets and $bindable runes.
3. Expects: An array of tab definitions, a bindable active tab ID, and a content snippet.
4. Provides: A fully accessible tablist and tabpanel structure governed by the Single-Source Doctrine.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface TabDefinition {
    readonly id: string;
    readonly label: string;
  }

  let {
    tabs,
    activeTab = $bindable(),
    content
  }: {
    tabs: ReadonlyArray<TabDefinition>;
    activeTab: string;
    content: Snippet<[string]>;
  } = $props();

  function handleKeydown(e: KeyboardEvent, currentTab: TabDefinition) {
    const idx = tabs.findIndex(t => t.id === currentTab.id);
    let targetTab: TabDefinition | undefined;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      targetTab = tabs[(idx + 1) % tabs.length];
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      targetTab = tabs[(idx - 1 + tabs.length) % tabs.length];
    }

    if (targetTab) {
      activeTab = targetTab.id;
      document.getElementById(`tab-${targetTab.id}`)?.focus();
    }
  }
</script>

<div class="tabs-container">
  <div class="tabs-list" role="tablist" aria-orientation="horizontal">
    {#each tabs as tab (tab.id)}
      <button
        role="tab"
        type="button"
        aria-selected={activeTab === tab.id}
        aria-controls={`panel-${tab.id}`}
        id={`tab-${tab.id}`}
        class="tabs-trigger"
        class:tabs-trigger--active={activeTab === tab.id}
        tabindex={activeTab === tab.id ? 0 : -1}
        onclick={() => activeTab = tab.id}
        onkeydown={(e) => handleKeydown(e, tab)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div
    role="tabpanel"
    id={`panel-${activeTab}`}
    aria-labelledby={`tab-${activeTab}`}
    class="tabs-content"
    tabindex="0"
  >
    {@render content(activeTab)}
  </div>
</div>

<style>
  @layer components {
    .tabs-container { display: flex; flex-direction: column; width: 100%; }
    .tabs-list { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }
    .tabs-trigger {
      padding: 0.75rem 1.25rem; background: transparent; color: var(--text-muted, var(--text));
      border: none; border-bottom: 2px solid transparent; cursor: pointer; font-weight: 500;
      font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;
      transition: color 0.2s ease, border-color 0.2s ease; outline: none;
    }
    .tabs-trigger:hover { color: var(--text); }
    .tabs-trigger:focus-visible { box-shadow: inset 0 0 0 2px var(--focus-ring, var(--accent)); border-radius: 4px 4px 0 0; }
    .tabs-trigger--active { color: var(--accent); border-bottom-color: var(--accent); }
    .tabs-content { outline: none; }
    .tabs-content:focus-visible { box-shadow: 0 0 0 2px var(--focus-ring, var(--accent)); border-radius: 4px; }
  }
</style>