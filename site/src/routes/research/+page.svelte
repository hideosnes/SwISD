<!--
1. Relative path: site/src/routes/research/+page.svelte
2. Description: List view for the /research knowledge hub, matching the marketing site design system.
3. Expects: PageData containing an array of KnowledgeEntryMeta.
4. Provides: Accessible, token-themed list of knowledge cards using canonical layout.css classes, plus an empty-state guard.
-->
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Research & Knowledge | SwISD</title>
  <meta name="description" content="Scientific knowledge hub for SwISD CRDT proofs, Merkle-DAG integrity, and cryptographic primitives." />
</svelte:head>

<section id="research-hub">
  <div class="container">
    <header class="mb-12">
      <span class="section-label">The Science</span>
      <h1 class="section-title section-title-sm">
        Research & Knowledge<br />
        <span class="lime">Formal proofs and cryptographic primitives.</span>
      </h1>
      <p class="section-desc">
        The scientific knowledge hub for SwISD. Deep-dives into CRDT convergence, Merkle-DAG integrity, and the mathematical foundations powering our decentralized swarm.
      </p>
    </header>

    {#if data.entries.length === 0}
      <div class="section-desc" style="border: 1px dashed var(--border); padding: 2rem; border-radius: var(--radius-lg); text-align: center;">
        No knowledge entries found. 
        <br /><br />
        Ensure you have created at least one markdown file in 
        <code style="background: var(--color-lime-dim); color: var(--color-lime); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: var(--font-mono);">site/src/lib/content/knowledge/</code>
      </div>
    {:else}
      <ul class="grid-2" role="list">
        {#each data.entries as entry (entry.slug)}
          <li>
            <a
              href="/research/{entry.slug}"
              class="whitepaper-card"
            >
              <div class="flex flex-wrap gap-2 mb-4">
                {#each entry.tags as tag}
                  <span class="tag-lime">{tag}</span>
                {/each}
              </div>
              <h2 class="card-title">{entry.title}</h2>
              <p class="card-abstract">{entry.abstract}</p>
              <div class="card-meta">
                <span>{entry.author}</span>
                <span aria-hidden="true" class="meta-divider">•</span>
                <time datetime={entry.publishedDate.toISOString()}>
                  {entry.publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>