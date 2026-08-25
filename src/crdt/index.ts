// src/crdt/index.ts
// Description: Barrel file for the CRDT module, enforcing single-step import depth.
// Expects: Internal module files (`merkle.ts`, `structures.ts`, `reputation.ts`) within the crdt directory.
// Provides: Centralized export of Merkle-DAG primitives, strict CRDT state interfaces, and reputation math.

export * from './merkle.js';
export * from './structures.js';
export * from './reputation.js';