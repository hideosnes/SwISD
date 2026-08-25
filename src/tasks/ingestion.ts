// src/tasks/ingestion.ts
// Description: The Adaptive Ingestion Engine. Polymorphically accepts data from Node.js files or Browser streams, chunking it into the Merkle-DAG without memory bloat.
// Expects: An AsyncIterable<Uint8Array> (the universal polymorphic stream interface).
// Provides: A memory-safe, strictly typed chunking pipeline that outputs a Merkle Root CID, treating the Node API and the Browser GUI with equal elegance.

import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { SwISDError } from '../errors.js';

const CHUNK_SIZE = 256 * 1024; // 256 KB

/**
 * The universal polymorphic interface.
 * Both the Node File Adapter and the HTTP Multipart Adapter will yield this.
 */
export type DataStream = AsyncIterable<Uint8Array>;

function concatenateChunks(chunks: ReadonlyArray<Uint8Array>, totalLength: number): Uint8Array {
  const out = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of chunks) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

function toUint8Chunk(chunk: unknown, sourceLabel: string): Uint8Array {
  if (chunk instanceof Uint8Array) {
    // Copy to avoid retaining larger pooled buffers.
    return Uint8Array.from(chunk);
  }

  if (typeof chunk === 'string') {
    return new TextEncoder().encode(chunk);
  }

  if (chunk instanceof ArrayBuffer) {
    return new Uint8Array(chunk.slice(0));
  }

  if (ArrayBuffer.isView(chunk)) {
    const view = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    return Uint8Array.from(view);
  }

  throw new SwISDError(
    'ERR_UNKNOWN',
    `Unexpected chunk type from ${sourceLabel}: ${typeof chunk}`
  );
}

/**
 * Ingests a polymorphic data stream, chunks it, hashes it, and returns the Merkle Root CID.
 * This is the "polite butler" that handles the heavy lifting for both coders and artists.
 */
export async function ingestAndChunkStream(
  stream: DataStream,
  storeChunk: (cid: string, chunk: Uint8Array) => Promise<void>
): Promise<string> {
  const pending: Uint8Array[] = [];
  const leafHashes: string[] = [];
  let pendingLength = 0;

  const flush = async (): Promise<void> => {
    if (pendingLength === 0) return;

    const fullChunk = concatenateChunks(pending, pendingLength);
    const cid = createHash('sha256').update(fullChunk).digest('hex');

    await storeChunk(cid, fullChunk);
    leafHashes.push(cid);

    pending.length = 0;
    pendingLength = 0;
  };

  for await (const incoming of stream) {
    if (!(incoming instanceof Uint8Array)) {
      throw new SwISDError(
        'ERR_UNKNOWN',
        `Ingestion stream yielded non-Uint8Array value: ${typeof incoming}`
      );
    }

    let offset = 0;

    while (offset < incoming.length) {
      const remainingInChunk = CHUNK_SIZE - pendingLength;
      const sliceLength = Math.min(remainingInChunk, incoming.length - offset);
      const slice = incoming.subarray(offset, offset + sliceLength);

      pending.push(Uint8Array.from(slice));
      pendingLength += sliceLength;
      offset += sliceLength;

      if (pendingLength === CHUNK_SIZE) {
        await flush();
      }
    }
  }

  await flush();

  const rootHash = createHash('sha256').update(leafHashes.join('')).digest('hex');
  return rootHash;
}

/**
 * Adapter 1: The Coder's Path. Reads directly from the filesystem.
 */
export async function* nodeFileToStream(filePath: string): DataStream {
  const source: AsyncIterable<unknown> = createReadStream(filePath, {
    highWaterMark: CHUNK_SIZE,
  });

  for await (const raw of source) {
    yield toUint8Chunk(raw, 'file stream');
  }
}

/**
 * Adapter 2: The Artist's Path. Catches the HTTP multipart stream from the GUI.
 */
export async function* httpReqToStream(req: Readable): DataStream {
  const source: AsyncIterable<unknown> = req;

  for await (const raw of source) {
    yield toUint8Chunk(raw, 'HTTP request stream');
  }
}