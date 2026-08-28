// 1. Relative path: src/admin/index.ts
// 2. Description: Barrel file for the admin module, enforcing single-step import depth.
// 3. Expects: Internal admin module files.
// 4. Provides: Centralized export of the headless admin JSON API server.
export * from './server.js';