// 1. Relative path: src/models/ingest.ts
// 2. Description: The Polymorphic Ingestion Engine for AI models. Streams raw bytes, chunks them, computes domain-separated Merkle roots, and persists to disk.
// 3. Expects: An AsyncIterable<Uint8Array> source, a filename, and the delivery root path.
// 4. Provides: A strictly typed ModelManifest and writes chunked artifacts to <deliveryRoot>/models/<modelId>/.

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModelManifest } from './schema.js';

const CHUNK_SIZE = 256 * 1024; // 256KB
const LEAF_PREFIX = Buffer.from([0x00]);
const INTERNAL_PREFIX = Buffer.from([0x01]);

export async function ingestModelStream(
  source: AsyncIterable<Uint8Array>,
  fileName: string,
  deliveryRoot: string
): Promise<ModelManifest> {
  // Generate a deterministic but unique modelId based on filename and timestamp
  const modelId = createHash('sha256').update(fileName + Date.now().toString()).digest('hex').slice(0, 16);
  const modelDir = join(deliveryRoot, 'models', modelId);
  await mkdir(modelDir, { recursive: true });

  let buffer = Buffer.alloc(0);
  let chunkIndex = 0;
  let totalSizeBytes = 0;
  const chunkHashes: string[] = [];

  for await (const chunk of source) {
    const bufChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    buffer = Buffer.concat([buffer, bufChunk]);
    
    while (buffer.length >= CHUNK_SIZE) {
      const slice = buffer.subarray(0, CHUNK_SIZE);
      buffer = buffer.subarray(CHUNK_SIZE);
      
      // Domain-separated leaf hashing per CRDT.md
      const hash = createHash('sha256').update(LEAF_PREFIX).update(slice).digest('hex');
      chunkHashes.push(hash);
      
      const chunkName = `chunk_${chunkIndex.toString().padStart(4, '0')}.bin`;
      await writeFile(join(modelDir, chunkName), slice);
      
      totalSizeBytes += slice.length;
      chunkIndex++;
    }
  }

  // Handle remaining bytes (the final partial chunk)
  if (buffer.length > 0) {
    const hash = createHash('sha256').update(LEAF_PREFIX).update(buffer).digest('hex');
    chunkHashes.push(hash);
    
    const chunkName = `chunk_${chunkIndex.toString().padStart(4, '0')}.bin`;
    await writeFile(join(modelDir, chunkName), buffer);
    
    totalSizeBytes += buffer.length;
    chunkIndex++;
  }

  const merkleRoot = computeMerkleRoot(chunkHashes);

  const manifest: ModelManifest = {
    modelId,
    fileName,
    merkleRoot,
    totalChunks: chunkIndex,
    totalSizeBytes,
    chunkSizeBytes: CHUNK_SIZE,
    createdAt: Date.now(),
  };

  await writeFile(join(modelDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return manifest;
}

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return createHash('sha256').update(INTERNAL_PREFIX).update('').digest('hex');
  }
  if (hashes.length === 1) return hashes[0] ?? ''; // <-- FIXED
  
  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i] ?? '';
    // Duplicate the last node if the level is odd
    const right = hashes[i + 1] ?? left; 
    // Domain-separated internal node hashing per CRDT.md
    const combined = createHash('sha256').update(INTERNAL_PREFIX).update(left).update(right).digest('hex');
    nextLevel.push(combined);
  }
  return computeMerkleRoot(nextLevel);
}