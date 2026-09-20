<!--
1. Relative path: site/src/lib/components/ui/MultiSelect.svelte
2. Description: Accessible multi-option dropdown menu for selecting multiple string values.
3. Expects: Svelte 5 runes, strict TypeScript, string options, and bindable selection state.
4. Provides: A fully keyboard-navigable, aria-compliant multi-select primitive with a static visual footprint.
-->
<script lang="ts">
  import { Arrow } from '$lib/components/ui';

  let {
    options,
    selected = $bindable<string[]>([]),
    placeholder = 'Select options',
    label,
    id,
    onchange
  }: {
    options: readonly string[];
    selected?: string[];
    placeholder?: string;
    label?: string;
    id?: string;
    onchange?: (selected: string[]) => void;
  } = $props();

  const generatedId = `multiselect-${Math.random().toString(36).slice(2, 9)}`;
  const finalId = $derived(id ?? generatedId);
  const listboxId = `${finalId}-listbox`;

  let isOpen = $state(false);
  let activeIndex = $state(-1);
  let triggerRef = $state<HTMLButtonElement | null>(null);
  let listboxRef = $state<HTMLUListElement | null>(null);

  // Close on outside click
  $effect(() => {
    if (!isOpen) return;
    
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        triggerRef && !triggerRef.contains(target) &&
        listboxRef && !listboxRef.contains(target)
      ) {
        isOpen = false;
        activeIndex = -1;
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  });

  function toggleOption(option: string) {
    const next = selected.includes(option)
      ? selected.filter(s => s !== option)
      : [...selected, option];
    
    selected = next;
    onchange?.(next);
  }

  // Text is isolated from the count so CSS truncate never eats the "+X" badge
  const displayText = $derived(
    selected.length === 0 
      ? placeholder 
      : selected.length <= 2 
        ? selected.join(', ') 
        : selected.slice(0, 2).join(', ')
  );

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        isOpen = true;
        activeIndex = selected.length > 0 ? options.indexOf(selected[0]) : 0;
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        activeIndex = (activeIndex + 1) % options.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        activeIndex = (activeIndex - 1 + options.length) % options.length;
        break;
      case 'Home':
        event.preventDefault();
        activeIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        activeIndex = options.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndex >= 0) {
          toggleOption(options[activeIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        isOpen = false;
        activeIndex = -1;
        break;
      case 'Tab':
        isOpen = false;
        activeIndex = -1;
        break;
    }
  }

  function handleOptionKeydown(event: KeyboardEvent, option: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOption(option);
    }
  }
</script>

<div class="relative w-72">
  {#if label}
    <label for={finalId} class="block text-xs font-mono uppercase tracking-widest text-(--text-muted) mb-2">
      {label}
    </label>
  {/if}

  <button
    type="button"
    id={finalId}
    bind:this={triggerRef}
    class="flex items-center gap-2 w-full px-4 h-10 rounded-xl bg-(--surface) border border-(--border) text-(--text) font-mono text-sm transition-colors hover:border-(--color-lime) focus:outline-none focus:ring-2 focus:ring-(--color-lime)/50"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-controls={listboxId}
    aria-activedescendant={isOpen && activeIndex >= 0 ? `${finalId}-option-${activeIndex}` : undefined}
    onclick={() => isOpen ? (isOpen = false, activeIndex = -1) : (isOpen = true, activeIndex = selected.length > 0 ? options.indexOf(selected[0]) : 0)}
    onkeydown={handleTriggerKeydown}
  >
    <!-- Text truncates cleanly; min-w-0 is mandatory for truncate to work inside flex -->
    <span class="truncate flex-1 min-w-0 text-left {selected.length === 0 ? 'text-(--text-muted)' : ''}">
      {displayText}
    </span>
    
    <!-- Count is separated so it is never consumed by the ellipsis -->
    {#if selected.length > 2}
      <span class="shrink-0 text-xs font-bold text-(--color-lime)">+{selected.length - 2}</span>
    {/if}
    
    <span class="shrink-0 text-(--text-muted)">
      <Arrow direction={isOpen ? 'up' : 'down'} />
    </span>
  </button>

  {#if isOpen}
    <ul
      bind:this={listboxRef}
      id={listboxId}
      role="listbox"
      aria-multiselectable="true"
      class="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-xl bg-(--surface) border border-(--border) shadow-lg py-2"
    >
      {#each options as option, i (option)}
        {@const isSelected = selected.includes(option)}
        <li
          id={`${finalId}-option-${i}`}
          role="option"
          aria-selected={isSelected}
          tabindex="-1"
          class="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors {i === activeIndex ? 'bg-(--bg) text-(--text)' : 'hover:bg-(--bg)'}"
          onclick={() => toggleOption(option)}
          onkeydown={(e) => handleOptionKeydown(e, option)}
        >
          <span class="flex items-center justify-center w-5 h-5 rounded border {isSelected ? 'bg-(--color-lime) border-(--color-lime) text-gray-900' : 'border-(--border)'}">
            {#if isSelected}
              <svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </span>
          <span class="font-mono text-sm text-(--text)">{option}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>