<!--
1. Relative path: site/src/lib/components/ui/Modal.svelte
2. Description: Accessible modal dialog primitive with an optional flush variant for edge-to-edge media.
3. Expects: Svelte 5 runes, strict a11y, focus trapping, keyboard parity.
4. Provides: A reusable modal container with backdrop, lime-circle close button, ESC dismissal, and proper focus management.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    isOpen,
    onClose,
    children,
    ariaLabel = 'Modal dialog',
    variant = 'default'
  }: {
    isOpen: boolean;
    onClose: () => void;
    children: Snippet;
    ariaLabel?: string;
    variant?: 'default' | 'flush';
  } = $props();

  let modalRef: HTMLDivElement | undefined = $state();
  let previousActiveElement: HTMLElement | null = null;

  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  }

  function handleInnerKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
    if (event.key === 'Tab' && modalRef) {
      const focusableElements = modalRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  $effect(() => {
    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement;
      modalRef?.focus();
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = '';
        previousActiveElement?.focus();
      };
    }
  });
</script>

{#if isOpen}
  <div
    class="ui-overlay"
    role="button"
    tabindex="0"
    aria-label="Close modal overlay"
    onclick={onClose}
    onkeydown={handleOverlayKeydown}
  >
    <div
      class="ui-modal-content"
      class:flush={variant === 'flush'}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      bind:this={modalRef}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        e.stopPropagation();
        handleInnerKeydown(e);
      }}
    >
      <button
        type="button"
        class="ui-modal-close"
        aria-label="Close modal"
        onclick={onClose}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {@render children()}
    </div>
  </div>
{/if}