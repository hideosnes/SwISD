// 1. Relative path: src/delivery/index.ts
// 2. Description: Barrel file for the delivery module, enforcing single-step import depth.
// 3. Expects: Internal delivery module files.
// 4. Provides: Centralized export of all delivery mechanism components, including persistent identity management.

export * from './schema.js';
export * from './heartbeat.js';
export * from './verifier.js';
export * from './installer.js';
export * from './watchdog.js';
export * from './mockReleaseGenerator.js';
export * from './identity.js';