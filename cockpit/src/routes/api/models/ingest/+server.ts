// 1. Relative path: cockpit/src/routes/api/models/ingest/+server.ts
// 2. Description: BFF API endpoint that receives a streamed model file from the browser, chunks it, and writes it to the local model cache.
// 3. Expects: A raw binary POST request with an X-Model-Name header.
// 4. Provides: A strictly typed ModelManifest DTO upon successful ingestion.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ingestModelStream } from '$core/models/index.js';

async function* readableStreamToAsyncIterable(stream: ReadableStream<Uint8Array>): AsyncIterable<Uint8Array> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const fileName = request.headers.get('X-Model-Name') ?? 'unknown.gguf';
  const body = request.body;
  
  if (!body) {
    throw error(400, 'Missing request body');
  }

  const deliveryRoot = process.env.SWISD_DELIVERY_ROOT ?? '../.swisd/delivery';
  const asyncIterable = readableStreamToAsyncIterable(body);
  
  const manifest = await ingestModelStream(asyncIterable, fileName, deliveryRoot);
  
  return json(manifest);
};