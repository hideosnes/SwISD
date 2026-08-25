// src/storage/index.ts
// Description: Barrel file for the storage module, enforcing single-step import depth.
// Expects: Internal module files (`capacity.ts`) within the storage directory.
// Provides: Centralized export of elastic capacity allocation and swarm storage metrics.

export * from './capacity.js';