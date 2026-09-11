<!--
1. Relative path: site/src/routes/roadmap/+page.svelte
2. Description: Interactive roadmap route.
3. Expects: Svelte 5 runes, SSR-safe DOM access.
4. Provides: Full vertical timeline with rich modal details and a hero jump-to-origin anchor.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { RoadmapTimeline, RoadmapModal, Arrow } from '$lib/components/ui';
  import { roadmapEntries, type RoadmapEntry } from '$lib/content/roadmap';

  let revealObserver: IntersectionObserver | null = null;
  let selectedEntry = $state<RoadmapEntry | null>(null);
  let modalOpen = $state(false);

  function handleSelect(entry: RoadmapEntry) {
    selectedEntry = entry;
    modalOpen = true;
  }

  function handleClose() {
    modalOpen = false;
  }

  onMount(() => {
    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver?.observe(el));
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    revealObserver?.disconnect();
  });
</script>

<svelte:head>
  <title>Roadmap | SwISD</title>
  <meta name="description" content="The SwISD project timeline. From cryptographic primitives to inter-swarm routing." />
</svelte:head>

<section id="roadmap-hero">
  <div class="container">
    <div class="reveal">
      <span class="section-label">Roadmap</span>
      <h1 class="section-title">
        Building infrastructure.<br />
        <span class="lime">Growing knowledge.</span>
      </h1>
      <p class="section-desc" style="margin: 0 auto;">
        Every milestone is a mathematical proof. From the bedrock of cryptographic primitives to the emergence of inter-swarm diplomats, this is how the swarm evolves.
      </p>
      <a href="#timeline-end" class="btn-secondary timeline-jump" aria-label="Scroll to the origin of the timeline">
        Scroll down <Arrow direction="down" />
      </a>    
    </div>
  </div>
</section>

<section id="roadmap-timeline-section">
  <div class="container">
    <RoadmapTimeline entries={roadmapEntries} onSelect={handleSelect} />
    <div id="timeline-end"></div>
  </div>
</section>

<RoadmapModal entry={selectedEntry} isOpen={modalOpen} onClose={handleClose} />