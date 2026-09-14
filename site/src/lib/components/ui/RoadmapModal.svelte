<!--
1. Relative path: site/src/lib/components/ui/RoadmapModal.svelte
2. Description: Rich editorial modal for roadmap entries with a flush 1/3:2/3 image+content layout.
3. Expects: A RoadmapEntry, an isOpen state, and the Modal primitive's flush variant.
4. Provides: Edge-to-edge imagery that fills the column, mandatory date/title/paragraph, and a persistent artist credit bar with named internal and external links.
-->
<script lang="ts">
  import Modal from './Modal.svelte';
  import Arrow from './Arrow.svelte';
  import { randomGalleryImage, type GalleryImage } from '$lib/assets';
  import type { RoadmapEntry } from '$lib/content/roadmap';

  let {
    entry,
    isOpen,
    onClose
  }: {
    entry: RoadmapEntry | null;
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  let currentImage = $state<GalleryImage | null>(null);
  let imageUrl = $state('');
  let isLoadingImage = $state(false);
  let loadGeneration = 0;

  $effect(() => {
    if (!isOpen) {
      currentImage = null;
      imageUrl = '';
      isLoadingImage = false;
      return;
    }
    if (entry === null) return;

    const picked = randomGalleryImage();
    if (picked === null) return;

    const generation = ++loadGeneration;
    currentImage = picked;
    isLoadingImage = true;

    picked
      .load()
      .then((module) => {
        if (!isOpen || generation !== loadGeneration) return;
        imageUrl = module.default;
      })
      .catch((error: unknown) => {
        // Narrow the unknown error to a string message
        const msg = error instanceof Error ? error.message : String(error);
        
        // Silently ignore Vite HMR module fetch failures during dev hard-reloads.
        // This prevents the unhandled rejection from crashing the Svelte 5 runtime.
        if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('importing a module')) {
          return;
        }
        
        console.error('Failed to load gallery artwork', msg);
      })
      .finally(() => {
        if (isOpen && generation === loadGeneration) isLoadingImage = false;
      });
  });
</script>

<Modal {isOpen} {onClose} variant="flush" ariaLabel={entry?.title ?? 'Roadmap details'}>
  {#if entry}
    <div class="roadmap-modal-body">
      <div class="modal-editorial">
        <div class="modal-image-col">
          {#if currentImage !== null && imageUrl !== ''}
            <img
              class="modal-image"
              src={imageUrl}
              alt={`Artwork by ${currentImage.credit.artist}, ${currentImage.credit.year}`}
              loading="lazy"
              decoding="async"
            />
          {:else if isLoadingImage}
            <div class="modal-image-placeholder" aria-hidden="true">
              <span class="loading-spinner"></span>
            </div>
          {/if}
        </div>
        <div class="modal-content-col">
          <span class="modal-time">{entry.time}</span>
          <h2 class="modal-title">{entry.title}</h2>
          <p class="modal-desc">{entry.description}</p>
          
          {#if currentImage !== null}
            <div class="modal-credit-bar">
              <a 
                href={currentImage.credit.websiteLink.href} 
                class="modal-credit-artist" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {currentImage.credit.artist}, {currentImage.credit.year}
                <Arrow direction="external" class="credit-arrow" />
              </a>
              <span class="modal-credit-divider">/</span>
              <a href={currentImage.credit.projectLink.href} class="modal-credit-project">
                {currentImage.credit.projectLink.label}
                <Arrow direction="right" class="credit-arrow" />
              </a>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</Modal>

<style>
  @layer components {
    .roadmap-modal-body {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: stretch;
    }

    .modal-editorial {
      display: grid;
      grid-template-columns: 1fr 2fr;
      width: 100%;
      height: 100%;
      align-items: stretch;
    }

    @media (max-width: 768px) {
      .modal-editorial {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }
      .modal-image-col {
        aspect-ratio: 16 / 9;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      }
      .modal-content-col {
        padding: 1.5rem;
      }
    }

    .modal-image-col {
      position: relative;
      overflow: hidden;
      background-color: var(--color-bg-deep);
      /* Removed aspect-ratio so it stretches to fill the modal height, allowing the image to cover everything */
    }

    .modal-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .modal-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-gray-400);
    }

    .loading-spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid var(--color-border-hover);
      border-top-color: var(--color-lime);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .modal-content-col {
      padding: 2.5rem 2rem 2rem 2rem; /* Aesthetically pleasing top padding */
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow-y: auto;
    }

    .modal-time {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--color-lime); /* Lime green label */
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .modal-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-white);
      margin: 0;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .modal-desc {
      font-size: 1.0625rem;
      color: var(--color-gray-400);
      line-height: 1.7;
      margin: 0;
    }

    .modal-credit-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.5rem 1rem;
      margin-top: 1rem;
    }

    .modal-credit-artist {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--color-lime); /* Lime green */
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .modal-credit-artist:hover,
    .modal-credit-artist:focus-visible {
      text-decoration: underline;
    }

    .modal-credit-divider {
      color: var(--color-gray-500);
      font-size: 0.8125rem;
    }

    .modal-credit-project {
      font-size: 1rem;
      color: var(--color-lime); /* Lime green */
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 500;
    }

    .modal-credit-project:hover,
    .modal-credit-project:focus-visible {
      text-decoration: underline;
      opacity: 0.8;
    }

    :global(.credit-arrow) {
      width: 1em;
      height: 1em;
      flex-shrink: 0;
    }
  }
</style>