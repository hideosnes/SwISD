<!--
1. Relative path: site/src/lib/components/ui/Tag.svelte
2. Description: Tiny, outlined semantic tag for labeling and categorization.
3. Expects: Svelte 5 runes, strict TypeScript, variant prop.
4. Provides: A type-safe tag component with lime, purple, warn, idle, and overlay variants using tinted borders.
-->
<script lang="ts">
  type TagVariant = 'lime' | 'purple' | 'warn' | 'idle' | 'overlay';
  
  let {
    variant = 'lime' as TagVariant,
    children
  }: {
    variant?: TagVariant;
    children: import('svelte').Snippet;
  } = $props();

  const variantClasses = $derived(
    variant === 'lime' ? 'border-(--color-lime)/30 text-(--color-lime) bg-(--color-lime)/5' :
    variant === 'purple' ? 'border-(--color-purple)/30 text-(--color-purple) bg-(--color-purple)/5' :
    variant === 'warn' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' :
    variant === 'overlay' ? 'border-white/30 text-white bg-white/10' :
    'border-(--text-muted)/30 text-(--text-muted) bg-(--text-muted)/5'
  );
</script>

<span class={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-wider border ${variantClasses}`}>
  {@render children()}
</span>