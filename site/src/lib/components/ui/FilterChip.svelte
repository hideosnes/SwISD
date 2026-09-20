<!--
1. Relative path: site/src/lib/components/ui/FilterChip.svelte
2. Description: Accessible toggle chip for filtering lists.
3. Expects: Svelte 5 runes, strict TypeScript, label, active state, and click handler.
4. Provides: A type-safe, aria-pressed button primitive with strict theme token styling.
-->
<script lang="ts">
  let {
    label,
    active = false,
    onclick
  }: {
    label: string;
    active?: boolean;
    onclick: () => void;
  } = $props();

  const baseClasses = "inline-flex items-center px-3 h-8 rounded-full font-mono text-xs font-medium transition-all duration-200 border cursor-pointer";
  const stateClasses = $derived(
    active
      ? "bg-(--color-lime) text-gray-900 border-(--color-lime)"
      : "bg-transparent text-(--text-muted) border-(--border) hover:text-(--text) hover:border-(--color-lime)"
  );
</script>

<button
  type="button"
  class={`${baseClasses} ${stateClasses}`}
  aria-pressed={active}
  {onclick}
>
  {label}
</button>