<!--
1. Relative path: site/src/routes/docs/+page.svelte
2. Description: Documentation hub for SwISD.
3. Expects: None.
4. Provides: A placeholder documentation interface with empty filters and a coming soon disclaimer.
-->
<script lang="ts">
  import { MultiSelect } from '$lib/components/ui';
</script>

<svelte:head>
  <title>Docs | SwISD</title>
  <meta name="description" content="SwISD documentation, guides, and API references." />
</svelte:head>

<section id="docs-hub">
  <div class="container">
    <header class="mb-10 max-w-4xl mx-auto">
      <div class="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div class="w-72">
          <label for="docs-search" class="block text-xs font-mono uppercase tracking-widest text-(--text-muted) mb-2">Search</label>
          <input
            id="docs-search"
            type="text"
            placeholder="Search..."
            disabled
            class="w-full px-4 h-10 rounded-xl bg-(--surface) border border-(--border) text-(--text) font-mono text-sm transition-colors placeholder:text-(--text-muted) opacity-50 cursor-not-allowed"
          />
        </div>

        <div class="w-72">
          <MultiSelect 
            options={[]} 
            selected={[]} 
            placeholder="All Topics" 
            label="Filter by topic"
          />
        </div>
      </div>
    </header>

    <div class="max-w-4xl mx-auto text-center py-20">
      <p class="text-(--text-muted) font-mono text-lg tracking-wide">Coming soon...</p>
    </div>
  </div>
</section>