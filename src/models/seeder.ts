// 1. Relative path: src/models/seeder.ts
// 2. Description: libp2p stream handler for serving model chunks to neighboring peers (micro-torrent layer).
// 3. Expects: A ModelRegistry and delivery root path.
// 4. Provides: A strictly typed protocol handler for `/swisd/model/1.0.0` that validates requests and streams chunk data.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { readFile } from 'node:fs/promises';
import type { ModelRegistry } from './registry.js';
import type { ChunkRequest } from './schema.js';
import { chunkPath, closeQuietly, encodeChunkError, readFrame, writeFrame, FRAME_STATUS_ERROR, FRAME_STATUS_SUCCESS } from './framing.js';
import { SwISDError } from '../errors.js';
import type { Stream } from '@libp2p/interface';

function isValidChunkRequest(req: unknown): req is ChunkRequest {
  const r = req as Record<string, unknown>;
  return (
    typeof r?.modelId === 'string' &&
    typeof r?.chunkIndex === 'number' &&
    Number.isInteger(r.chunkIndex) &&
    r.chunkIndex >= 0
  );
}

/** Answer with an error frame, then close — never leave a leech hanging on our silence. */
async function sendChunkError(stream: Stream, message: string): Promise<void> {
  await writeFrame(stream, FRAME_STATUS_ERROR, encodeChunkError(message));
  await closeQuietly(stream);
}

export function createModelSeederHandler(
  registry: ModelRegistry,
  deliveryRoot: string
) {
  return async (stream: Stream) => {
    console.debug(`[ModelSeeder] Incoming chunk request on stream ${stream.id}`);

    try {
      const frame = await readFrame(stream);

      let request: unknown;
      if (frame.status === FRAME_STATUS_SUCCESS) {
        try {
          request = JSON.parse(new TextDecoder().decode(frame.payload)) as unknown;
        } catch {
          request = undefined;
        }
      }

      if (request === undefined || !isValidChunkRequest(request)) {
        await sendChunkError(stream, 'Invalid chunk request format');
        return;
      }

      const { modelId, chunkIndex } = request;
      const manifest = registry.getById(modelId);

      if (!manifest) {
        await sendChunkError(stream, 'Model not found in registry');
        return;
      }

      if (chunkIndex < 0 || chunkIndex >= manifest.totalChunks) {
        await sendChunkError(stream, 'Chunk index out of bounds');
        return;
      }

      const chunkData = await readFile(chunkPath(deliveryRoot, modelId, chunkIndex));
      await writeFrame(stream, FRAME_STATUS_SUCCESS, chunkData);
      await closeQuietly(stream);
    } catch (err: unknown) {
      console.error(`[ModelSeeder] Error handling request on stream ${stream.id}:`, err);
      await sendChunkError(stream, `Internal server error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
}