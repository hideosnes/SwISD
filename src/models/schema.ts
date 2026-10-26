// 1. Relative path: src/models/schema.ts
// 2. Description: Strict type definitions for the SwISD AI Model distribution and caching layer.
// 3. Expects: Cryptographic signatures, Merkle roots, and capability identifiers.
// 4. Provides: Exhaustive, type-safe contracts for model manifests, file metadata, and local cache state.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

export interface ModelFile {
  readonly path: string;
  readonly sizeBytes: number;
  readonly isRequired: boolean;
}

export interface ModelManifest {
  readonly modelId: string;
  readonly repoId: string;
  readonly displayName?: string;
  readonly pipelineTag?: string | null;
  readonly tags?: ReadonlyArray<string>;
  readonly files: ReadonlyArray<ModelFile>;
  readonly merkleRoot: string;
  readonly totalChunks: number;
  readonly totalSizeBytes: number;
  readonly chunkSizeBytes: number;
  readonly chunkHashes: ReadonlyArray<string>;
  readonly requiredCapability: string;
  readonly sourcePeerId?: string;
  readonly createdAt: number;
  readonly signature: Uint8Array;
}

export interface ChunkRequest {
  readonly modelId: string;
  readonly chunkIndex: number;
}

export type ChunkResponse = 
  | { readonly status: 'success'; readonly data: Uint8Array }
  | { readonly status: 'error'; readonly message: string };