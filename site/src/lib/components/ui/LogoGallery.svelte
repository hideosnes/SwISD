<!--
1. Relative path: site/src/lib/components/ui/LogoGallery.svelte
2. Description: Grouped logo gallery — supports labeled sub-galleries and a fixed-metric grid for square and 2:1 wide tile sequences.
3. Expects: A readonly LogoGalleryGroup list, an aria label, and optional layout/alignment variants; CSS tokens from layout.css.
4. Provides: Pixel-locked grid (126px desktop / 90px mobile) where wide cards span two tracks; labels align to the grid's left border or centerline; responsive 4-column tablet / 3-column mobile collapse; neumorphic elevation.
-->
<script lang="ts">
  export type LogoGalleryItem = {
    readonly src: string;
    readonly alt: string;
    readonly wide?: boolean;
  };

  export type LogoGalleryGroup = {
    readonly label?: string;
    readonly items: readonly LogoGalleryItem[];
  };

  export type LogoGalleryAlign = 'left' | 'center';
  export type LogoGalleryVariant = 'row' | 'grid';
  export type LogoGalleryColumns = 2 | 3 | 4 | 6;

  let {
    groups,
    ariaLabel,
    align = 'left',
    variant = 'grid',
    columns = 4
  }: {
    groups: readonly LogoGalleryGroup[];
    ariaLabel: string;
    align?: LogoGalleryAlign;
    variant?: LogoGalleryVariant;
    columns?: LogoGalleryColumns;
  } = $props();
</script>

<div
  class="logo-gallery-wrap"
  class:align-left={align === 'left'}
  class:align-center={align === 'center'}
>
  {#each groups as group, gi (gi)}
    <div class="logo-gallery-group">
      {#if group.label}
        <p class="group-label">{group.label}</p>
      {/if}
      <ul
        class="logo-gallery"
        class:variant-row={variant === 'row'}
        class:variant-grid={variant === 'grid'}
        aria-label={ariaLabel}
        style:--grid-cols={columns}
      >
        {#each group.items as item, i (i)}
          <li class="logo-tile" class:wide={item.wide}>
            <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .logo-gallery-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
    width: 100%;
  }

  .logo-gallery-group {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  /* ===== LABEL ALIGNMENT — mirrors the grid's positioning ===== */
  .group-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--color-lime);
    margin-bottom: var(--spacing-md);
  }

  /* Left: label's left edge locks to the first card's left border */
  .logo-gallery-wrap.align-left .group-label {
    text-align: left;
  }

  /* Center: label centers over the same centerline as the grid tracks */
  .logo-gallery-wrap.align-center .group-label {
    text-align: center;
  }

  .logo-gallery {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  /* ===== GRID VARIANT — fixed 126px metric ===== */
  .logo-gallery.variant-grid {
    --logo-tile: 126px;
    --logo-gap: var(--spacing-md);

    display: grid;
    grid-template-columns: repeat(var(--grid-cols, 4), var(--logo-tile));
    grid-auto-rows: var(--logo-tile); /* locks every row so wide cards never stretch the line */
    gap: var(--logo-gap);
  }

  /* Center the tracks within the full-width grid element.
     NOTE: margin:0 auto is a no-op here because the grid stretches to full width —
     justify-content is what actually centers the track set. */
  .logo-gallery-wrap.align-center .logo-gallery.variant-grid {
    justify-content: center;
  }

  /* ===== ROW VARIANT (legacy single-row flex) ===== */
  .logo-gallery.variant-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 1.65rem;
    width: 75%;
  }
  .logo-gallery-wrap.align-left .logo-gallery.variant-row   { margin: 0 auto 0 0; }
  .logo-gallery-wrap.align-center .logo-gallery.variant-row { margin: 0 auto; }

  /* ===== TILES (shared chrome) ===== */
  .logo-tile {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
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

  /* Row-variant sizing */
  .logo-gallery.variant-row .logo-tile      { flex: 1 1 0; aspect-ratio: 1; }
  .logo-gallery.variant-row .logo-tile.wide { flex: 2 1 0; aspect-ratio: 2 / 1; }

  /* Grid-variant wide card: span two tracks. Grid computes width = 2×tile + gap.
     NO aspect-ratio here — that is precisely what used to break row alignment. */
  .logo-gallery.variant-grid .logo-tile.wide { grid-column: span 2; }

  /* Padding lives on the img so the global border-box reset can't eat it */
  .logo-tile img {
    display: block;
    width: 100%;
    height: 100%;
    padding: 8%;
    box-sizing: border-box;
    object-fit: contain;
    object-position: center;
  }

  /* ===== RESPONSIVE — collapse tracks, keep rows aligned ===== */

  /* Tablet: 4 columns (4 squares / 2 rects / 2 squares + 1 rect) */
  @media (max-width: 1024px) {
    .logo-gallery.variant-grid {
      grid-template-columns: repeat(4, var(--logo-tile));
    }
  }

  /* Mobile: 3 columns (3 squares / 1 square + 1 rect).
     Tile metric shrinks to 90px so three tracks fit a phone without overflowing.
     grid-auto-rows follows the --logo-tile override automatically. */
  @media (max-width: 640px) {
    .logo-gallery.variant-grid {
      --logo-tile: 90px;
      --logo-gap: var(--spacing-sm);
      grid-template-columns: repeat(3, var(--logo-tile));
    }
  }
</style>