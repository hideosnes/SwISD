<!--
1. Relative path: site/src/lib/components/ui/Badge.svelte
2. Description: Compact numeric counter, hero indicator, or semantic status chip.
3. Expects: Svelte 5 runes, strict TypeScript, variant prop.
4. Provides: A type-safe, accessible badge component capping at 99+, with high-contrast text on bright fills.
-->
<script lang="ts">
  type BadgeVariant = 'default' | 'hero' | 'status';
  type Status = 'live' | 'warn' | 'idle';
  
  let {
    variant = 'default' as BadgeVariant,
    count = 0 as number,
    label = '' as string,
    status = 'idle' as Status
  }: {
    variant?: BadgeVariant;
    count?: number;
    label?: string;
    status?: Status;
  } = $props();

  const displayCount = $derived(count > 99 ? '99+' : count.toString());
  const shouldRender = $derived(variant === 'default' ? count > 0 : true);
  
  // High contrast text: dark gray on bright fills, white on dark fills.
  const statusColor = $derived(
    status === 'live' ? 'bg-(--color-lime) text-gray-900' :
    status === 'warn' ? 'bg-yellow-500 text-gray-900' :
    'bg-(--text-muted) text-white'
  );
</script>

{#if shouldRender}
  {#if variant === 'hero'}
    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--surface) border border-(--border) font-mono text-xs font-semibold text-(--text)">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-lime) opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-(--color-lime)"></span>
      </span>
      {label}
    </span>
  {:else if variant === 'status'}
    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider ${statusColor}`}>
      {status}
    </span>
  {:else}
    <span class="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-(--color-lime) text-gray-900 font-mono text-xs font-bold" aria-hidden={label === ''}>
      {displayCount}
      {#if label}
        <span class="sr-only">{label}</span>
      {/if}
    </span>
  {/if}
{/if}