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
  readonly displayName?: string; // Optional operator-assigned alias
  readonly pipelineTag?: string | null; // e.g., 'text-generation'
  readonly tags?: ReadonlyArray<string>; // e.g., ['gguf', 'q4_k_m']
  readonly files: ReadonlyArray<ModelFile>;
  readonly merkleRoot: string;
  readonly totalChunks: number;
  readonly totalSizeBytes: number;
  readonly chunkSizeBytes: number;
  readonly requiredCapability: string;
  readonly createdAt: number;
  readonly signature: Uint8Array; // Note: Ensure hex serialization at DTO boundary if exposed to JSON
}