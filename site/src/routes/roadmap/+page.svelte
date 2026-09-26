<!--
1. Relative path: site/src/routes/roadmap/+page.svelte
2. Description: The Roadmap route, displaying the project timeline with progressive disclosure.
3. Expects: Svelte 5 runes, roadmap content barrel, and canonical UI primitives.
4. Provides: An immersive, gradient-framed hero section followed by a strictly typed, interactive timeline.
-->
<script lang="ts">
  import { RoadmapTimeline, RoadmapModal, Arrow } from '$lib/components/ui';
  import { roadmapEntries, type RoadmapEntry } from '$lib/content/roadmap';

  let selectedEntry = $state<RoadmapEntry | null>(null);
  let modalOpen = $state(false);
  
  const INITIAL_CHUNK = 8;
  let visibleCount = $state(INITIAL_CHUNK);
  const displayedEntries = $derived(roadmapEntries.slice(-visibleCount));
  const hasMore = $derived(visibleCount < roadmapEntries.length);

  function handleSelect(entry: RoadmapEntry) { selectedEntry = entry; modalOpen = true; }
  function handleClose() { modalOpen = false; }
  function loadMore() { visibleCount += 8; }
</script>

<svelte:head>
  <title>Roadmap | SwISD</title>
  <meta name="description" content="The SwISD project timeline. From cryptographic primitives to inter-swarm routing." />
</svelte:head>

<section id="roadmap-hero" class="cta-band reveal">
  <div class="container">
    <span class="section-label">Roadmap</span>
    <h1 class="section-title">
      Our story:<br />
      <span class="lime">Step by step</span>
    </h1>
    <p class="section-desc mx-auto mb-8">
      Infrastructure isn't built in a day. It is forged through cryptographic proofs, tested in the crucible of edge networks, and validated by the swarm. Here is the blueprint of our evolution, from the first local gossip protocol to the emergence of inter-swarm diplomats.
    </p>
    <a href="#timeline-end" class="btn-secondary" aria-label="Scroll to the origin of the timeline">
      Scroll down <Arrow direction="down" />
    </a>    
  </div>
</section>

<section id="roadmap-timeline-section">
  <div class="container">
    <!-- Wrapper allows us to conditionally style the timeline spine based on progressive disclosure state -->
    <div class="roadmap-timeline-wrapper" class:has-more={hasMore}>
      <RoadmapTimeline entries={displayedEntries} onSelect={handleSelect} />
    </div>
    
    {#if hasMore}
      <div class="reveal text-center mt-12">
        <button type="button" class="btn-secondary" onclick={loadMore}>
          Reveal More Milestones
        </button>
      </div>
    {/if}
    
    <div id="timeline-end"></div>
  </div>
</section>

<RoadmapModal entry={selectedEntry} isOpen={modalOpen} onClose={handleClose} />