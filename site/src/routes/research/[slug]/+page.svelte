<!--
1. Relative path: site/src/routes/research/[slug]/+page.svelte
2. Description: Detail view for a single knowledge entry, rendering HTML and optional statistical charts.
3. Expects: PageData containing a full KnowledgeEntry DTO.
4. Provides: Accessible article layout with D3-math/Svelte-SVG statistical graphs, matching marketing site tokens, with strict Svelte 5 reactivity.
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { StatsChart } from '$lib/components/datavis';

  let { data }: { data: PageData } = $props();
  
  // Svelte 5 reactivity: $derived ensures 'entry' tracks changes to 'data.entry'
  let entry = $derived(data.entry);
</script>

<svelte:head>
  <title>{entry.title} | SwISD Research</title>
  <meta name="description" content={entry.abstract} />
</svelte:head>

<section id="knowledge-detail">
  <div class="container">
    <header class="mb-12">
      <a href="/research" class="back-link">
        ← Back to Research
      </a>
      <div class="flex flex-wrap gap-2 mb-4">
        {#each entry.tags as tag}
          <span class="tag-lime">{tag}</span>
        {/each}
      </div>
      <h1 class="section-title section-title-sm">
        {entry.title}
      </h1>
      <p class="section-desc" style="max-width: 100%;">{entry.abstract}</p>
      <div class="card-meta mt-6">
        <span>{entry.author}</span>
        <span aria-hidden="true" class="meta-divider">•</span>
        <time datetime={entry.publishedDate.toISOString()}>
          {entry.publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
      </div>
    </header>

    <article class="whitepaper-content">
      {@html entry.contentHtml}
    </article>

    {#if entry.chartData && entry.chartData.length > 0}
      <section class="whitepaper-chart-section" aria-labelledby="chart-heading">
        <h2 id="chart-heading" class="card-title mb-4">Statistical Metrics</h2>
        <div class="chart-container">
          <StatsChart data={entry.chartData} width={600} height={250} />
        </div>
      </section>
    {/if}
  </div>
</section>