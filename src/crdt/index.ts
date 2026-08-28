// 1. Relative path: src/crdt/index.ts
// 2. Description: Barrel file for the CRDT module, enforcing single-step import depth.
// 3. Expects: Internal module files (`merkle.ts`, `structures.ts`, `reputation.ts`, `reputationLog.ts`) within the crdt directory.
// 4. Provides: Centralized export of Merkle-DAG primitives, strict CRDT state interfaces, and reputation math.

export * from './merkle.js';
export * from './structures.js';
export * from './reputation.js';
export * from './reputationLog.js';