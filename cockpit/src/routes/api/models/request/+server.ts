/**
 * 1. Relative path: cockpit/src/routes/api/models/request/+server.ts
 * 2. Description: Fetches HF metadata and generates a one-time approval nonce.
 * 3. Expects: JSON body with `url` and `selectedFiles`.
 * 4. Provides: Metadata DTO and a nonce to feed the Approval Gate modal.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { fetchHuggingFaceMetadata, type HuggingFaceMetadata } from '$core/models/index.js';
import type { ModelFile } from '$core/models/index.js';

interface RequestBody {
  readonly url: string;
  readonly selectedFiles: ReadonlyArray<string>;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as RequestBody;
  if (!body.url) throw error(400, 'Missing URL');

  try {
    const metadata: HuggingFaceMetadata = await fetchHuggingFaceMetadata(body.url);
    
    // Map HF file metadata to core ModelFile shape for the approval gate
    const filteredFiles: ReadonlyArray<ModelFile> = metadata.files
      .filter(f => body.selectedFiles.includes(f.rfilename))
      .map(f => ({
        path: f.rfilename,
        sizeBytes: f.sizeBytes ?? 0,
        isRequired: true,
      }));
      
    const nonce = locals.approvalGate.generateNonce(metadata.repoId, filteredFiles);
    
    return json({ metadata, filteredFiles, nonce });
  } catch (err: unknown) {
    throw error(500, err instanceof Error ? err.message : 'Failed to fetch metadata');
  }
};