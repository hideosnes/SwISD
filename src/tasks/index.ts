// 1. Relative path: src/tasks/index.ts
// 2. Description: Barrel export for the tasks module.
// 3. Expects: N/A
// 4. Provides: Centralized, one-step import access to task lifecycle and ingestion logic.

export { TaskLifecycleManager } from './lifecycle.js';
export type { ActiveTaskRecord, TaskLifecycleDependencies } from './lifecycle.js';
export { ingestAndChunkStream, nodeFileToStream, httpReqToStream } from './ingestion.js';
export type { DataStream } from './ingestion.js';
export { buildChunkRoutingTable, findOrphanedChunks } from './locator.js';
export type { ChunkLocationLedger, ChunkRoutingTable, ChunkLocation } from './locator.js';
export { peerSupportsExecutor } from './capabilities.js';
export type { ExecutorSignature, CapabilityManifest } from './capabilities.js';