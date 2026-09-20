<!--
1. Relative path: site/src/lib/components/ui/Modal.svelte
2. Description: Accessible modal dialog primitive. Fullscreen below 768px, centered card above. Icon-only lime-X circular dismiss control top-right, rendered above all site layers (z-2000).
3. Expects: Svelte 5 runes, strict TypeScript, snippet-based composition.
4. Provides: Focus-trapped, scroll-locking, focus-restoring dialog. Fixed header, scrollable content well, thin fixed footer. Sizes: text (2/3), appliance (fluid), media (3/3 with 400px square media). Mobile: 100dvh edge-to-edge.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    isOpen,
    onClose,
    ariaLabel,
    size = 'text' as 'text' | 'media' | 'appliance',
    children,
    media,
    header,
    footer
  }: {
    isOpen: boolean;
    onClose: () => void;
    ariaLabel: string;
    size?: 'text' | 'media' | 'appliance';
    children: Snippet;
    media?: Snippet;
    header?: Snippet;
    footer?: Snippet;
  } = $props();

  let dialogEl: HTMLDivElement | undefined = $state();
  let closeEl: HTMLButtonElement | undefined = $state();

  const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Scroll lock + initial focus + focus restoration, all with guaranteed cleanup.
  $effect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    const restoreTarget =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const raf = requestAnimationFrame(() => {
      closeEl?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
      restoreTarget?.focus();
    };
  });

  function handleOverlayKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  function handleDialogKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }

    // Minimal Tab trap: wrap focus within the dialog so it can never escape into the page behind.
    if (e.key === 'Tab' && dialogEl) {
      const focusable = Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialogEl)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    e.stopPropagation();
  }

  // Mobile (<768px): fullscreen, 100dvh (iOS-safe). Desktop: semantic sizes, 90vh cap.
  const containerClasses = $derived(
    size === 'media'
      ? 'w-full md:max-w-[1200px] h-[100dvh] md:h-[400px] flex-col md:flex-row'
      : size === 'appliance'
        ? 'w-full md:w-auto md:max-w-md h-[100dvh] md:h-auto flex-col'
        : 'w-full md:w-2/3 md:max-w-2xl h-[100dvh] md:h-auto flex-col'
  );
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-[2000] flex items-center justify-center md:p-4 bg-(--bg)/80 backdrop-blur-sm"
    role="button"
    tabindex="0"
    aria-label="Close modal overlay"
    onclick={onClose}
    onkeydown={handleOverlayKeydown}
  >
    <!-- `flex` is mandatory here; flex-col/md:flex-row are direction-only and do nothing without it. -->
    <div
      bind:this={dialogEl}
      class="flex {containerClasses} relative bg-(--surface) border-0 md:border border-(--border) rounded-none md:rounded-2xl shadow-2xl overflow-hidden md:max-h-[90vh]"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleDialogKeydown}
    >
      <!-- Dismiss control: lone lime X in a circle. Icon-only — the aria-label carries the name. -->
      <button
        bind:this={closeEl}
        type="button"
        aria-label="Close dialog"
        onclick={onClose}
        class="absolute top-4 right-4 z-30 flex items-center justify-center w-10 h-10 rounded-full border border-(--color-lime) bg-(--bg) text-(--color-lime) shadow-[var(--shadow-glow-lime)] transition-transform hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-(--color-lime) focus-visible:outline-offset-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>

      {#if media}
        <div class="w-full md:w-[400px] md:h-full h-[200px] shrink-0 bg-(--bg) relative overflow-hidden">
          <div class="absolute inset-0 [&>*]:w-full [&>*]:h-full [&>*]:object-cover">
            {@render media()}
          </div>
        </div>
      {/if}

      <div class="flex-1 flex flex-col min-w-0 min-h-0">
        <!-- Fixed header zone (label + headline); never scrolls. pr-20 clears the dismiss circle. -->
        {#if header}
          <div class="shrink-0 px-8 pt-8 pr-20">
            {@render header()}
          </div>
        {/if}

        <!-- Scrollable content well -->
        <div class="flex-1 overflow-y-auto min-h-0 px-8 py-8">
          {@render children()}
        </div>

        <!-- Thin fixed footer zone; never scrolls -->
        {#if footer}
          <div class="shrink-0 border-t border-(--border) py-3 px-6 bg-(--surface)">
            {@render footer()}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}