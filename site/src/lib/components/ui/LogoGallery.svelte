<!--
1. Relative path: site/src/lib/components/ui/LogoGallery.svelte
2. Description: Grid logo gallery supporting 2x1 wide tiles, group headlines, and per-item interactivity.
3. Expects: Svelte 5 runes, strict TypeScript, LogoGalleryGroup array.
4. Provides: A type-safe grid enforcing exactly 126x126 for 1:1, and calc(126px*2+1rem)x126px for 2:1, with optional clickable tiles featuring lime hover borders, indicator badges, and secure target="_blank" external links.
-->
<script lang="ts">
  import { Arrow } from './index';

  export type LogoGalleryItem = {
    src: string;
    alt: string;
    wide?: boolean;
    href?: string;
    onclick?: () => void;
  };

  export type LogoGalleryGroup = {
    label?: string;
    items: readonly LogoGalleryItem[];
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
        class="grid gap-4 items-center w-full {justifyClass} logo-gallery-grid"
        style="--lg-cols: {columns}; grid-template-columns: repeat(var(--lg-cols), 126px);"
      >
        {#each group.items as item}
          {@const isInteractive = !!item.href || !!item.onclick}
          <div 
            class="group relative flex items-center justify-center p-4 rounded-xl bg-(--surface) border border-(--border) transition-all duration-300 flex-shrink-0 hover:-translate-y-1 {item.wide ? 'col-span-2 w-[calc(126px*2+1rem)] h-[126px]' : 'w-[126px] h-[126px]'} {isInteractive ? 'hover:border-(--color-lime) cursor-pointer' : ''}"
          >
            <img 
              src={item.src} 
              alt={item.alt} 
              class="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
              loading="lazy"
            />
            
            {#if isInteractive}
              <!-- Indicator Badge (The refined Arrow now sits perfectly inside this 24x24 container) -->
              <span class="absolute top-2.5 right-2.5 flex items-center justify-center w-6 h-6 rounded-full bg-(--color-lime) text-gray-900 transition-transform group-hover:scale-110">
                <Arrow direction={item.href ? 'external' : 'right'} />
              </span>
              
              <!-- Interactive Overlay -->
              {#if item.href}
                <a href={item.href} target="_blank" rel="noopener noreferrer" class="absolute inset-0 z-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-lime) focus:ring-offset-2 focus:ring-offset-(--bg)" aria-label={item.alt}></a>
              {:else if item.onclick}
                <button type="button" onclick={item.onclick} class="absolute inset-0 z-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-lime) focus:ring-offset-2 focus:ring-offset-(--bg)" aria-label={item.alt}></button>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>