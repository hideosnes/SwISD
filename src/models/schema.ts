// 1. Relative path: src/models/schema.ts
// 2. Description: Strict type definitions for the SwISD AI Model distribution and caching layer.
// 3. Expects: Cryptographic signatures, Merkle roots, and capability identifiers.
// 4. Provides: Exhaustive, type-safe contracts for model manifests, file metadata, and local cache state.

export interface ModelFile {
  readonly path: string;
  readonly sizeBytes: number;
  readonly isRequired: boolean;
}

export interface ModelManifest {
  readonly modelId: string;
  readonly repoId: string;
  readonly files: ReadonlyArray<ModelFile>;
  readonly merkleRoot: string;
  readonly totalChunks: number;
  readonly totalSizeBytes: number;
  readonly chunkSizeBytes: number;
  readonly requiredCapability: string;
  readonly createdAt: number;
  readonly signature: Uint8Array;
}