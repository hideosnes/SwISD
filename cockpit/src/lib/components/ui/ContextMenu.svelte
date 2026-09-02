<!--
1. Relative path: cockpit/src/lib/components/ui/ContextMenu.svelte
2. Description: A positioned, accessible context menu primitive.
3. Expects: An anchor position, menu items, and close handler.
4. Provides: A floating menu with keyboard navigation and focus trapping.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  export interface ContextMenuItem {
    readonly id: string;
    readonly label: string;
    readonly icon?: string;
    readonly disabled?: boolean;
  }

  let {
    open,
    x,
    y,
    items,
    onclose,
    onselect
  }: {
    open: boolean;
    x: number;
    y: number;
    items: ReadonlyArray<ContextMenuItem>;
    onclose: () => void;
    onselect: (itemId: string) => void;
  } = $props();

  let menuElement: HTMLDivElement | undefined = $state();
  let focusedIndex = $state(0);

  onMount(() => {
    if (open && menuElement) {
      menuElement.focus();
    }
  });

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      onclose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIndex = (focusedIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIndex = (focusedIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = items[focusedIndex];
      if (item && !item.disabled) {
        onselect(item.id);
        onclose();
      }
    }
  }

  function handleClickOutside(e: MouseEvent): void {
    if (menuElement && !menuElement.contains(e.target as Node)) {
      onclose();
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

{#if open}
  <div
    bind:this={menuElement}
    class="context-menu"
    style="left: {x}px; top: {y}px;"
    role="menu"
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    {#each items as item, index (item.id)}
      <button
        class="context-menu__item"
        class:context-menu__item--focused={index === focusedIndex}
        class:context-menu__item--disabled={item.disabled}
        role="menuitem"
        disabled={item.disabled}
        onclick={() => {
          if (!item.disabled) {
            onselect(item.id);
            onclose();
          }
        }}
      >
        {item.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  @layer components {
    .context-menu {
      position: fixed;
      z-index: 1000;
      min-width: 160px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      padding: 4px 0;
      outline: none;
    }
    .context-menu__item {
      display: block;
      width: 100%;
      padding: 8px 16px;
      background: none;
      border: none;
      text-align: left;
      font-size: 14px;
      color: var(--text);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .context-menu__item:hover:not(:disabled),
    .context-menu__item--focused:not(:disabled) {
      background: var(--accent);
      color: var(--bg);
    }
    .context-menu__item--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
</style>