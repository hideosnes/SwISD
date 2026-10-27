/**
 * 1. Relative path: src/models/framing.ts
 * 2. Description: Shared wire framing for the model chunk protocol — every message is [status:u8][length:u32 BE][payload].
 * 3. Expects: @libp2p/interface Streams (AsyncIterable read side, send/onDrain write side with backpressure).
 * 4. Provides: readFrame/writeFrame with a payload cap, chunk-error encoding, the chunk path convention, and the protocol string.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { join } from 'node:path';
import type { Stream } from '@libp2p/interface';
import { SwISDError } from '../errors.js';

export const CHUNK_PROTOCOL = '/swisd/model/1.1.0';
export const MAX_FRAME_PAYLOAD = 10 * 1024 * 1024;

export const FRAME_STATUS_SUCCESS = 0x00;
export const FRAME_STATUS_ERROR = 0x01;
export type FrameStatus = typeof FRAME_STATUS_SUCCESS | typeof FRAME_STATUS_ERROR;

export interface ChunkFrame {
  readonly status: FrameStatus;
  readonly payload: Uint8Array;
}

const FRAME_HEADER_BYTES = 5;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Storage convention shared by ingest, seeder, and fetcher — one writer, one truth. */
export function chunkFileName(chunkIndex: number): string {
  return `chunk_${chunkIndex.toString().padStart(4, '0')}.bin`;
}

export function chunkPath(deliveryRoot: string, modelId: string, chunkIndex: number): string {
  return join(deliveryRoot, 'models', modelId, chunkFileName(chunkIndex));
}

/**
 * Read exactly one status-framed message. The reader buffers cross-chunk leftovers
 * internally, so frames may arrive split at any byte boundary the transport chooses.
 */
export async function readFrame(stream: Stream, maxPayload: number = MAX_FRAME_PAYLOAD): Promise<ChunkFrame> {
  const iterator = stream[Symbol.asyncIterator]();
  let leftover: Uint8Array | undefined;

  const nextSegment = async (): Promise<Uint8Array> => {
    if (leftover !== undefined && leftover.length > 0) {
      const held = leftover;
      leftover = undefined;
      return held;
    }
    const { done, value } = await iterator.next();
    if (done || value === undefined) {
      throw new SwISDError('ERR_INVALID_STATE', 'Stream closed before frame completed');
    }
    // Streams may yield Uint8ArrayList batches: normalize to a flat view.
    return value instanceof Uint8Array ? value : value.subarray();
  };

  const readExact = async (count: number): Promise<Uint8Array> => {
    const out = new Uint8Array(count);
    let offset = 0;
    while (offset < count) {
      const segment = await nextSegment();
      const room = count - offset;
      if (segment.length > room) {
        out.set(segment.subarray(0, room), offset);
        leftover = segment.subarray(room);
        offset += room;
      } else {
        out.set(segment, offset);
        offset += segment.length;
      }
    }
    return out;
  };

  const header = await readExact(FRAME_HEADER_BYTES);
  const status = header[0] ?? 0xff;
  if (status !== FRAME_STATUS_SUCCESS && status !== FRAME_STATUS_ERROR) {
    throw new SwISDError('ERR_INVALID_STATE', `Unknown frame status 0x${status.toString(16)}`);
  }
  const length = new DataView(header.buffer, 1, 4).getUint32(0, false);
  if (length > maxPayload) {
    throw new SwISDError('ERR_INVALID_STATE', `Frame payload of ${length.toString()} exceeds the ${maxPayload.toString()} byte cap`);
  }
  const payload = await readExact(length);
  return { status, payload };
}

/**
 * Write one status-framed message. Consults stream.onDrain for parts the
 * transport could not buffer immediately, keeping backpressure honest.
 */
export async function writeFrame(stream: Stream, status: FrameStatus, payload: Uint8Array): Promise<void> {
  const header = new Uint8Array(FRAME_HEADER_BYTES);
  header[0] = status;
  new DataView(header.buffer).setUint32(1, payload.length, false);

  if (!stream.send(header)) await stream.onDrain();
  if (payload.length > 0 && !stream.send(payload)) await stream.onDrain();
}

/** Peer-error payloads are JSON { error: string } — one encoder, one decoder, both directions. */
export function encodeChunkError(message: string): Uint8Array {
  return textEncoder.encode(JSON.stringify({ error: message }));
}

export function decodeChunkError(payload: Uint8Array): string {
  const raw = textDecoder.decode(payload);
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.error === 'string') return parsed.error;
    // Well-formed JSON without an error field carries no useful prose.
    return 'Unknown peer error';
  } catch {
    // Not JSON: pass the raw text through (or the fallback when empty).
    return raw.length > 0 ? raw : 'Unknown peer error';
  }
}

/** Close a stream without being able to fail an episode over it. */
export async function closeQuietly(stream: Stream | undefined): Promise<void> {
  if (!stream) return;
  try {
    await stream.close();
  } catch {
    // The stream is already dead; nothing left to leak.
  }
}
