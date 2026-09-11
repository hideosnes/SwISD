<!--
1. Relative path: site/src/lib/components/ui/LogoGallery.svelte
2. Description: Compact logo gallery — single-row flex layout supporting arbitrary square and 2:1 wide tile sequences with configurable alignment.
3. Expects: A readonly LogoGalleryItem list, an aria label, and an optional align variant; CSS tokens from layout.css.
4. Provides: Continuous, proportionally-sized single row at 75% scale; left or centered placement within its parent; logos span full tile width, vertically centered, fully visible; neumorphic elevation.
-->
<script lang="ts">
  export type LogoGalleryItem = {
    readonly src: string;
    readonly alt: string;
    readonly wide?: boolean;
  };

  export type LogoGalleryAlign = 'left' | 'center';

  let {
    items,
    ariaLabel,
    align = 'left'
  }: {
    items: readonly LogoGalleryItem[];
    ariaLabel: string;
    align?: LogoGalleryAlign;
  } = $props();
</script>

<ul
  class="logo-gallery"
  class:align-left={align === 'left'}
  class:align-center={align === 'center'}
  aria-label={ariaLabel}
>
  {#each items as item, i (i)}
    <li class="logo-tile" class:wide={item.wide}>
      <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
    </li>
  {/each}
</ul>

<style>
  .logo-gallery {
    display: flex;
    flex-wrap: nowrap;
    gap: 1.65rem;
    width: 75%;
    list-style: none;
    padding: 0;
  }

  .logo-gallery.align-left {
    margin: 0 auto 0 0;
  }

  .logo-gallery.align-center {
    margin: 0 auto;
  }

  .logo-tile {
    flex: 1 1 0;
    min-width: 0;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4%;
    background: var(--color-bg-elevated);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.45),
      0 -2px 6px rgba(255, 255, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    transition: border-color 0.3s ease, transform 0.3s ease;
  }

  .logo-tile:hover {
    border-color: var(--color-border-hover);
    transform: translateY(-2px);
  }

  .logo-tile.wide {
    flex: 2 1 0;
    aspect-ratio: 2 / 1;
  }

  .logo-tile img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
  }
</style>