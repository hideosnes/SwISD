<!--
1. Relative path: site/src/lib/components/ui/SegmentedControl.svelte
2. Description: Generic segmented pill toggle. Single-select, token-themed, keyboard-native.
3. Expects: A readonly option list, the selected value, a select callback, and an aria label.
4. Provides: The one true segmented control — consumed by the hero audience toggle and the orbit pillar tabs.
-->
<script lang="ts" generics="T extends string">
  let {
    options,
    selected,
    onSelect,
    ariaLabel
  }: {
    options: readonly { value: T; label: string }[];
    selected: T;
    onSelect: (value: T) => void;
    ariaLabel: string;
  } = $props();
</script>

<div class="segmented" role="group" aria-label={ariaLabel}>
  {#each options as opt (opt.value)}
    <button
      type="button"
      class="segment"
      class:active={selected === opt.value}
      aria-pressed={selected === opt.value}
      onclick={() => onSelect(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.25rem;
    border: var(--border-accent);
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(8px);
  }

  .segment {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-gray-400);
    background: transparent;
    border: none;
    border-radius: var(--radius-full);
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    transition: color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
    white-space: nowrap;
  }

  .segment:hover { color: var(--color-white); }

  .segment.active {
    background: var(--color-lime);
    color: var(--color-purple-deeper);
    box-shadow: 0 2px 8px rgba(84, 255, 126, 0.3);
  }

  .segment:focus-visible {
    outline: 2px solid var(--color-lime);
    outline-offset: 2px;
  }
</style>