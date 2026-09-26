<!--
1. Relative path: site/src/routes/research/[slug]/+page.svelte
2. Description: Detail view for a single knowledge entry, rendering HTML and optional statistical charts.
3. Expects: PageData containing a full KnowledgeEntry DTO.
4. Provides: Accessible article layout with D3-math/Svelte-SVG statistical graphs, matching marketing site tokens, with strict Svelte 5 reactivity and progressive disclosure.
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { StatsChart } from '$lib/components/datavis';
  import { Arrow } from '$lib/components/ui';

  let { data }: { data: PageData } = $props();
  
  let entry = $derived(data.entry);

  // Reactive split of contentHtml into intro and body for progressive disclosure
  const hasSplitMarker = $derived(entry.contentHtml.includes('<!-- more -->'));
  
  // Strictly typed derivation: handles null from .match() via optional chaining and nullish coalescing
  const contentSplit = $derived<string[]>(
    hasSplitMarker 
      ? entry.contentHtml.split('<!-- more -->')
      : (entry.contentHtml.match(/^([\s\S]*?<\/p>)([\s\S]*)$/i)?.slice(1) ?? ['', entry.contentHtml])
  );
  
  const firstParagraphHtml = $derived(
    hasSplitMarker 
      ? contentSplit[0].trim() 
      : contentSplit[0]
  );
  
  const restOfContentHtml = $derived(
    hasSplitMarker 
      ? contentSplit[1].trim() 
      : contentSplit[1]
  );

  let isExpanded = $state(false);
</script>

<svelte:head>
  <title>{entry.title} | SwISD Research</title>
  <meta name="description" content={entry.abstract} />
</svelte:head>

<!-- Inline style strictly overrides global section padding to keep header flush -->
<section id="knowledge-detail" style="padding: 0; border-top: none;">
  <!-- Full-width immersive header, flush with the top of the viewport (behind fixed TopNav) -->
  <header class="cta-band" style="text-align: left; padding: 8rem 2rem 4rem 2rem; margin-top: 0;">
    <div class="max-w-4xl mx-auto relative z-10">
      <a href="/research" class="back-link mb-8 block">
        ← Back to Research
      </a>
      
      <div class="flex flex-wrap gap-2 mb-6">
        {#each entry.tags as tag}
          <span class="tag-lime">{tag}</span>
        {/each}
      </div>
      
      <h1 class="section-title section-title-sm mb-6">
        {entry.title}
      </h1>
      
      <p class="section-desc mb-8">
        {entry.abstract}
      </p>
      
      <div class="card-meta mt-6">
        <span>{entry.author}</span>
        <span aria-hidden="true" class="meta-divider">•</span>
        <time datetime={entry.publishedDate.toISOString()}>
          {entry.publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
      </div>
    </div>
  </header>

  <!-- Article Content -->
  <div class="container" style="padding-top: 4rem; padding-bottom: 4rem; border-top: none;">
    <article class="knowledge-content mx-auto relative" class:collapsed={!isExpanded}>
      {@html firstParagraphHtml}

      <!-- Progressive Disclosure: Renders only when collapsed, vanishes completely on click -->
      {#if !isExpanded}
        <div class="read-more-wrapper">
          <button class="btn-secondary" onclick={() => isExpanded = true}>
            Read more... <Arrow direction="down" />
          </button>
        </div>
      {/if}

      {#if isExpanded}
        {@html restOfContentHtml}
      {/if}
    </article>

    <!-- Chart Section -->
    {#if entry.chartData && entry.chartData.length > 0}
      <section class="knowledge-chart-section mx-auto relative" aria-labelledby="chart-heading" style="margin-bottom: 4rem;">
        <h2 id="chart-heading" class="card-title mb-4">Statistical Metrics</h2>
        <div class="chart-container">
          <StatsChart data={entry.chartData} width={600} height={250} />
        </div>
      </section>
    {/if}
  </div>
</section>

<style>
  /* Progressive Disclosure Wrapper */
  .read-more-wrapper {
    margin-top: 1rem;
    margin-bottom: 2rem;
    text-align: center;
  }
</style>