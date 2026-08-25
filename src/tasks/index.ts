// src/tasks/index.ts
// Description: Barrel file for the tasks module, enforcing single-step import depth.
// Expects: Internal module files (`capabilities.ts`, `ingestion.ts`, `locator.ts`) within the tasks directory.
// Provides: Centralized export of capability manifests, adaptive ingestion, and chunk location routing.

export * from './capabilities.js';
export * from './ingestion.js';
export * from './locator.js';