/**
 * 1. Relative path: site/src/lib/stores/ui.svelte.ts
 * 2. Description: Global reactive state for UI engines (Toasts and Modals).
 * 3. Expects: Svelte 5 module-level $state.
 * 4. Provides: Strictly typed methods to push/pop toasts and open/close modals.
 */
import type { Snippet } from 'svelte';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
};

export type ModalState = {
	isOpen: boolean;
	content: Snippet | null;
};

// Module-level $state for global reactivity without external stores
let toasts = $state<Toast[]>([]);
let modal = $state<ModalState>({ isOpen: false, content: null });

export const uiStore = {
	get toasts() {
		return toasts;
	},
	get modal() {
		return modal;
	},
	addToast(message: string, type: ToastType = 'info', duration = 3000) {
		const id = crypto.randomUUID();
		toasts.push({ id, message, type, duration });
	},
	removeToast(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	},
	openModal(content: Snippet) {
		modal = { isOpen: true, content };
	},
	closeModal() {
		modal = { isOpen: false, content: null };
	}
};