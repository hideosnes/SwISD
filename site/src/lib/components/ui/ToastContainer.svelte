<!--
1. Relative path: site/src/lib/components/ui/ToastContainer.svelte
2. Description: Global container for rendering active toasts.
3. Expects: Svelte 5 runes, uiStore.
4. Provides: Fixed-position rendering of all active toast notifications, strictly stacked vertically with proper spacing, guaranteed above the TopNav.
-->
<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte.js';
	import Toast from './Toast.svelte';
</script>

<div class="ui-toast-container flex flex-col gap-4 fixed top-20 right-4 z-9999 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
	{#each uiStore.toasts as toast (toast.id)}
		<Toast
			id={toast.id}
			message={toast.message}
			type={toast.type}
			onDismiss={uiStore.removeToast}
		/>
	{/each}
</div>