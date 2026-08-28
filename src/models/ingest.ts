// 1. Relative path: src/models/ingest.ts
// 2. Description: The Polymorphic Ingestion Engine for AI models. Streams raw bytes, chunks them, computes domain-separated Merkle roots, and persists to disk.
// 3. Expects: An AsyncIterable<Uint8Array> source, a filename, and the delivery root path.
// 4. Provides: A strictly typed ModelManifest and writes chunked artifacts to <deliveryRoot>/models/<modelId>/.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModelManifest } from './schema.js';

const CHUNK_SIZE = 256 * 1024; // 256KB
const LEAF_PREFIX = new Uint8Array([0x00]);
const INTERNAL_PREFIX = new Uint8Array([0x01]);

function concatUint8Arrays(arrays: ReadonlyArray<Uint8Array>): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) totalLength += arr.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export async function ingestModelStream(
  source: AsyncIterable<Uint8Array>,
  fileName: string,
  deliveryRoot: string
): Promise<ModelManifest> {
  const modelId = createHash('sha256').update(fileName + Date.now().toString()).digest('hex').slice(0, 16);
  const modelDir = join(deliveryRoot, 'models', modelId);
  await mkdir(modelDir, { recursive: true });

  const pendingChunks: Uint8Array[] = [];
  let pendingLength = 0;
  let chunkIndex = 0;
  let totalSizeBytes = 0;
  const chunkHashes: string[] = [];

  const flushChunk = async (data: Uint8Array): Promise<void> => {
    const hash = createHash('sha256').update(LEAF_PREFIX).update(data).digest('hex');
    chunkHashes.push(hash);
    const chunkName = `chunk_${chunkIndex.toString().padStart(4, '0')}.bin`;
    await writeFile(join(modelDir, chunkName), data);
    totalSizeBytes += data.length;
    chunkIndex++;
  };

  for await (const chunk of source) {
    let offset = 0;
    while (offset < chunk.length) {
      const remaining = CHUNK_SIZE - pendingLength;
      const sliceLength = Math.min(remaining, chunk.length - offset);
      const slice = chunk.subarray(offset, offset + sliceLength);
      
      pendingChunks.push(slice);
      pendingLength += sliceLength;
      offset += sliceLength;

      if (pendingLength === CHUNK_SIZE) {
        await flushChunk(concatUint8Arrays(pendingChunks));
        pendingChunks.length = 0;
        pendingLength = 0;
      }
    }
  }

  if (pendingLength > 0) {
    await flushChunk(concatUint8Arrays(pendingChunks));
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
  if (hashes.length === 1) return hashes[0] ?? '';
  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i] ?? '';
    const right = hashes[i + 1] ?? left;
    const combined = createHash('sha256').update(INTERNAL_PREFIX).update(left).update(right).digest('hex');
    nextLevel.push(combined);
  }
  return computeMerkleRoot(nextLevel);
}