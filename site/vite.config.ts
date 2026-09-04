/**
 * 1. Relative path: site/vite.config.ts
 * 2. Description: Vite configuration for the SwISD marketing site.
 * 3. Expects: Tailwind CSS v4 plugin and SvelteKit Vite plugin with inline kit config.
 * 4. Provides: Bundled, optimized static assets with strict type checking and explicit static adapter.
 */
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// KitConfig properties go directly here, NOT nested under a 'kit' object
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html',
				precompress: false,
				strict: true
			}),
			prerender: {
				entries: ['*'] // Crawls from '/' and follows all internal links to prerender them
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