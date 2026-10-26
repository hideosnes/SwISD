// 1. Relative path: src/models/seeder.ts
// 2. Description: libp2p stream handler for serving model chunks to neighboring peers (micro-torrent layer).
// 3. Expects: A ModelRegistry and delivery root path.
// 4. Provides: A strictly typed protocol handler for `/swisd/model/1.0.0` that validates requests and streams chunk data.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ModelRegistry } from './registry.js';
import type { ChunkRequest } from './schema.js';
import { SwISDError } from '../errors.js';
import type { Stream } from '@libp2p/interface';

async function readMessage(stream: Stream): Promise<Uint8Array> {
  const lengthBuffer = new Uint8Array(4);
  let offset = 0;

  // Modern @libp2p/interface Stream implements AsyncIterable<Uint8Array> directly.
  // Do NOT use stream.source. Iterate over the stream itself.
  for await (const chunk of stream) {
    const toCopy = Math.min(chunk.length, 4 - offset);
    lengthBuffer.set(chunk.subarray(0, toCopy), offset);
    offset += toCopy;

    if (offset === 4) {
      const length = new DataView(lengthBuffer.buffer).getUint32(0, false);
      if (length > 1024 * 1024) {
        throw new SwISDError('ERR_INVALID_STATE', 'Request payload too large');
      }

      const payload = new Uint8Array(length);
      let payloadOffset = 0;
      
      // Handle any leftover bytes in the chunk that contained the length prefix
      const leftover = chunk.subarray(toCopy);
      if (leftover.length > 0) {
        const copyNow = Math.min(leftover.length, length - payloadOffset);
        payload.set(leftover.subarray(0, copyNow), payloadOffset);
        payloadOffset += copyNow;
      }

      // Continue reading if the payload spans multiple chunks
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
        throw new SwISDError('ERR_INVALID_STATE', 'Stream closed prematurely');
      }

      return payload;
    }
  }

  throw new SwISDError('ERR_INVALID_STATE', 'Stream closed prematurely');
}

function isValidChunkRequest(req: unknown): req is ChunkRequest {
  const r = req as Record<string, unknown>;
  return (
    typeof r?.modelId === 'string' &&
    typeof r?.chunkIndex === 'number' &&
    Number.isInteger(r.chunkIndex) &&
    r.chunkIndex >= 0
  );
}

async function sendErrorResponse(stream: Stream, errorMessage: string): Promise<void> {
  const errorPayload = new TextEncoder().encode(JSON.stringify({ error: errorMessage }));
  const lengthBuffer = new ArrayBuffer(4);
  new DataView(lengthBuffer).setUint32(0, errorPayload.length, false);
  
  // Modern @libp2p/interface uses stream.send() and stream.onDrain() for backpressure.
  // Do NOT use stream.sink.
  if (!stream.send(new Uint8Array([0x01]))) await stream.onDrain(); // 0x01 = error status
  if (!stream.send(new Uint8Array(lengthBuffer))) await stream.onDrain();
  if (!stream.send(errorPayload)) await stream.onDrain();
  
  await stream.close();
}

async function sendSuccessResponse(stream: Stream, data: Uint8Array): Promise<void> {
  const lengthBuffer = new ArrayBuffer(4);
  new DataView(lengthBuffer).setUint32(0, data.length, false);
  
  if (!stream.send(new Uint8Array([0x00]))) await stream.onDrain(); // 0x00 = success status
  if (!stream.send(new Uint8Array(lengthBuffer))) await stream.onDrain();
  if (!stream.send(data)) await stream.onDrain();
  
  await stream.close();
}

export function createModelSeederHandler(
  registry: ModelRegistry,
  deliveryRoot: string
) {
  return async (stream: Stream) => {
    console.debug(`[ModelSeeder] Incoming chunk request on stream ${stream.id}`);

    try {
      const requestBytes = await readMessage(stream);
      const requestText = new TextDecoder().decode(requestBytes);
      const request = JSON.parse(requestText) as unknown;

      if (!isValidChunkRequest(request)) {
        await sendErrorResponse(stream, 'Invalid chunk request format');
        return;
      }

      const { modelId, chunkIndex } = request;
      const manifest = registry.getById(modelId);

      if (!manifest) {
        await sendErrorResponse(stream, 'Model not found in registry');
        return;
      }

      if (chunkIndex < 0 || chunkIndex >= manifest.totalChunks) {
        await sendErrorResponse(stream, 'Chunk index out of bounds');
        return;
      }

      const chunkName = `chunk_${chunkIndex.toString().padStart(4, '0')}.bin`;
      const chunkPath = join(deliveryRoot, 'models', modelId, chunkName);

      try {
        const chunkData = await readFile(chunkPath);
        await sendSuccessResponse(stream, chunkData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        await sendErrorResponse(stream, `Failed to read chunk: ${msg}`);
      }
    } catch (err: unknown) {
      console.error(`[ModelSeeder] Error handling request on stream ${stream.id}:`, err);
      try {
        const msg = err instanceof Error ? err.message : String(err);
        await sendErrorResponse(stream, `Internal server error: ${msg}`);
      } catch {
        // Ignore write errors if stream is already closed
      }
    }
  };
}