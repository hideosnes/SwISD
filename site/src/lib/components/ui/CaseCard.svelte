<!--
1. Relative path: site/src/lib/components/ui/CaseCard.svelte
2. Description: Polymorphic case study card supporting 6 layout regimes, with optional linked titles and partners.
3. Expects: Svelte 5 runes, strict TypeScript, CaseEntry DTO, and a typed layout union.
4. Provides: A single source of truth for case study rendering, variance through $props().
-->
<script lang="ts">
  import { Arrow, Tag } from '$lib/components/ui';
  import type { CaseEntry } from '$lib/content/cases';

  export type CaseCardLayout = 'gallery' | 'plate' | 'stack' | 'ledger' | 'split' | 'marquee';
  type TextTheme = 'default' | 'overlay';

  let {
    project,
    layout = 'gallery',
    flip = false
  }: {
    project: CaseEntry;
    layout?: CaseCardLayout;
    flip?: boolean;
  } = $props();
</script>

{#snippet eyebrow(textTheme: TextTheme = 'default')}
  <div class="flex flex-wrap items-center gap-2 mb-3">
    {#each project.industry as ind}
      <Tag variant={textTheme === 'overlay' ? 'overlay' : 'lime'}>{ind}</Tag>
    {/each}
    {#each project.modalities as mod}
      <Tag variant={textTheme === 'overlay' ? 'overlay' : 'idle'}>{mod}</Tag>
    {/each}
  </div>
{/snippet}

{#snippet imgBlock(classes: string)}
  <div class={classes}>
    <img
      src={project.image}
      alt={`Artwork for ${project.title}`}
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  </div>
{/snippet}

{#snippet titleInner()}
  {#if project.link}
    <a
      href={project.link.href}
      target={project.link.external ? '_blank' : undefined}
      rel={project.link.external ? 'noopener noreferrer' : undefined}
      class="inline-flex items-center gap-2 text-(--color-lime) hover:underline"
    >
      {project.title}<Arrow direction={project.link.external ? 'external' : 'right'} />
    </a>
  {:else}
    {project.title}
  {/if}
{/snippet}

{#snippet partnerLinks(textTheme: TextTheme = 'default')}
  {#each project.partners as partner, i}
    {#if i > 0}, {/if}
    {#if partner.link}
      <a
        href={partner.link.href}
        target={partner.link.external ? '_blank' : undefined}
        rel={partner.link.external ? 'noopener noreferrer' : undefined}
        class="inline-flex items-center gap-1 transition-colors {textTheme === 'overlay' ? 'text-white/60 hover:text-(--color-lime)' : 'text-(--text-muted) hover:text-(--color-lime)'}"
      >
        {partner.name}<Arrow direction={partner.link.external ? 'external' : 'right'} />
      </a>
    {:else}
      {partner.name}
    {/if}
  {/each}
{/snippet}

{#snippet contentBlock(baseClasses: string, textTheme: TextTheme = 'default')}
  <div class={baseClasses}>
    {@render eyebrow(textTheme)}

    <h3 class="text-xl font-bold font-mono mb-1 {project.link ? '' : (textTheme === 'overlay' ? 'text-white' : 'text-(--text)')}">
      {@render titleInner()}
    </h3>
    {#if project.subtitle}
      <p class="text-sm mb-3 {textTheme === 'overlay' ? 'text-white/80' : 'text-(--text-muted)'}">{project.subtitle}</p>
    {/if}
    <p class="text-xs font-mono mb-4 {textTheme === 'overlay' ? 'text-white/60' : 'text-(--text-muted)'}">
      {#if project.partners.length > 0}
        With {@render partnerLinks(textTheme)} <span aria-hidden="true" class="mx-1">•</span>
      {/if}
      {project.year}
    </p>

    <!-- Default theme: full prose, no clamp, no ellipsis, no reserved ghost space.
         Overlay theme: clamped — absolute text over a fixed square frame has hard geometry. -->
    <p class="text-sm {textTheme === 'overlay' ? 'line-clamp-4 text-white/90' : 'text-(--text)'}">{project.summary}</p>
  </div>
{/snippet}

<article class="group flex h-full bg-(--surface) border border-(--border) rounded-2xl overflow-hidden transition-all duration-300 hover:border-(--color-lime)/50
  {layout === 'ledger' || layout === 'split' || layout === 'marquee' ? 'flex-row' : 'flex-col'}
  {layout === 'marquee' && flip ? 'md:flex-row-reverse' : ''}
  {layout === 'split' ? 'flex-col md:flex-row' : ''}
">
  {#if layout === 'gallery'}
    {@render imgBlock('aspect-square w-full overflow-hidden bg-(--bg)')}
    {@render contentBlock('p-6 flex flex-col flex-1')}

  {:else if layout === 'plate'}
    <div class="relative aspect-square w-full overflow-hidden">
      {@render imgBlock('absolute inset-0')}
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      {@render contentBlock('absolute bottom-0 left-0 right-0 p-6 flex flex-col flex-1 z-10', 'overlay')}
    </div>

  {:else if layout === 'stack'}
    {@render imgBlock('aspect-[4/5] w-full overflow-hidden bg-(--bg)')}
    <div class="flex flex-col w-full">
      <div class="p-6 border-b border-(--border)">
        {@render eyebrow('default')}
        <h3 class="text-2xl font-bold font-mono {project.link ? '' : 'text-(--text)'}">
          {@render titleInner()}
        </h3>
      </div>
      <div class="p-6 border-b border-(--border)">
        <p class="text-xs font-mono text-(--text-muted) uppercase tracking-widest mb-2">Partners</p>
        <p class="text-sm text-(--text)">
          {#if project.partners.length > 0}
            {@render partnerLinks('default')} <span aria-hidden="true" class="mx-1">•</span>
          {/if}
          {project.year}
        </p>
      </div>
      <div class="p-6 flex-1">
        <p class="text-xs font-mono text-(--text-muted) uppercase tracking-widest mb-2">Summary</p>
        <p class="text-sm text-(--text)">{project.summary}</p>
      </div>
    </div>

  {:else if layout === 'ledger'}
    {@render imgBlock('w-48 md:w-64 aspect-square shrink-0 overflow-hidden bg-(--bg)')}
    {@render contentBlock('p-6 flex flex-col flex-1')}

  {:else if layout === 'split'}
    <div class="grid grid-cols-1 md:grid-cols-5 h-full w-full">
      {@render imgBlock('col-span-1 md:col-span-2 aspect-square md:aspect-auto md:h-full overflow-hidden bg-(--bg)')}
      {@render contentBlock('col-span-1 md:col-span-3 p-6 md:p-8 flex flex-col flex-1')}
    </div>

  {:else if layout === 'marquee'}
    {@render imgBlock('w-full md:w-1/2 aspect-square md:aspect-auto overflow-hidden bg-(--bg)')}
    {@render contentBlock('w-full md:w-1/2 p-8 md:p-12 flex flex-col flex-1 justify-center')}
  {/if}
</article>