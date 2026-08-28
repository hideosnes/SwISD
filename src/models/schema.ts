// 1. Relative path: src/models/schema.ts
// 2. Description: Strict type definitions for the SwISD AI Model distribution and caching layer.
// 3. Expects: Cryptographic signatures, Merkle roots, and capability identifiers.
// 4. Provides: Exhaustive, type-safe contracts for model manifests and local cache state.

export interface ModelManifest {
  readonly modelId: string;
  readonly fileName: string;
  readonly merkleRoot: string;
  readonly totalChunks: number;
  readonly totalSizeBytes: number;
  readonly chunkSizeBytes: number;
  readonly createdAt: number;
}