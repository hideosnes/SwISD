<!--
1. Relative path: site/src/lib/components/ui/Card.svelte
2. Description: Standard card primitive for the SwISD marketing site.
3. Expects: Svelte 5 runes, strict TypeScript, variant prop.
4. Provides: A type-safe, accessible card container utilizing layout.css tokens.
-->
<script lang="ts">
  type CardVariant = 'default' | 'solution' | 'arch';
  
  let {
    variant = 'default' as CardVariant,
    children
  }: {
    variant?: CardVariant;
    children: import('svelte').Snippet;
  } = $props();

  const className = $derived(
    variant === 'default' ? 'card' :
    variant === 'solution' ? 'card-solution' :
    'card-arch'
  );
</script>

<div class={className}>
  {@render children()}
</div>