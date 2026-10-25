// 1. Relative path: cockpit/src/routes/api/models/status/+server.ts
// 2. Description: Server-Sent Events (SSE) endpoint for real-time model download progress telemetry.
// 3. Expects: None.
// 4. Provides: A continuous stream of DownloadProgress DTOs for active downloads.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const onProgress = (data: unknown) => {
        const payload = JSON.stringify(data);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      locals.modelDownloader.on('progress', onProgress);

      // Send an initial ping so the client knows the connection is alive
      controller.enqueue(encoder.encode(`data: {"status":"connected"}\n\n`));

      return () => {
        locals.modelDownloader.removeListener('progress', onProgress);
      };
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