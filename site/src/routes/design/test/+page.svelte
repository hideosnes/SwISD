<!--
1. Relative path: site/src/routes/design/test/+page.svelte
2. Description: Visual annotation test page for knowledge entry typography and layout.
3. Expects: None. Hardcoded representative data mirroring the [slug] route for design review.
4. Provides: A fully annotated, 1:1 structural clone of the knowledge detail page to inform styling decisions.
-->
<script lang="ts">
  import { Arrow } from '$lib/components/ui';

  const entry = {
    title: "Marketing Harm as Honesty: The Rhetorical Strategy of 'Uncensored' AI",
    abstract: "A critique of the 'uncensored' AI paradigm, using Elon Musk's Grok as a case study to expose how the deliberate dismantling of safety teams and the marketing of toxic outputs as 'objective truth' functions as a sophisticated rhetorical strategy for ideological engineering and epistemic violence.",
    author: "Hidéo Snes",
    publishedDate: new Date("2026-01-26T00:00:00.000Z"),
    tags: ["AI Ethics", "Grok", "Epistemic Violence", "Rhetoric"],
    chartData: [{ label: "Metric A", value: 42 }, { label: "Metric B", value: 84 }]
  };

  let isExpanded = $state(false);
</script>

<svelte:head>
  <title>{entry.title} | SwISD Research</title>
  <meta name="description" content={entry.abstract} />
</svelte:head>

