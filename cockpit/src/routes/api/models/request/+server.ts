// 1. Relative path: cockpit/src/routes/api/models/request/+server.ts
// 2. Description: Fetches HF metadata and generates a one-time approval nonce. Handles offline degradation.
// 3. Expects: JSON body with `url` and `selectedFiles`.
// 4. Provides: Metadata DTO and a nonce to feed the Approval Gate modal.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { fetchHuggingFaceMetadata, parseHuggingFaceUrl, sanitizeModelId, type HuggingFaceMetadata } from '$core/models/index.js';
import type { ModelFile } from '$core/models/index.js';

interface RequestBody {
  readonly url: string;
  readonly selectedFiles: ReadonlyArray<string>;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as RequestBody;
  if (!body.url) throw error(400, 'Missing URL');

  const token = locals.credentialManager?.getHuggingFaceToken();

  try {
    const metadata: HuggingFaceMetadata = await fetchHuggingFaceMetadata(body.url, token);
    
    const filteredFiles: ReadonlyArray<ModelFile> = metadata.files
      .filter(f => body.selectedFiles.length === 0 || body.selectedFiles.includes(f.rfilename))
      .map(f => ({
        path: f.rfilename,
        sizeBytes: f.sizeBytes ?? 0,
        isRequired: true,
      }));
      
    const nonce = locals.approvalGate.generateNonce(metadata.repoId, filteredFiles);
    
    return json({ metadata, filteredFiles, nonce, degraded: false });
  } catch (err: unknown) {
    // Narrow unknown: Check for network failure (TypeError is thrown by fetch on network error)
    const isNetworkError = err instanceof TypeError || 
      (err instanceof Error && (err.message.includes('fetch failed') || err.message.includes('Network error')));
    
    if (isNetworkError) {
      try {
        const repoId = parseHuggingFaceUrl(body.url);
        const degradedMetadata = {
          repoId,
          sanitizedModelId: sanitizeModelId(repoId),
          pipelineTag: null,
          tags: [] as ReadonlyArray<string>,
          files: [] as ReadonlyArray<{ rfilename: string; sizeBytes: number | null }>,
          totalSizeBytes: 0,
          isSizeAccurate: false,
        };
        const nonce = locals.approvalGate.generateNonce(repoId, []);
        return json({ metadata: degradedMetadata, filteredFiles: [], nonce, degraded: true });
      } catch (parseErr: unknown) {
        throw error(400, parseErr instanceof Error ? parseErr.message : 'Invalid URL');
      }
    }
    
    const msg = err instanceof Error ? err.message : String(err);
    throw error(400, msg);
  }
};