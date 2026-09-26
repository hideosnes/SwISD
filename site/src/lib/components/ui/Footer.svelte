<!--
1. Relative path: site/src/lib/components/ui/Footer.svelte
2. Description: Global site footer with utility navigation, back-to-top action, newsletter modal, and cross-route anchor resolution.
3. Expects: Svelte 5 runes, SSR-safe DOM access, $app/state for current path.
4. Provides: A reusable footer primitive with semantic <nav>, external link parity, and a programmatic scroll-to-top.
-->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import Arrow from './Arrow.svelte';
  import Button from './Button.svelte';
  import Modal from './Modal.svelte';
  import { swisdLogo } from '$lib/assets';
  import { page } from '$app/state';
  import { uiStore } from '$lib/stores/ui.svelte.js';

  const GITHUB = 'https://github.com/hideosnes/swisd';
  const HOMAHUKI = 'https://www.homahuki.eu';

  let currentYear = $state(new Date().getFullYear());
  let isNewsletterModalOpen = $state(false);
  let isSubmitting = $state(false);

  function scrollToTop() {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openNewsletterModal() {
    isNewsletterModalOpen = true;
  }

  function closeNewsletterModal() {
    isNewsletterModalOpen = false;
  }

  const handleNewsletterSubmit: SubmitFunction = ({ formElement }) => {
    isSubmitting = true;
    
    return async ({ result }) => {
      if (result.type === 'success') {
        uiStore.addToast('Welcome to the swarm. Check your inbox.', 'success');
        formElement.reset();
        closeNewsletterModal();
      } else if (result.type === 'failure') {
        const errorData = result.data as { error?: string } | undefined;
        const message = errorData?.error ?? 'Subscription failed. Please try again.';
        uiStore.addToast(message, 'error');
      }
      isSubmitting = false;
    };
  };
</script>

<footer>
  <div class="container">
    <div class="footer-utility">
      <span class="built-in-austria">Built with ❤️ in Austria.</span>
      <button type="button" class="back-to-top" onclick={scrollToTop}>
        <Arrow direction="up" /> Back to top
      </button>
    </div>
    <div class="footer-content">
      <img src={swisdLogo} alt="SwISD" class="footer-logo" />
      <nav class="footer-links" aria-label="Footer navigation">
        <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub <Arrow direction="external" /></a>
        <button type="button" class="footer-link-btn" onclick={openNewsletterModal}>Newsletter <Arrow direction="right" /></button>
        <a href="/pricing#pricing-license">License <Arrow direction="right" /></a>
        <a href={HOMAHUKI} target="_blank" rel="noopener noreferrer">homahuki.eu <Arrow direction="external" /></a>
      </nav>
      <span class="footer-copy">
        <span class="copyright-symbol">&copy;</span> {currentYear} Homahuki GmbH. Open Source.
      </span>
    </div>
  </div>
</footer>

<!-- Newsletter Modal -->
<Modal
  isOpen={isNewsletterModalOpen}
  onClose={closeNewsletterModal}
  ariaLabel="Subscribe to the SwISD newsletter"
>
  <div class="newsletter-modal-body">
    <h3 class="modal-title">Join the swarm</h3>
    <p class="modal-desc">
      Get updates on SwISD development, research, and community events. No spam, no central coordinator.
    </p>

    <form method="POST" action="/?/subscribe" use:enhance={handleNewsletterSubmit} class="newsletter-form">
      <div class="newsletter-row">
        <div class="newsletter-field">
          <input
            type="text"
            name="first_name"
            placeholder="First name"
            class="newsletter-input"
            aria-label="First name"
          />
        </div>
        <div class="newsletter-field">
          <input
            type="text"
            name="last_name"
            placeholder="Last name"
            class="newsletter-input"
            aria-label="Last name"
          />
        </div>
      </div>
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        required
        class="newsletter-input"
        aria-label="Email address"
      />
      <Button type="submit" variant="primary" disabled={isSubmitting} class="newsletter-submit w-full justify-center">
        {#if isSubmitting}
          Joining...
        {:else}
          Subscribe <Arrow direction="right" />
        {/if}
      </Button>
    </form>
  </div>
</Modal>

<style>
  /* Override footer-utility to space out the new left-aligned text */
  .footer-utility {
    justify-content: space-between !important;
  }

  .built-in-austria {
    font-size: 0.875rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  /* Ensure new links and buttons are regular p size (1rem) */
  .footer-links a,
  .footer-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 1rem; /* Regular p size */
    transition: color 0.2s ease;
    background: none;
    border: none;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
  }

  .footer-links a:hover,
  .footer-link-btn:hover {
    color: var(--color-lime);
  }

  /* Make the copyright symbol regular p size (1rem) while keeping the rest mono/smaller */
  .copyright-symbol {
    font-size: 1rem;
  }
</style>