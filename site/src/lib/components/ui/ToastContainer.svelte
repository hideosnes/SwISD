<!--
1. Relative path: site/src/lib/components/ui/ToastContainer.svelte
2. Description: Global container for rendering active toasts.
3. Expects: Svelte 5 runes, uiStore.
4. Provides: Fixed-position rendering of all active toast notifications.
-->
<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte.js';
	import Toast from './Toast.svelte';
</script>

<div class="ui-toast-container">
	{#each uiStore.toasts as toast (toast.id)}
		<Toast
			id={toast.id}
			message={toast.message}
			type={toast.type}
			onDismiss={uiStore.removeToast}
		/>
	{/each}
</div>