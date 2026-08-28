// 1. Relative path: src/network/router/index.ts
// 2. Description: Barrel export for the network router module.
// 3. Expects: N/A
// 4. Provides: Centralized, one-step import access to gossip routing and egress tunnel logic.

export { handleIncomingGossipMessage, generateMessageId } from './gossipRouter.js';
export { initEgressTunnel, sendResultViaEgress } from './egressTunnel.js';
export type { GossipRouterDependencies } from './gossipRouter.js';