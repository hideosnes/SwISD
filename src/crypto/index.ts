// 1. Relative path: src/crypto/index.ts
// 2. Description: Barrel file for the crypto module, enforcing single-step import depth.
// 3. Expects: Internal module files (`hmac.ts`, `ed25519.ts`) within the crypto directory.
// 4. Provides: Centralized export of all two-tier cryptographic primitives (Ed25519 control, HMAC data).

export * from './hmac.js';
export * from './ed25519.js';