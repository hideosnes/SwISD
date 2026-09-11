<!--
1. Relative path: site/src/lib/components/ui/Footer.svelte
2. Description: Global site footer with utility navigation, back-to-top action, and cross-route anchor resolution.
3. Expects: Svelte 5 runes, SSR-safe DOM access, $app/state for current path.
4. Provides: A reusable footer primitive with semantic <nav>, external link parity, and a programmatic scroll-to-top.
-->
<script lang="ts">
  import Arrow from './Arrow.svelte';
  import { swisdLogo } from '$lib/assets';
  import { page } from '$app/state';

  const GITHUB = 'https://github.com/hideosnes/swisd';
  const HOMAHUKI = 'https://www.homahuki.eu';

  function scrollToTop() {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resolveAnchorHref(anchor: string): string {
    // Cross-route anchor resolution: on /roadmap, "#architecture" must become "/#architecture"
    if (page.url.pathname !== '/') return `/${anchor}`;
    return anchor;
  }
</script>

<footer>
  <div class="container">
    <div class="footer-utility">
      <button type="button" class="back-to-top" onclick={scrollToTop}>
        <Arrow direction="up" /> Back to top
      </button>
    </div>
    <div class="footer-content">
      <img src={swisdLogo} alt="SwISD" class="footer-logo" />
      <nav class="footer-links" aria-label="Footer navigation">
        <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub <Arrow direction="external" /></a>
        <a href={resolveAnchorHref('#architecture')}>Docs <Arrow direction="down" /></a>
        <a href="/roadmap">Roadmap <Arrow direction="right" /></a>
        <a href={HOMAHUKI} target="_blank" rel="noopener noreferrer">homahuki.eu <Arrow direction="external" /></a>
      </nav>
      <span class="footer-copy">&copy; 2025 SwISD. Open Source.</span>
    </div>
  </div>
</footer>