/**
 * 1. Relative path: src/ownership/index.ts
 * 2. Description: Barrel file for the Sovereignty Layer.
 * 3. Expects: Internal ownership modules.
 * 4. Provides: Centralized export enforcing single-step import depth.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

export * from './schema.js';
export * from './keystone.js';
export * from './anchor.js';
export * from './succession.js';
export * from './recoveryRateLimiter.js';