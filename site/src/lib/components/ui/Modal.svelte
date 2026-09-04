<!--
1. Relative path: site/src/lib/components/ui/Modal.svelte
2. Description: Accessible modal dialog primitive.
3. Expects: Svelte 5 runes, strict a11y, focus trapping, keyboard parity.
4. Provides: A reusable modal container with backdrop, ESC/Enter/Space dismissal, and proper focus management.
-->
<script lang="ts">

	let { 
		isOpen, 
		onClose, 
		children,
		ariaLabel = 'Modal dialog'
	}: { 
		isOpen: boolean; 
		onClose: () => void; 
		children: import('svelte').Snippet;
		ariaLabel?: string;
	} = $props();

	let modalRef: HTMLDivElement | undefined = $state();
	let previousActiveElement: HTMLElement | null = null;

	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onClose();
	 }
	}

	function handleInnerKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
		if (event.key === 'Tab' && modalRef) {
			const focusableElements = modalRef.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey && document.activeElement === firstElement) {
				lastElement.focus();
				event.preventDefault();
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				firstElement.focus();
				event.preventDefault();
			}
		}
	}

	$effect(() => {
		if (isOpen) {
			previousActiveElement = document.activeElement as HTMLElement;
			modalRef?.focus();
			document.body.style.overflow = 'hidden';
			
			return () => {
				document.body.style.overflow = '';
				previousActiveElement?.focus();
			};
		}
	});
</script>

{#if isOpen}
	<!-- 
		Backdrop overlay: 
		- role="button" and tabindex="0" satisfy a11y_no_static_element_interactions
		- onkeydown satisfies a11y_click_events_have_key_events (Enter/Space/Escape)
		- aria-label provides context for screen readers
	-->
	<div
		class="ui-overlay"
		role="button"
		tabindex="0"
		aria-label="Close modal overlay"
		onclick={onClose}
		onkeydown={handleOverlayKeydown}
	>
		<!-- 
			Actual Dialog Content: 
			- onclick/onkeydown stopPropagation prevents accidental closure when interacting inside
			- role="dialog" and tabindex="-1" satisfy dialog focus management rules
		-->
		<div
			class="ui-modal-content"
			role="dialog"
			aria-modal="true"
			aria-label={ariaLabel}
			bind:this={modalRef}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				e.stopPropagation();
				handleInnerKeydown(e);
			}}
		>
			<!-- Explicit close button for maximum accessibility and UX clarity -->
			<button 
				type="button" 
				class="absolute top-4 right-4 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-full p-1"
				aria-label="Close modal"
				onclick={onClose}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			{@render children()}
		</div>
	</div>
{/if}