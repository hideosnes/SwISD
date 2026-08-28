// 1. Relative path: src/models/index.ts
// 2. Description: Barrel file for the models module, enforcing single-step import depth.
// 3. Expects: Internal model module files.
// 4. Provides: Centralized export of model schemas and the ingestion engine.

export * from './schema.js';
export * from './ingest.js';