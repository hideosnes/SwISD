/**
 * 1. Relative path: site/src/lib/scroll/index.ts
 * 2. Description: Barrel export for the scroll engine module.
 * 3. Expects: Scroll engine factory and types.
 * 4. Provides: Single import surface for scroll infrastructure.
 */
export { createScrollEngine } from './engine';
export type { ScrollEngine } from './engine';