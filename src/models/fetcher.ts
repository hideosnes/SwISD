// 1. Relative path: src/models/fetcher.ts
// 2. Description: P2P client for pulling, verifying, and caching model chunks from neighboring peers (micro-torrent leecher).
// 3. Expects: A ModelManifest, ChunkLocationLedger, SwISDNode, and delivery root path.
// 4. Provides: A strictly typed ModelChunkFetcher that rotates peers on failure and enforces per-chunk Merkle integrity.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { ModelManifest, ChunkRequest, ChunkResponse } from './schema.js';
import type { ChunkLocationLedger } from '../tasks/locator.js';
import type { SwISDNode } from '../network/libp2p.js';
import { dialChunkStream } from '../network/libp2p.js';
import { createLeafNode } from '../crdt/merkle.js';
import { SwISDError } from '../errors.js';
import type { Stream } from '@libp2p/interface';

export interface FetchProgress {
  readonly modelId: string;
  readonly chunkIndex: number;
  readonly status: 'fetching' | 'verifying' | 'writing' | 'success' | 'error';
  readonly peerId?: string;
  readonly errorMessage?: string;
}

async function readChunkResponse(stream: Stream): Promise<ChunkResponse> {
  const headerBuffer = new Uint8Array(5);
  let headerOffset = 0;

  for await (const chunk of stream) {
    const toCopy = Math.min(chunk.length, 5 - headerOffset);
    headerBuffer.set(chunk.subarray(0, toCopy), headerOffset);
    headerOffset += toCopy;

    if (headerOffset === 5) {
      const status = headerBuffer[0];
      const length = new DataView(headerBuffer.buffer, 1, 4).getUint32(0, false);
      
      if (length > 10 * 1024 * 1024) {
        throw new SwISDError('ERR_INVALID_STATE', 'Response payload too large');
      }

      const payload = new Uint8Array(length);
      let payloadOffset = 0;
      
      const leftover = chunk.subarray(toCopy);
      if (leftover.length > 0) {
        const copyNow = Math.min(leftover.length, length - payloadOffset);
        payload.set(leftover.subarray(0, copyNow), payloadOffset);
        payloadOffset += copyNow;
      }

      if (payloadOffset < length) {
        for await (const nextChunk of stream) {
          const copyNext = Math.min(nextChunk.length, length - payloadOffset);
          payload.set(nextChunk.subarray(0, copyNext), payloadOffset);
          payloadOffset += copyNext;
          if (payloadOffset === length) {
            break;
          }
        }
      }

      if (payloadOffset < length) {
        throw new SwISDError('ERR_INVALID_STATE', 'Stream closed prematurely during payload read');
      }

      if (status === 0x00) {
        return { status: 'success', data: payload };
      } else {
        const errorText = new TextDecoder().decode(payload);
        let errorMessage = 'Unknown peer error';
        try {
          const parsed = JSON.parse(errorText) as Record<string, unknown>;
          if (typeof parsed.error === 'string') {
            errorMessage = parsed.error;
          }
        } catch {
          errorMessage = errorText;
        }
        return { status: 'error', message: errorMessage };
      }
    }
  }
  throw new SwISDError('ERR_INVALID_STATE', 'Stream closed prematurely before header');
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

    const availablePeers = this.ledger.get(expectedHash) ?? new Set<string>();
    
    if (availablePeers.size === 0) {
      throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `No peers available for chunk ${chunkIndex} (CID: ${expectedHash})`);
    }

    let lastError: Error | undefined;

    for (const peerId of availablePeers) {
      onProgress?.({ modelId, chunkIndex, status: 'fetching', peerId });
      let stream: Stream | undefined;

      try {
        stream = await dialChunkStream(this.node, peerId);
        
        const request: ChunkRequest = { modelId, chunkIndex };
        const requestPayload = new TextEncoder().encode(JSON.stringify(request));
        const lengthBuffer = new ArrayBuffer(4);
        new DataView(lengthBuffer).setUint32(0, requestPayload.length, false);

        if (!stream.send(new Uint8Array(lengthBuffer))) await stream.onDrain();
        if (!stream.send(requestPayload)) await stream.onDrain();

        onProgress?.({ modelId, chunkIndex, status: 'verifying', peerId });
        const response = await readChunkResponse(stream);

        if (response.status === 'error') {
          throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `Peer ${peerId} rejected request: ${response.message}`);
        }

        const chunkData = response.data;
        
        const leaf = createLeafNode(chunkData);
        if (leaf.cid !== expectedHash) {
          throw new SwISDError(
            'ERR_MODEL_CORRUPT', 
            `Chunk ${chunkIndex} hash mismatch from peer ${peerId}. Expected ${expectedHash}, got ${leaf.cid}`
          );
        }

        onProgress?.({ modelId, chunkIndex, status: 'writing', peerId });
        const chunkName = `chunk_${chunkIndex.toString().padStart(4, '0')}.bin`;
        const chunkPath = join(this.deliveryRoot, 'models', modelId, chunkName);
        
        await mkdir(dirname(chunkPath), { recursive: true });
        await writeFile(chunkPath, chunkData);

        onProgress?.({ modelId, chunkIndex, status: 'success', peerId });
        return;

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `Chunk ${chunkIndex} failed on peer ${peerId}: ${msg}`, err);
        onProgress?.({ modelId, chunkIndex, status: 'error', peerId, errorMessage: msg });
        
        if (stream) {
          try {
            await stream.close();
          } catch {
            // Ignore close errors if stream is already dead
          }
        }
        continue;
      }
    }

    throw lastError ?? new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `All peers failed to deliver chunk ${chunkIndex}`);
  }
}