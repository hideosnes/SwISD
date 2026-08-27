// 1. Relative path: cockpit/svelte.config.js
// 2. Description: SvelteKit configuration file, defining the Node adapter and path aliases for the Conductor Cockpit.
// 3. Expects: Node environment and SvelteKit build tools.
// 4. Provides: Configuration for the Node adapter and explicit mapping of the $core alias to the parent directory's src folder.

import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			// This is the magic line that tells SvelteKit to generate the TS paths
			$core: path.resolve(__dirname, '../src')
		}
	}
};

export default config;