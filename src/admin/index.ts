// src/admin/index.ts
// Description: Barrel file for the admin module, enforcing single-step import depth.
// Expects: Internal admin module files.
// Provides: Centralized export of the admin server and embedded dashboard assets.

export * from './server.js';
export * from './dashboardHtml.js';