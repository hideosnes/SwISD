// 1. Relative path: src/models/fetcher.ts
// 2. Description: P2P client for pulling, verifying, and caching model chunks from neighboring peers (micro-torrent leecher).
// 3. Expects: A ModelManifest, ChunkLocationLedger, SwISDNode, and delivery root path.
// 4. Provides: A strictly typed ModelChunkFetcher that rotates peers on failure and enforces per-chunk Merkle integrity.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ModelManifest } from './schema.js';
import type { Stream } from '@libp2p/interface';
import {
  chunkPath,
  closeQuietly,
  decodeChunkError,
  readFrame,
  writeFrame,
  FRAME_STATUS_ERROR,
  FRAME_STATUS_SUCCESS,
} from './framing.js';
import type { ChunkLocationLedger } from '../tasks/locator.js';
import type { SwISDNode } from '../network/libp2p.js';
import { dialChunkStream } from '../network/libp2p.js';
import { createLeafNode } from '../crdt/merkle.js';
import { SwISDError } from '../errors.js';

export interface FetchProgress {
  readonly modelId: string;
  readonly chunkIndex: number;
  readonly status: 'fetching' | 'verifying' | 'writing' | 'success' | 'error';
  readonly peerId?: string;
  readonly errorMessage?: string;
}

export class ModelChunkFetcher {
  constructor(
    private readonly deliveryRoot: string,
    private readonly ledger: ChunkLocationLedger,
    private readonly node: SwISDNode
  ) {}

  public async fetchChunk(
    modelId: string,
    chunkIndex: number,
    manifest: ModelManifest,
    onProgress?: (progress: FetchProgress) => void
  ): Promise<void> {
    if (chunkIndex < 0 || chunkIndex >= manifest.totalChunks) {
      throw new SwISDError('ERR_INVALID_STATE', `Chunk index ${chunkIndex} out of bounds for model ${modelId}`);
    }

    const expectedHash = manifest.chunkHashes[chunkIndex];
    if (!expectedHash) {
      throw new SwISDError('ERR_MODEL_CORRUPT', `Missing expected hash for chunk ${chunkIndex} in manifest`);
    }

    const availablePeers = this.ledger.get(expectedHash);
    if (availablePeers === undefined || availablePeers.size === 0) {
      throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `No peers available for chunk ${chunkIndex} (CID: ${expectedHash})`);
    }

    const requestPayload = new TextEncoder().encode(JSON.stringify({ modelId, chunkIndex }));
    let lastError: Error | undefined;

    for (const peerId of availablePeers) {
      onProgress?.({ modelId, chunkIndex, status: 'fetching', peerId });
      let stream: Stream | undefined;
      try {
        stream = await dialChunkStream(this.node, peerId);
        await writeFrame(stream, FRAME_STATUS_SUCCESS, requestPayload);

        onProgress?.({ modelId, chunkIndex, status: 'verifying', peerId });
        const frame = await readFrame(stream);

        if (frame.status === FRAME_STATUS_ERROR) {
          throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `Peer ${peerId} rejected request: ${decodeChunkError(frame.payload)}`);
        }

        const leaf = createLeafNode(frame.payload);
        if (leaf.cid !== expectedHash) {
          throw new SwISDError(
            'ERR_MODEL_CORRUPT',
            `Chunk hash mismatch from peer ${peerId}. Expected ${expectedHash}, got ${leaf.cid}`
          );
        }

        onProgress?.({ modelId, chunkIndex, status: 'writing', peerId });
        const path = chunkPath(this.deliveryRoot, modelId, chunkIndex);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, frame.payload);

        onProgress?.({ modelId, chunkIndex, status: 'success', peerId });
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lastError = new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `Chunk ${chunkIndex} failed on peer ${peerId}: ${message}`, err);
        onProgress?.({ modelId, chunkIndex, status: 'error', peerId, errorMessage: message });
      } finally {
        // The seeder closes her end; symmetry ensures ours never leaks — even on success.
        await closeQuietly(stream);
      }
    }

    throw lastError ?? new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `All peers failed to deliver chunk ${chunkIndex}`);
  }
}
