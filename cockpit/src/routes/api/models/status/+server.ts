// 1. Relative path: cockpit/src/routes/api/models/status/+server.ts
// 2. Description: Minimal SSE bridge for real-time download progress telemetry.
// 3. Expects: GET request.
// 4. Provides: A text/event-stream of DownloadProgress events.

import type { RequestHandler } from './$types.js';
import type { DownloadProgress } from '$core/models/index.js';

export const GET: RequestHandler = async ({ locals, request }) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const onProgress = (progress: DownloadProgress) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
        } catch (e) {
          // Stream closed by client
        }
      };

      locals.modelDownloader.on('progress', onProgress);

      request.signal.addEventListener('abort', () => {
        locals.modelDownloader.off('progress', onProgress);
        try { controller.close(); } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};