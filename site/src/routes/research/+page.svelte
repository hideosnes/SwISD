<!--
1. Relative path: site/src/routes/research/+page.svelte
2. Description: List view for the /research knowledge hub, matching the marketing site design system.
3. Expects: PageData containing an array of KnowledgeEntryMeta.
4. Provides: Accessible, token-themed list of knowledge cards using canonical layout.css classes, plus an empty-state guard.
-->
<script lang="ts">
  import type { PageData } from './$types';
  import { MultiSelect } from '$lib/components/ui';

  let { data }: { data: PageData } = $props();
  
  let searchQuery = $state('');
  let selectedTags = $state<string[]>([]);

  const allTags = $derived(
    Array.from(new Set(data.entries.flatMap(e => e.tags))).sort((a, b) => a.localeCompare(b))
  );

  function clearFilters() {
    searchQuery = '';
    selectedTags = [];
  }

  const filteredEntries = $derived(
    data.entries.filter(entry => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || 
        entry.title.toLowerCase().includes(q) ||
        entry.abstract.toLowerCase().includes(q) ||
        entry.author.toLowerCase().includes(q) ||
        entry.tags.some(tag => tag.toLowerCase().includes(q));
      
      const matchTags = selectedTags.length === 0 || selectedTags.every(t => entry.tags.includes(t));
      
      return matchSearch && matchTags;
    })
  );

  const isFiltered = $derived(searchQuery.trim().length > 0 || selectedTags.length > 0);
</script>

<svelte:head>
  <title>Research & Knowledge | SwISD</title>
  <meta name="description" content="Scientific knowledge hub for SwISD CRDT proofs, Merkle-DAG integrity, and cryptographic primitives." />
</svelte:head>

<section id="research-hub">
  <div class="container">
    <!-- Ultra-slim, constrained header layout -->
    <header class="mb-10 max-w-4xl mx-auto">

      <div class="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <!-- Search bar strictly sized to w-72 to match MultiSelect -->
        <div class="w-72">
          <label for="knowledge-search" class="block text-xs font-mono uppercase tracking-widest text-(--text-muted) mb-2">Search</label>
          <input
            id="knowledge-search"
            type="text"
            placeholder="Search..."
            class="w-full px-4 h-10 rounded-xl bg-(--surface) border border-(--border) text-(--text) font-mono text-sm transition-colors placeholder:text-(--text-muted) hover:border-(--color-lime) focus:outline-none focus:ring-2 focus:ring-(--color-lime)/50"
            bind:value={searchQuery}
          />
        </div>

        {#if allTags.length > 0}
          <div class="w-72">
            <MultiSelect 
              options={allTags} 
              bind:selected={selectedTags} 
              placeholder="All Topics" 
              label="Filter by topic"
            />
          </div>
        {/if}
      </div>

      <!-- Dynamic counter and inline clear action -->
      <div class="mt-6 flex items-center gap-4">
        <p class="text-sm font-mono text-(--text-muted)" aria-live="polite">
          Showing {filteredEntries.length} of {data.entries.length} entries.
        </p>

        <!-- Invisible placeholder when unfiltered reserves layout space to prevent jump -->
        <button
          type="button"
          class="text-xs font-mono text-(--color-lime) hover:underline {isFiltered ? '' : 'invisible'}"
          onclick={clearFilters}
          disabled={!isFiltered}
        >
          Clear filters
        </button>
      </div>
    </header>

    {#if filteredEntries.length === 0}
      <div class="section-desc" style="border: 1px dashed var(--border); padding: 3rem 2rem; border-radius: var(--radius-lg); text-align: center; max-width: 56rem; margin: 0 auto;">
        {#if data.entries.length === 0}
          No knowledge entries found. 
          <br /><br />
          Ensure you have created at least one markdown file in 
          <code style="background: var(--color-lime-dim); color: var(--color-lime); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: var(--font-mono);">site/src/lib/content/knowledge/</code>
        {:else}
          No entries match your search for "<strong class="text-lime">{searchQuery}</strong>".
          <br /><br />
          <button 
            type="button"
            class="text-xs font-mono text-(--color-lime) hover:underline" 
            onclick={clearFilters}
          >
            Clear filters
          </button>
        {/if}
      </div>
    {:else}
      <ul class="knowledge-grid" role="list">
        {#each filteredEntries as entry (entry.slug)}
          <li>
            <a
              href="/research/{entry.slug}"
              class="knowledge-card"
            >
              <div class="flex flex-wrap gap-2 mb-4">
                {#each entry.tags as tag}
                  <span class="tag-lime">{tag}</span>
                {/each}
              </div>
              <h2 class="card-title">{entry.title}</h2>
              <p class="card-abstract" title={entry.abstract}>
                {entry.abstract}
              </p>
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