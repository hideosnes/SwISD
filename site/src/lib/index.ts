/**
 * 1. Relative path: site/src/lib/index.ts
 * 2. Description: Root barrel export for the site library.
 * 3. Expects: Sub-module barrels.
 * 4. Provides: Single import surface for the entire lib directory.
 */
export * from './components/ui/index.js';
export { uiStore } from './stores/ui.svelte.js';