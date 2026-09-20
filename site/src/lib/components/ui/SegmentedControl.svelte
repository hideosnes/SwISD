<!--
1. Relative path: site/src/lib/components/ui/SegmentedControl.svelte
2. Description: Segmented control primitive for mutually exclusive options.
3. Expects: Svelte 5 runes, strict TypeScript, $bindable selected value, and an array of options.
4. Provides: Accessible, radio-group compliant toggle. Supports 'default' (h-12 pill) and 'compact' (h-10 box) variants to match other input footprints. Fully generic to preserve strict string literal unions.
-->
<script lang="ts" generics="T extends string">
  type Option = { value: T; label: string };

  let {
    options,
    selected = $bindable(options[0].value),
    onSelect,
    ariaLabel,
    variant = 'default'
  }: {
    options: readonly Option[];
    selected?: T;
    onSelect?: (value: T) => void;
    ariaLabel: string;
    variant?: 'default' | 'compact';
  } = $props();

  function handleSelect(value: T) {
    selected = value;
    onSelect?.(value);
  }

  const containerClasses = $derived(
    variant === 'compact'
      ? 'inline-flex items-center p-1 rounded-xl border border-(--border) bg-(--surface) h-10 w-72'
      : 'inline-flex items-center p-1 rounded-full border border-(--color-lime)/20 bg-(--surface) h-12 w-full max-w-[320px] mx-auto'
  );

  const buttonRadius = $derived(variant === 'compact' ? 'rounded-lg' : 'rounded-full');
</script>

<div 
  class={containerClasses}
  role="radiogroup" 
  aria-label={ariaLabel}
>
  {#each options as option}
    <button
      type="button"
      role="radio"
      aria-checked={selected === option.value}
      class="flex-1 h-full px-2 {buttonRadius} font-mono text-sm font-semibold transition-all duration-200 {
        selected === option.value 
          ? 'bg-(--color-lime) text-gray-900 shadow-[0_4px_12px_-4px_var(--color-lime)]' 
          : 'text-(--text-muted) hover:text-(--text)'
      }"
      onclick={() => handleSelect(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>