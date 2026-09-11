<!--
1. Relative path: site/src/routes/+layout.svelte
2. Description: Global shell for the SwISD marketing site.
3. Expects: Svelte 5 runes, layout.css import, favicon asset.
4. Provides: Global TopNav, Footer, clean canvas for page content, and global UI engines (Toast/Modal).
-->
<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.ico';
  import { TopNav, Footer } from '$lib/components/ui';
  import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
  import { page } from '$app/state';

  let { children } = $props();

  const navLinks = [
    { href: '#problem', label: 'Problem' },
    { href: '#solution', label: 'Solution' },
    { href: '#architecture', label: 'Architecture' },
    { href: '#business', label: 'For Business' },
    { href: '/roadmap', label: 'Roadmap' }
  ];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<TopNav links={navLinks} currentPath={page.url.pathname} />

<main>
  {@render children()}
</main>

<Footer />

<ToastContainer />