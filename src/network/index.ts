// 1. Relative path: src/network/index.ts
// 2. Description: Barrel file for the network module, enforcing single-step import depth.
// 3. Expects: Internal network module files.
// 4. Provides: Centralized export of Bloom filters, libp2p factory, and mDNS discovery.

export * from './bloom.js';
export * from './libp2p.js';
export * from './discovery.js';