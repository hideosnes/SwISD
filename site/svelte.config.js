/**
 * 1. Relative path: site/svelte.config.js
 * 2. Description: SvelteKit configuration for the SwISD marketing site.
 * 3. Expects: Static adapter for FTP deployment, strict runes enforcement.
 * 4. Provides: Canonical compiler options, static build directives, and prerender crawler rules.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  
  // Runes enforcement lives here, not in vite.config.ts
  compilerOptions: {
    runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
  },

  kit: {
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
    }
  }
};

export default config;