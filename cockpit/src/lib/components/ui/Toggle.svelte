<!--
1. Relative path: cockpit/src/lib/components/ui/Toggle.svelte
2. Description: Themed switch primitive with label, optional description, and accent-lit active track.
3. Expects: A bindable checked boolean, a label, and optional description/id/disabled.
4. Provides: An accessible role="switch" control with full keyboard parity via the native button element.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  let {
    checked = $bindable(false),
    label,
    description,
    id,
    disabled = false
  }: {
    checked: boolean;
    label: string;
    description?: string;
    id?: string;
    disabled?: boolean;
  } = $props();

  const generatedId = `toggle-${Math.random().toString(36).slice(2, 9)}`;
  const finalId = $derived(id ?? generatedId);

  function flip(): void {
    if (disabled) return;
    checked = !checked;
  }
</script>

<div class="flex items-center justify-between gap-4">
  <div class="flex min-w-0 flex-col gap-0.5">
    <label for={finalId} class="cursor-pointer text-sm text-text-1">{label}</label>
    {#if description}
      <p class="text-xs text-text-3">{description}</p>
    {/if}
  </div>

  <button
    id={finalId}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    {disabled}
    onclick={flip}
    class="flex h-6 w-11 flex-none items-center rounded-full border border-text-3 p-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    class:bg-accent={checked}
    class:bg-surface-2={!checked}
    class:border-accent={checked}
    class:opacity-50={disabled}
  >
    <span
      aria-hidden="true"
      class="h-5 w-5 rounded-full bg-text-1 transition-transform duration-200"
      class:translate-x-5={checked}
    ></span>
  </button>
</div>