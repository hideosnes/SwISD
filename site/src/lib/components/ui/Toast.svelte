<!--
1. Relative path: site/src/lib/components/ui/Toast.svelte
2. Description: Individual toast notification primitive.
3. Expects: Svelte 5 runes, strict a11y.
4. Provides: Auto-dismissing notification with accessible status role and fully colored variant backgrounds, free of legacy border artifacts.
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

	const variantClasses = $derived(
		type === 'success' ? 'bg-(--color-lime) text-gray-900' :
		type === 'info' ? 'bg-(--color-purple) text-gray-900' :
		'bg-yellow-500 text-gray-900'
	);

	onMount(() => {
		timeoutId = setTimeout(() => {
			onDismiss(id);
		}, 3000);
		
		// Cleanup to prevent memory leaks if dismissed early
		return () => clearTimeout(timeoutId);
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
	class="ui-toast {variantClasses} border-l-0"
	role="status"
	aria-live="polite"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<span class="font-semibold capitalize">{type}:</span>
	<span>{message}</span>
	<button
		class="ml-auto text-gray-900/60 hover:text-gray-900 transition-colors"
		aria-label="Dismiss notification"
		onclick={() => onDismiss(id)}
	>
		&times;
	</button>
</div>