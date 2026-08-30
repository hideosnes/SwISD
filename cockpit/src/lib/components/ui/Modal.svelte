<!--
1. Relative path: cockpit/src/lib/components/ui/Modal.svelte
2. Description: Modal dialog primitive with an accessible, decoupled backdrop.
3. Expects: Open state, title, and content snippets.
4. Provides: A themed, accessible modal dialog that strictly obeys the Cascade Layer Doctrine and Svelte 5 a11y rules.
-->

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
    // Ensure the click originated from the backdrop button itself
    if (e.target === e.currentTarget) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-root" class:open>
  <!-- The backdrop is a distinct interactive element to satisfy a11y without trapping focus -->
  <button
    type="button"
    class="backdrop"
    onclick={handleBackdropClick}
    aria-label="Close dialog"
    tabindex="-1"
  ></button>
  
  <!-- The modal itself is non-interactive at the wrapper level -->
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
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

<style>
  @layer components {
    .modal-root {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--duration-normal) var(--ease);
    }

    .modal-root.open {
      opacity: 1;
      pointer-events: auto;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: var(--backdrop-bg, rgba(0, 0, 0, 0.5));
      border: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
    }

    .backdrop:focus-visible {
      outline: none; /* Hide focus ring on backdrop; focus belongs inside the dialog */
    }

    .modal {
      position: relative;
      z-index: 2;
      width: min(440px, 100%);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--r-sm);
      box-shadow: var(--shadow-modal, 0 0 40px rgba(0, 0, 0, 0.3));
      transform: translateY(14px) scale(0.98);
      transition: transform var(--duration-normal) var(--ease);
      overflow: hidden;
      outline: none;
    }

    .modal-root.open .modal {
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
  }
</style>