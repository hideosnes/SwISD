// src/config/index.ts
// Description: Barrel file for the config module, enforcing single-step import depth.
// Expects: Internal module files (`loader.ts`, `schema.ts`) within the config directory.
// Provides: Centralized export of configuration loading and schema validation.

export * from './loader.js';
export * from './schema.js';