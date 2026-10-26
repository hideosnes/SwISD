// 1. Relative path: cockpit/src/routes/api/models/status/+server.ts
// 2. Description: Server-Sent Events (SSE) endpoint for real-time model download progress telemetry.
// 3. Expects: None.
// 4. Provides: A continuous stream of DownloadProgress DTOs for active downloads, using ruthless polling to bypass EventEmitter desync.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	const encoder = new TextEncoder();
	let interval: ReturnType<typeof setInterval> | null = null;

	const stopInterval = (): void => {
		if (interval !== null) {
			clearInterval(interval);
			interval = null;
		}
	};

	const stream = new ReadableStream({
		start(controller) {
			// Send an initial ping so the client knows the connection is alive
			controller.enqueue(encoder.encode(`data: {"status":"connected"}\n\n`));

			// Ruthless polling: bypasses EventEmitter listener desync entirely.
			// Reads from the shared downloadProgress state populated by hooks.server.ts
			interval = setInterval(() => {
				try {
					for (const data of Object.values(locals.downloadProgress)) {
						const payload = JSON.stringify(data);
						controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
					}
				} catch {
					// Stream might be closed by the client
					stopInterval();
				}
			}, 500);
		},
		cancel() {
			// cancel() is the supported teardown path for disconnected SSE clients.
			stopInterval();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no' // Prevent Nginx/proxy buffering
		}
	});
};
