// 1. Relative path: cockpit/vite.config.ts
// 2. Description: Vite configuration for the SvelteKit Conductor Cockpit, defining plugins, compiler options, and path aliases.
// 3. Expects: Node environment and SvelteKit/Vite build tools.
// 4. Provides: A strictly configured build pipeline with TailwindCSS, Svelte 5 Runes enforcement, Node adapter, and $core alias resolution.

import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	resolve: {
		alias: {
			// Map $core to the parent directory's src folder for seamless core DTO imports
			$core: path.resolve(import.meta.dirname, '../src')
		}
	}
});