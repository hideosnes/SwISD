<!--
1. Relative path: site/src/routes/+layout.svelte
2. Description: Global shell for the SwISD marketing site.
3. Expects: Svelte 5 runes, layout.css import, favicon asset.
4. Provides: Clean canvas for fullpage scroll experience with global UI engines (Toast/Modal).
-->
<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
<ToastContainer />