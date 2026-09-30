/**
 * 1. Relative path: site/vite.config.ts
 * 2. Description: Vite configuration for the SwISD marketing site.
 * 3. Expects: Tailwind CSS v4 plugin and SvelteKit Vite plugin.
 * 4. Provides: Bundled, optimized static assets and local dev server ports.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		// Pass NO options here. If you pass options to sveltekit(), 
		// it will silently ignore svelte.config.js.
		sveltekit() 
	],
	server: {
		port: 5174,
		strictPort: true
	},
	preview: {
		port: 4174,
		strictPort: true
	}
});