<!--
1. Relative path: site/src/lib/components/ui/LogoGallery.svelte
2. Description: Grid logo gallery supporting 2x1 wide tiles and group headlines.
3. Expects: Svelte 5 runes, strict TypeScript, LogoGalleryGroup array.
4. Provides: A type-safe grid enforcing exactly 126x126 for 1:1, and calc(126px*2+1rem)x126px for 2:1, with subtle hover lift animation.
-->
<script lang="ts">
  export type LogoGalleryGroup = {
    label?: string;
    items: readonly { src: string; alt: string; wide?: boolean }[];
  };

  let {
    groups,
    ariaLabel,
    variant = 'grid' as 'grid',
    columns = 4 as number,
    align = 'center' as 'left' | 'center'
  }: {
    groups: readonly LogoGalleryGroup[];
    ariaLabel: string;
    variant?: 'grid';
    columns?: number;
    align?: 'left' | 'center';
  } = $props();

  const justifyClass = $derived(align === 'center' ? 'justify-center' : 'justify-start');
</script>

<div class="space-y-12" aria-label={ariaLabel}>
  {#each groups as group}
    <div class="space-y-6">
      {#if group.label}
        <h4 class="font-mono text-xs text-(--color-lime) uppercase tracking-widest {align === 'center' ? 'text-center' : 'text-left'}">
          {group.label}
        </h4>
      {/if}
      
      <div 
        class="grid gap-4 items-center w-full {justifyClass}"
        style="grid-template-columns: repeat({columns}, 126px);"
      >
        {#each group.items as item}
          <div 
            class="flex items-center justify-center p-4 rounded-xl bg-(--surface) border border-(--border) transition-transform duration-300 hover:-translate-y-1 flex-shrink-0 {item.wide ? 'col-span-2 w-[calc(126px*2+1rem)] h-[126px]' : 'w-[126px] h-[126px]'}"
          >
            <img 
              src={item.src} 
              alt={item.alt} 
              class="max-w-full max-h-full object-contain opacity-80 hover:opacity-100 transition-opacity" 
            />
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>