<!-- 1. Relative path: cockpit/src/lib/components/ui/Modal.svelte
     2. Description: Modal dialog primitive with backdrop.
     3. Expects: Open state, title, and content snippets.
     4. Provides: A themed, accessible modal dialog. -->

<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    children: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { open, title, onclose, children, footer }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose();
    }
  }
</script>

{#if open}
  <div
    class="backdrop"
    class:open
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="modal">
      <div class="modal-head">
        <h3 id="modal-title">{title}</h3>
        <button class="btn btn--secondary btn--icon" onclick={onclose} aria-label="Close">
          <Icon name="close" size="sm" />
        </button>
      </div>
      <div class="modal-body">
        {@render children()}
      </div>
      {#if footer}
        <div class="modal-foot">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(5,6,10,.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-normal) var(--ease);
  }

  .backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .modal {
    width: min(440px, 100%);
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-sm);
    box-shadow: 0 0 40px rgba(255,45,149,.18);
    transform: translateY(14px) scale(0.98);
    transition: transform var(--duration-normal) var(--ease);
    overflow: hidden;
  }

  .backdrop.open .modal {
    transform: translateY(0) scale(1);
  }

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg) var(--space-xl);
    border-bottom: 1px solid var(--border);
  }

  .modal-head h3 {
    font-size: 17px;
    font-weight: 700;
  }

  .modal-body {
    padding: var(--space-xl);
    color: var(--text-2);
    font-size: 14px;
  }

  .modal-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-lg) var(--space-xl);
    border-top: 1px solid var(--border);
  }

  .btn--icon {
    padding: 10px;
  }
</style>