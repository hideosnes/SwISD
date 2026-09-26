<!--
1. Relative path: site/src/lib/components/ui/RoadmapModal.svelte
2. Description: Editorial modal for roadmap entries over the canonical Modal primitive, with lazy random artwork.
3. Expects: Svelte 5 runes, strict TypeScript, RoadmapEntry | null.
4. Provides: 3/3 editorial modal: square media left; fixed header (time label + white headline), scrollable description, thin footer with normal-type credit prefix and lime-label links.
-->
<script lang="ts">
  import Modal from './Modal.svelte';
  import Arrow from './Arrow.svelte';
  import { loadRandomArtwork, type RoadmapEntry } from '$lib/content/roadmap';

  let {
    entry,
    isOpen,
    onClose
  }: {
    entry: RoadmapEntry | null;
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  let artworkUrl = $state<string>('');

  // Random artwork per open; loads ONLY the picked asset. Client-side, prerender-safe.
  $effect(() => {
    if (!isOpen || entry === null) {
      artworkUrl = '';
      return;
    }
    const override = entry.image;
    if (override !== undefined) {
      artworkUrl = override;
      return;
    }
    let cancelled = false;
    void loadRandomArtwork().then((url) => {
      if (!cancelled) artworkUrl = url;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if entry}
  <Modal isOpen={isOpen} onClose={onClose} ariaLabel={entry.title} size="media">
    {#snippet media()}
      {#if artworkUrl !== ''}
        <img src={artworkUrl} alt="" aria-hidden="true" />
      {:else}
        <div class="w-full h-full bg-(--bg)" aria-hidden="true"></div>
      {/if}
    {/snippet}

    {#snippet header()}
      <span class="font-mono text-[0.8125rem] text-(--color-lime) uppercase tracking-[0.12em] block mb-2">
        {entry.time}
      </span>
      <h3 class="font-mono font-bold text-[1.75rem] leading-tight tracking-tight text-(--text)">
        {entry.title}
      </h3>
    {/snippet}

    {#snippet children()}
      <p class="text-[1.0625rem] leading-[1.7] text-(--text-muted)">
        {entry.description}
      </p>
    {/snippet}

    {#snippet footer()}
      <div class="flex flex-wrap items-center gap-x-2.5 gap-y-2 w-full">
        <!-- Normal body type: quiet prefix -->
        <span class="font-sans text-sm normal-case tracking-normal text-(--text-muted)">Artwork by:</span>

        <!-- Lime-label voice: artist credit, external -->
        <a
          href="https://hideosnes.online"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-(--color-lime) font-semibold hover:opacity-80 transition-opacity"
        >
          Hidéo Snes
          <Arrow direction="external" />
        </a>

        <span class="font-sans text-sm text-(--text-muted) select-none" aria-hidden="true">/</span>

        <!-- Lime-label voice: internal case-studies anchor -->
        <a
          href="/case-studies/#deep-histories"
          class="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-(--color-lime) font-semibold hover:opacity-80 transition-opacity"
        >
          Case Study
          <Arrow direction="right" />
        </a>

        {#if entry.link}
          <a
            href={entry.link.href}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-(--color-lime) font-semibold hover:opacity-80 transition-opacity ml-auto"
          >
            {entry.link.label}
            <Arrow direction="external" />
          </a>
        {/if}
      </div>
    {/snippet}
  </Modal>
{/if}