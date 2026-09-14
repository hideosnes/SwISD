<script lang="ts">
  import { RoadmapTimeline, RoadmapModal, Arrow } from '$lib/components/ui';
  import { roadmapEntries, type RoadmapEntry } from '$lib/content/roadmap'; // Keep your barrel imports!

  let selectedEntry = $state<RoadmapEntry | null>(null);
  let modalOpen = $state(false);
  
  const INITIAL_CHUNK = 8;
  let visibleCount = $state(INITIAL_CHUNK);
  const displayedEntries = $derived(roadmapEntries.slice(-visibleCount));

  function handleSelect(entry: RoadmapEntry) { selectedEntry = entry; modalOpen = true; }
  function handleClose() { modalOpen = false; }
  function loadMore() { visibleCount += 8; }
</script>

<svelte:head>
  <title>Roadmap | SwISD</title>
  <meta name="description" content="The SwISD project timeline. From cryptographic primitives to inter-swarm routing." />
</svelte:head>

<!-- No svelte:boundary needed anymore. The ghost is dead. -->
<section id="roadmap-hero" class="reveal">
  <div class="container">
    <span class="section-label">Roadmap</span>
    <h1 class="section-title">
      Building infrastructure.<br />
      <span class="lime">Growing knowledge.</span>
    </h1>
    <p class="section-desc mx-auto">
      Every milestone is a mathematical proof. From the bedrock of cryptographic primitives to the emergence of inter-swarm diplomats, this is how the swarm evolves.
    </p>
    <a href="#timeline-end" class="btn-secondary timeline-jump" aria-label="Scroll to the origin of the timeline">
      Scroll down <Arrow direction="down" />
    </a>    
  </div>
</section>

<section id="roadmap-timeline-section">
  <div class="container">
    <RoadmapTimeline entries={displayedEntries} onSelect={handleSelect} />
    
    {#if visibleCount < roadmapEntries.length}
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