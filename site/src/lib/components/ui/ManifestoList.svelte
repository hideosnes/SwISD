<!--
1. Relative path: site/src/lib/components/ui/ManifestoList.svelte
2. Description: Token-themed editorial manifesto list for principle/value statements.
3. Expects: A readonly list of title/description items.
4. Provides: Accessible semantic list with strong visual hierarchy and no card chrome.
-->
<script lang="ts">
  type ManifestoItem = {
    readonly title: string;
    readonly text: string;
  };

  let {
    items,
    ariaLabel
  }: {
    items: readonly ManifestoItem[];
    ariaLabel: string;
  } = $props();
</script>

<ul class="manifesto-list" aria-label={ariaLabel}>
  {#each items as item (item.title)}
    <li class="manifesto-item">
      <span class="manifesto-mark" aria-hidden="true">✦</span>
      <div class="manifesto-copy">
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </li>
  {/each}
</ul>

<style>
  .manifesto-list {
    display: flex;
    flex-direction: column;
    gap: 2.25rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .manifesto-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .manifesto-mark {
    color: var(--color-lime);
    font-size: 1.15rem;
    line-height: 1.45;
    filter: drop-shadow(0 0 10px rgba(84, 255, 126, 0.28));
  }

  .manifesto-copy {
    max-width: 560px;
  }

  .manifesto-copy h3 {
    color: var(--color-lime);
    font-family: var(--font-mono);
    font-size: clamp(1.25rem, 2vw, 1.65rem);
    line-height: 1.15;
    margin-bottom: 0.55rem;
    letter-spacing: -0.025em;
  }

  .manifesto-copy p {
    color: var(--color-gray-400);
    font-size: 1rem;
    line-height: 1.75;
  }

  @media (max-width: 768px) {
    .manifesto-list {
      gap: 1.85rem;
    }

    .manifesto-item {
      gap: 0.85rem;
    }

    .manifesto-copy {
      max-width: none;
    }
  }
</style>