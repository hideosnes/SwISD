<!--
1. Relative path: site/src/lib/components/ui/Toast.svelte
2. Description: Individual toast notification primitive.
3. Expects: Svelte 5 runes, strict a11y.
4. Provides: Auto-dismissing notification with accessible status role.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { id, message, type, onDismiss }: { 
		id: string; 
		message: string; 
		type: 'success' | 'error' | 'info'; 
		onDismiss: (id: string) => void 
	} = $props();

	let timeoutId: ReturnType<typeof setTimeout>;

	onMount(() => {
		timeoutId = setTimeout(() => {
			onDismiss(id);
		}, 3000);
	});

	function handleMouseEnter() {
		clearTimeout(timeoutId);
	}

	function handleMouseLeave() {
		timeoutId = setTimeout(() => {
			onDismiss(id);
		}, 3000);
	}
</script>

<div
	class="ui-toast"
	role="status"
	aria-live="polite"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<span class="font-semibold capitalize">{type}:</span>
	<span>{message}</span>
	<button
		class="ml-auto text-gray-400 hover:text-white"
		aria-label="Dismiss notification"
		onclick={() => onDismiss(id)}
	>
		&times;
	</button>
</div>