<!--
1. Relative path: site/src/lib/components/ui/RoadmapModal.svelte
2. Description: Rich editorial modal for roadmap entries with a flush 1/3:2/3 image+content layout.
3. Expects: A RoadmapEntry, an isOpen state, and the Modal primitive's flush variant.
4. Provides: Edge-to-edge square imagery, mandatory date/title/paragraph, and an optional bottom-right CTA.
-->
<script lang="ts">
  import Modal from './Modal.svelte';
  import Arrow from './Arrow.svelte';
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
</script>

<Modal {isOpen} {onClose} variant="flush" ariaLabel={entry?.title ?? 'Roadmap details'}>
  {#if entry}
    <div class="roadmap-modal-body">
      <div class="modal-editorial">
        <div class="modal-image-col">
          <img class="modal-image" src={entry.image} alt="" loading="lazy" decoding="async" />
        </div>
        <div class="modal-content-col">
          <span class="modal-time">{entry.time}</span>
          <h2 class="modal-title">{entry.title}</h2>
          <p class="modal-desc">{entry.description}</p>
          {#if entry.link}
            <a href={entry.link.href} class="btn-primary modal-link">
              {entry.link.label} <Arrow direction="right" />
            </a>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</Modal>