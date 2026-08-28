// 1. Relative path: src/peer/index.ts
// 2. Description: Barrel file for the peer module, enforcing single-step import depth.
// 3. Expects: Internal peer module files.
// 4. Provides: Centralized export of the TrustRegistry and peer identity management.

export * from './trust.js';