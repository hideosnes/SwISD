<!-- 1. Relative path: cockpit/src/lib/components/ui/Card.svelte
     2. Description: Expandable card primitive for peer/model display.
     3. Expects: Title, optional subtitle, and content snippets.
     4. Provides: A themed card with header, body, and footer slots. -->

<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    expandable?: boolean;
    children: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let {
    title,
    subtitle,
    expandable = false,
    children,
    footer,
  }: Props = $props();

  let expanded = $state(false);

  function toggle() {
    if (expandable) {
      expanded = !expanded;
    }
  }
</script>

<div class="card" class:expanded>
  <button
    class="card-head"
    onclick={toggle}
    aria-expanded={expanded}
    disabled={!expandable}
  >
    <div class="card-title">
      <strong>{title}</strong>
      {#if subtitle}
        <span class="card-subtitle mono">{subtitle}</span>
      {/if}
    </div>
    {#if expandable}
      <span class="mi" class:rotated={expanded}>expand_more</span>
    {/if}
  </button>

  <div class="card-body" class:hidden={!expanded && expandable}>
    {@render children()}
  </div>

  {#if footer && (!expandable || expanded)}
    <div class="card-foot">
      {@render footer()}
    </div>
  {/if}
</div>

<style>
  .card {
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: var(--surface);
    overflow: hidden;
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: rgba(255,45,149,.05);
    border: none;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    color: var(--text-1);
    font-family: var(--font-ui);
  }

  .card-head:disabled {
    cursor: default;
  }

  .card-title {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .card-title strong {
    font-size: 15px;
    font-weight: 700;
  }

  .card-subtitle {
    font-size: 10px;
    color: var(--text-3);
    letter-spacing: 0.04em;
  }

  .card-head .mi {
    transition: transform var(--duration-fast) var(--ease);
  }

  .card-head .mi.rotated {
    transform: rotate(180deg);
  }

  .card-body {
    padding: var(--space-lg);
    color: var(--text-2);
    font-size: 13px;
  }

  .card-body.hidden {
    display: none;
  }

  .card-foot {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid var(--border);
  }
</style>