// 1. Relative path: cockpit/src/routes/api/models/ingest/+server.ts
// 2. Description: BFF API endpoint that receives a streamed model file from the browser, chunks it, and writes it to the local model cache.
// 3. Expects: A raw binary POST request with an X-Model-Name header.
// 4. Provides: A strictly typed ModelManifest DTO upon successful ingestion.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ingestModelStream } from '$core/models/index.js';

async function* readableStreamToAsyncIterable(
	stream: ReadableStream<Uint8Array>
): AsyncIterable<Uint8Array> {
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

export const POST: RequestHandler = async ({ request, locals }) => {
	const fileName = request.headers.get('X-Model-Name') ?? 'unknown.gguf';
	const body = request.body;

	if (!body) throw error(400, 'Missing request body');

	const deliveryRoot = locals.deliveryRoot;
	const asyncIterable = readableStreamToAsyncIterable(body);

	// For local drag-and-drop, we treat the filename as the repoId and select a single file
	const repoId = `local/${fileName}`;
	const selectedFiles = [{ path: fileName, sizeBytes: 0, isRequired: true }];

	const manifest = await ingestModelStream({
		source: asyncIterable,
		repoId,
		selectedFiles,
		requiredCapability: 'generic',
		deliveryRoot,
		// Same Ed25519 signer as every other manifest producer; the sha256 pseudo-signing is retired.
		signPayload: (payload: string) => locals.modelSigner.signPayload(payload),
		sourcePeerId: locals.peerId ?? 'unknown-conductor'
	});

	return json(manifest);
};