<!-- Full-width immersive header, flush with the top of the viewport (behind fixed TopNav) -->
<header class="cta-band" style="text-align: left; padding: 8rem 2rem 4rem 2rem; margin-top: 0;">
  <div class="max-w-4xl mx-auto relative z-10">
    <a href="/research" class="back-link mb-8 block annotate-inline" data-label="A (BACK-LINK)">
      ← Back to Research
    </a>
    
    <div class="flex flex-wrap gap-2 mb-6">
      {#each entry.tags as tag}
        <span class="tag-lime annotate-inline" data-label="SPAN (TAG)">{tag}</span>
      {/each}
    </div>
    
    <h1 class="section-title section-title-sm mb-6">
      <span class="annotate-inline" data-label="H1">{entry.title}</span>
    </h1>
    
    <p class="section-desc mb-8">
      <span class="annotate-inline" data-label="P (DESC)">{entry.abstract}</span>
    </p>
    
    <div class="card-meta mt-6">
      <span class="annotate-inline" data-label="SPAN (AUTHOR)">{entry.author}</span>
      <span aria-hidden="true" class="meta-divider">•</span>
      <time datetime={entry.publishedDate.toISOString()}>
        <span class="annotate-inline" data-label="TIME">{entry.publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </time>
    </div>
  </div>
</header>

<!-- Article Content -->
<section id="knowledge-detail" style="padding-top: 4rem; padding-bottom: 4rem; border-top: none;">
  <div class="container">
    <article class="knowledge-content mx-auto relative" class:collapsed={!isExpanded}>
      <!-- First paragraph directly, no leading h2. Whitespace before citations removed for clean punctuation when hidden -->
      <p class="annotate-block" data-label="P">
        Previous generations of digital platforms shaped human experience through their interfaces. Social media defines connection through scrolling feeds and character limits. Search engines organize knowledge through algorithmic ranking. Both systems influenced culture but rarely claimed to define reality itself. Today's artificial intelligence systems have crossed a threshold. They no longer merely mediate our experience of information. They assert authority over what constitutes truth<a href="#ref-1" class="knowledge-citation annotate-inline" data-label="A (CITATION)" aria-label="Jump to reference 1"><sup>1</sup></a>. 
        This transformation represents a fundamental shift in technological power. When an AI system declares what is real, it assumes a role previously held by institutions of knowledge built over centuries<a href="#ref-2" class="knowledge-citation annotate-inline" data-label="A (CITATION)" aria-label="Jump to reference 2"><sup>2</sup></a><a href="#ref-3" class="knowledge-citation annotate-inline" data-label="A (CITATION)" aria-label="Jump to reference 3"><sup>3</sup></a>.
      </p>

      <!-- Progressive Disclosure: Renders only when collapsed, vanishes completely on click -->
      {#if !isExpanded}
        <div class="read-more-wrapper">
          <button class="btn-secondary" onclick={() => isExpanded = true}>
            Read more... <Arrow direction="down" />
          </button>
        </div>
      {/if}

      {#if isExpanded}
        <!-- Promoted from h3 to h2 -->
        <h2 class="annotate-block" data-label="H2">
          The Oracle of "Maximally Truthful" AI
        </h2>

        <p class="annotate-block" data-label="P">
          Elon Musk's Grok exemplifies this new paradigm. The system arrives not as a neutral tool but as an oracle. Its outputs carry the weight of revelation. Musk positions Grok as a "maximally truthful" counterforce to what he terms the "woke mind virus" infecting rival models 
          <a href="#ref-4" class="knowledge-citation annotate-inline" data-label="A (CITATION)" aria-label="Jump to reference 4">
            <sup>4</sup>
          </a>. 
          This framing elevates the system beyond mere software. It becomes a truth-seeking entity unburdened by human bias.
        </p>

        <blockquote class="annotate-block" data-label="BLOCKQUOTE">
          <p class="annotate-inline" data-label="P (INSIDE BLOCKQUOTE)">
            "Objective truth" functions here as a mask. It converts subjective bias into system-level facticity. The personal opinions of executives become the architectural principles of AI systems.
          </p>
        </blockquote>

        <p class="annotate-block" data-label="P">
          The epistemic infrastructure that supports Grok operates through what scholars term "sociotechnical systems theory of AI safety". This framework reveals how safety alignment collapses when ideological commitments override technical safeguards.
        </p>

        <!-- Promoted from h3 to h2 -->
        <h2 class="annotate-block" data-label="H2">
          References
        </h2>

        <ol class="annotate-block" data-label="OL">
          <li class="annotate-block" data-label="LI" id="ref-1">
            Alvarado, R. AI as an Epistemic Technology. Sci Eng Ethics 29, 32 (2023).
          </li>
          <li class="annotate-block" data-label="LI" id="ref-2">
            Arslan, Sıddık. “AI-Driven Algorithmic Propaganda and Epistemic Authority.” GPH – International Journal of Applied Management Science, 2025.
          </li>
          <li class="annotate-block" data-label="LI" id="ref-3">
            Shin, Donghee. (2025). Automating epistemology: how AI reconfigures truth, authority, and verification. AI & SOCIETY. 1-7.
          </li>
        </ol>

        <hr class="annotate-block" data-label="HR" />

        <p class="annotate-block" data-label="P">
          Finally, a link to an <a href="#" class="annotate-inline" data-label="A (LINK)">external resource</a> to demonstrate standard link styling within the knowledge content.
        </p>
      {/if}
    </article>

    <!-- Chart Section -->
    {#if entry.chartData && entry.chartData.length > 0}
      <section class="knowledge-chart-section mx-auto relative" aria-labelledby="chart-heading" style="margin-bottom: 4rem;">
        <h2 id="chart-heading" class="card-title mb-4 annotate-inline" data-label="H2 (CHART TITLE)">Statistical Metrics</h2>
        <div class="chart-container">
          <div class="annotate-block" data-label="DIV (CHART CONTAINER)" style="width: 600px; height: 250px; background: var(--surface); border: 1px dashed var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-family: var(--font-mono); border-radius: var(--radius-lg);">
            [ StatsChart Placeholder ]
          </div>
        </div>
      </section>
    {/if}
  </div>
</section>

<style>
  /* 
   * Annotation Styles 
   * Strictly scoped to this component. Will not leak into production.
   */
  .annotate-block {
    position: relative;
    margin-top: 2.5rem;
  }
  
  .annotate-block::before {
    content: attr(data-label);
    position: absolute;
    top: -0.85rem;
    left: -0.25rem;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-lime);
    background: var(--bg);
    border: 1px solid var(--color-lime);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    pointer-events: none;
    z-index: 20;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .annotate-inline {
    position: relative;
    display: inline-block;
    vertical-align: middle;
  }
  
  .annotate-inline::before {
    content: attr(data-label);
    position: absolute;
    top: -0.7rem;
    left: 0;
    font-family: var(--font-mono);
    font-size: 0.5rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-lime);
    background: var(--bg);
    border: 1px solid var(--color-lime);
    padding: 0.05rem 0.25rem;
    border-radius: 3px;
    pointer-events: none;
    z-index: 20;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  h2.annotate-block { margin-top: 3.5rem; }
  blockquote.annotate-block { margin-top: 2rem; }
  ol.annotate-block { margin-top: 2rem; }
  hr.annotate-block { margin-top: 3rem; margin-bottom: 3rem; }
  
  article > .annotate-block:first-child {
    margin-top: 0;
  }
  article > .annotate-block:first-child::before {
    top: -0.85rem;
  }

  /* Progressive Disclosure Wrapper */
  .read-more-wrapper {
    margin-top: 1rem;
    margin-bottom: 2rem;
    text-align: center;
  }
</style>