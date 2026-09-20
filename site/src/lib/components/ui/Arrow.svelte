<!--
1. Relative path: site/src/lib/components/ui/Arrow.svelte
2. Description: Directional SVG arrow primitive.
3. Expects: Svelte 5 runes, strict TypeScript, direction prop.
4. Provides: A type-safe, fine-stroke SVG arrow with smaller default dimensions for precise visual cues.
-->
<script lang="ts">
  type Direction = 'up' | 'down' | 'left' | 'right' | 'external';
  
  let { direction = 'right' as Direction } = $props();
  
  const rotation: Record<Direction, string> = {
    right: '0',
    down: '90',
    left: '180',
    up: '270',
    external: '0'
  };
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width="1.5" 
  stroke-linecap="round" 
  stroke-linejoin="round"
  class="w-3.5 h-3.5 shrink-0"
  style={direction !== 'external' ? `transform: rotate(${rotation[direction]}deg)` : ''}
  aria-hidden="true"
>
  {#if direction === 'external'}
    <path d="M7 17L17 7M17 7H8M17 7V16" />
  {:else}
    <path d="M5 12h14M12 5l7 7-7 7" />
  {/if}
</svg>