/**
 * 1. Relative path: site/vite.config.ts
 * 2. Description: Vite configuration for the SwISD marketing site.
 * 3. Expects: Tailwind CSS v4 plugin and SvelteKit Vite plugin.
 * 4. Provides: Bundled, optimized static assets and locally dev-server ports; Kit 3 reads all config (adapter, prerender, runes enforcement) from the sveltekit() plugin options — svelte.config.js is no longer supported.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),

			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true
			}),
			prerender: {
				// The research articles use progressive disclosure ({#if isExpanded})
				// which hides reference anchors (#ref-1) from the initial static HTML.
				// We tell the prerender crawler to warn instead of failing when it
				// cannot find these client-side toggled hash fragments.
				handleMissingId: 'warn'
			},

			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
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
