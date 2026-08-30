// 1. Relative path: cockpit/src/lib/server/index.ts
// 2. Description: Barrel file for the SvelteKit BFF server-side modules.
// 3. Expects: Internal server modules (discovery, topology).
// 4. Provides: Centralized export for BFF server logic, enforcing single-step import depth.

export * from './discovery.js';
export * from './topology.js';