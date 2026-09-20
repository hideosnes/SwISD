<!--
1. Relative path: site/src/routes/case-studies/+page.svelte
2. Description: The Case Studies archive route.
3. Expects: Svelte 5 runes, static prerendering, and the cases content barrel.
4. Provides: A filterable, sortable, chronological grid of project deployments.
-->
<script lang="ts">
  import { cases, type CaseIndustry, type CaseModality } from '$lib/content/cases';
  import { Button, FilterChip, CaseCard, MultiSelect, SegmentedControl } from '$lib/components/ui';

  type SortMode = 'alpha' | 'new' | 'old';
  const SORT_OPTIONS = [
    { value: 'alpha' as const, label: 'A–Z' },
    { value: 'new' as const, label: 'Newest' },
    { value: 'old' as const, label: 'Oldest' }
  ];

  const allIndustries = $derived(
    Array.from(new Set(cases.flatMap(c => c.industry)))
      .sort((a, b) => a.localeCompare(b))
  );
  const allModalities = $derived(
    Array.from(new Set(cases.flatMap(c => c.modalities)))
      .sort((a, b) => a.localeCompare(b))
  );
  const allYears = $derived(
    Array.from(new Set(cases.map(c => c.year))).sort((a, b) => b - a)
  );

  // MultiSelect binds to string arrays; Year remains a Set for FilterChips
  let selectedIndustries = $state<string[]>([]);
  let selectedModalities = $state<string[]>([]);
  let selectedYears = $state<Set<number>>(new Set());
  let sortMode = $state<SortMode>('alpha');

  function toggleYear(year: number) {
    const next = new Set(selectedYears);
    if (next.has(year)) next.delete(year);
    else next.add(year);
    selectedYears = next;
  }

  function clearFilters() {
    selectedIndustries = [];
    selectedModalities = [];
    selectedYears = new Set();
    sortMode = 'alpha';
  }

  const filteredCases = $derived(
    cases.filter(c => {
      const yearMatch = selectedYears.size === 0 || selectedYears.has(c.year);
      const indMatch = selectedIndustries.length === 0 || c.industry.some(ind => selectedIndustries.includes(ind));
      const modMatch = selectedModalities.length === 0 || c.modalities.some(mod => selectedModalities.includes(mod));
      return yearMatch && indMatch && modMatch;
    })
  );

  // Secondary derivation: Sort the filtered subset without mutating the source array.
  // Alphabetical fallback on year-ties prevents grid jitter.
  const displayedCases = $derived(
    [...filteredCases].sort((a, b) => {
      if (sortMode === 'alpha') return a.title.localeCompare(b.title);
      if (sortMode === 'new') return b.year - a.year || a.title.localeCompare(b.title);
      return a.year - b.year || a.title.localeCompare(b.title);
    })
  );

  const isFiltered = $derived(selectedIndustries.length > 0 || selectedModalities.length > 0 || selectedYears.size > 0);
</script>

<section class="py-24">
  <div class="container mx-auto px-4">
    <header class="mb-16 text-center">
      <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-(--text) mb-4 font-mono">Case Studies</h1>
      <p class="text-lg text-(--text-muted) max-w-2xl mx-auto">
        A chronological archive of deployments, research, and installations.
      </p>
    </header>

    <div class="mb-12">
      <!-- Filter bar: label-on-top groups, separated by standard flex gaps. -->
      <div class="flex flex-wrap items-start gap-x-5 gap-y-8">
        <div class="flex flex-col gap-3">
          <h2 class="text-xs font-mono uppercase tracking-widest text-(--text-muted)">Year</h2>
          <div class="flex flex-wrap gap-2">
            {#each allYears as year}
              <FilterChip
                label={String(year)}
                active={selectedYears.has(year)}
                onclick={() => toggleYear(year)}
              />
            {/each}
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <MultiSelect 
            options={allIndustries} 
            bind:selected={selectedIndustries} 
            placeholder="All Industries" 
            label="Industry"
          />
        </div>

        <div class="flex flex-col gap-3">
          <MultiSelect 
            options={allModalities} 
            bind:selected={selectedModalities} 
            placeholder="All Modalities" 
            label="Modalities"
          />
        </div>

        <div class="flex flex-col gap-3">
          <h2 class="text-xs font-mono uppercase tracking-widest text-(--text-muted)">Sort</h2>
          <SegmentedControl 
            options={SORT_OPTIONS} 
            bind:selected={sortMode} 
            ariaLabel="Sort order" 
            variant="compact"
          />
        </div>
      </div>

      <!-- Always mounted: prevents vertical layout jump when filters activate. -->
      <div class="mt-8 flex items-center gap-4">
        <p class="text-sm text-(--text-muted)" aria-live="polite">
          Showing {displayedCases.length} of {cases.length} projects.
        </p>

        <!-- Invisible placeholder when unfiltered reserves layout space. -->
        <button
          type="button"
          class="text-xs font-mono text-(--color-lime) hover:underline {isFiltered ? '' : 'invisible'}"
          onclick={clearFilters}
          disabled={!isFiltered}
        >
          Clear filters
        </button>
      </div>
    </div>

    {#if displayedCases.length === 0}
      <div class="text-center py-24 border border-dashed border-(--border) rounded-2xl">
        <p class="text-(--text-muted) font-mono">No projects match the current filters.</p>
        <Button variant="secondary" onclick={clearFilters} class="mt-6">Clear filters</Button>
      </div>
    {:else}
      <!-- Split Horizontal Grid: 1 col on mobile/tablet, 2 cols on xl -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {#each displayedCases as project (project.slug)}
          <CaseCard {project} layout="split" />
        {/each}
      </div>
    {/if}
  </div>
</section>