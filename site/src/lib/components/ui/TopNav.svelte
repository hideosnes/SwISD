<!--
1. Relative path: site/src/lib/components/ui/TopNav.svelte
2. Description: Global sticky navigation bar.
3. Expects: Svelte 5 runes, SSR-safe DOM access.
4. Provides: Glassmorphic adaptive bar with logo, section links, and GitHub CTA.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Arrow } from '$lib/components/ui';
  import { swisdLogo } from '$lib/assets';

  let {
    links,
    currentPath = '/'
  }: {
    links: readonly { href: string; label: string }[];
    currentPath?: string;
  } = $props();

  let mobileMenuOpen = $state(false);
  let navScrolled = $state(false);

  const GITHUB = 'https://github.com/hideosnes/swisd';

  function handleScroll() {
    navScrolled = window.scrollY > 50;
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function resolveHref(href: string): string {
    if (href.startsWith('#') && currentPath !== '/') return `/${href}`;
    return href;
  }

  onMount(() => window.addEventListener('scroll', handleScroll));
  onDestroy(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('scroll', handleScroll);
  });
</script>

<nav class="navbar" class:scrolled={navScrolled}>
  <a href={currentPath === '/' ? '#hero' : '/'} class="nav-logo" onclick={closeMobileMenu}>
    <img src={swisdLogo} alt="SwISD" class="nav-logo-img" />
  </a>
  <ul class="nav-links" class:open={mobileMenuOpen}>
    {#each links as link}
      <li><a href={resolveHref(link.href)} onclick={closeMobileMenu}>{link.label}</a></li>
    {/each}
    <li>
      <a href={GITHUB} target="_blank" rel="noopener noreferrer" class="nav-cta">
        GitHub <Arrow direction="external" />
      </a>
    </li>
  </ul>
  <button
    type="button"
    class="mobile-menu-btn"
    onclick={toggleMobileMenu}
    aria-label="Toggle menu"
    aria-expanded={mobileMenuOpen}
  >
    {mobileMenuOpen ? '✕' : '☰'}
  </button>
</nav>