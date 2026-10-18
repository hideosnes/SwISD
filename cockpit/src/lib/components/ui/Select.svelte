<!--
1. Relative path: cockpit/src/lib/components/ui/Select.svelte
2. Description: Themed single-select primitive with custom listbox panel, matching TextField visual parity.
3. Expects: A label, a bindable string value, a readonly option list, and optional id/helper/disabled.
4. Provides: A type-safe, accessible dropdown with full keyboard navigation, click-outside dismissal, and inherited --field-bg.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  interface SelectOption {
    readonly value: string;
    readonly label: string;
  }

  let {
    id,
    label,
    value = $bindable(''),
    options,
    helper,
    disabled = false
  }: {
    id?: string;
    label: string;
    value: string;
    options: ReadonlyArray<SelectOption>;
    helper?: string;
    disabled?: boolean;
  } = $props();

  const generatedId = `select-${Math.random().toString(36).slice(2, 9)}`;
  const finalId = $derived(id ?? generatedId);
  const panelId = $derived(`${finalId}-panel`);
  const helperId = $derived(`${finalId}-helper`);

  let open = $state(false);
  let activeIndex = $state(-1);
  let triggerEl: HTMLButtonElement | undefined = $state();
  let panelEl: HTMLDivElement | undefined = $state();

  const selectedLabel = $derived(
    options.find((o) => o.value === value)?.label ?? ''
  );

  function toggle(): void {
    if (disabled) return;
    open = !open;
    if (open) {
      activeIndex = options.findIndex((o) => o.value === value);
      if (activeIndex === -1) activeIndex = 0;
    }
  }

  function selectOption(opt: SelectOption): void {
    value = opt.value;
    open = false;
    triggerEl?.focus();
  }

  function handleTriggerKeydown(e: KeyboardEvent): void {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        open = true;
        activeIndex = options.findIndex((o) => o.value === value);
        if (activeIndex === -1) activeIndex = 0;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = (activeIndex + 1) % options.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = (activeIndex - 1 + options.length) % options.length;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const targetOption = options[activeIndex];
        if (targetOption !== undefined) {
          selectOption(targetOption);
        }
        break;
      case 'Escape':
        e.preventDefault();
        open = false;
        triggerEl?.focus();
        break;
      case 'Tab':
        open = false;
        break;
    }
  }

  function handleClickOutside(e: MouseEvent): void {
    const target = e.target as Node;
    if (
      triggerEl && !triggerEl.contains(target) &&
      panelEl && !panelEl.contains(target)
    ) {
      open = false;
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  $effect(() => {
    if (open && panelEl && activeIndex >= 0) {
      const activeEl = panelEl.querySelector(`[data-index="${activeIndex}"]`);
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  });
</script>

<div class="field" class:field--open={open}>
  <label for={finalId}>{label}</label>

  <div class="field-input-wrap">
    <button
      bind:this={triggerEl}
      id={finalId}
      type="button"
      class="select-trigger"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={panelId}
      aria-describedby={helper ? helperId : undefined}
      {disabled}
      onclick={toggle}
      onkeydown={handleTriggerKeydown}
    >
      <span class="select-value">{selectedLabel}</span>
      <span class="mi select-icon" aria-hidden="true">expand_more</span>
    </button>

    {#if open}
      <div
        bind:this={panelEl}
        id={panelId}
        class="select-panel"
        role="listbox"
        tabindex="-1"
      >
        {#each options as option, i (option.value)}
          <div
            class="select-option"
            class:select-option--active={i === activeIndex}
            role="option"
            tabindex="-1"
            aria-selected={option.value === value}
            data-index={i}
            onmousedown={(e) => { e.preventDefault(); selectOption(option); }}
            onmouseenter={() => { activeIndex = i; }}
          >
            <span>{option.label}</span>
            {#if option.value === value}
              <span class="mi select-option-check" aria-hidden="true">check</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if helper}
    <span id={helperId} class="helper mono">{helper}</span>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }

  .field label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-2);
  }

  .field-input-wrap {
    position: relative;
  }

  .select-trigger {
    width: 100%;
    padding: 11px 14px;
    /* CHAMELEON: Drinks the inherited --field-bg. Matches TextField perfectly. */
    background: var(--field-bg);
    color: var(--text-1);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 13px;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease), box-shadow var(--duration-fast) var(--ease);
  }

  .select-trigger:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .select-trigger:focus {
    outline: none;
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2), 0 0 16px color-mix(in srgb, var(--accent-2) 25%, transparent);
  }

  .select-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .select-icon {
    font-size: 17px;
    color: var(--text-3);
    transition: transform var(--duration-fast) var(--ease);
    margin-left: 8px;
  }

  .field--open .select-icon {
    transform: rotate(180deg);
  }

  .select-panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    /* CHAMELEON: Floating panel also drinks --field-bg, ensuring it separates cleanly from whatever it drifts over. */
    background: var(--field-bg);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 100;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
  }

  .select-option {
    padding: 8px 10px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-1);
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .select-option:hover,
  .select-option--active {
    background: color-mix(in srgb, var(--text-1) 10%, transparent);
  }

  .select-option[aria-selected="true"] {
    color: var(--accent);
  }

  .select-option-check {
    font-size: 16px;
    margin-left: 8px;
  }

  .helper {
    font-size: 10px;
    color: var(--text-3);
    letter-spacing: 0.04em;
  }
</style>