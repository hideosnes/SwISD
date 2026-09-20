/**
 * 1. Relative path: src/provision/index.ts
 * 2. Description: Barrel export for hardware and out-of-box provisioning modules.
 * 3. Expects: Strict TypeScript, max one-step import depth.
 * 4. Provides: Centralized access to provisioning agents and fallback AP logic.
 */

// CLI scripts like apply.ts are self-executing entrypoints and do not export runtime modules.
// Future modules (apFallback, captivePortal) will be exported here as they are built.
export {};