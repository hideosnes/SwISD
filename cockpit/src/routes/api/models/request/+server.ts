// 1. Relative path: cockpit/src/routes/api/models/request/+server.ts
// 2. Description: Fetches HF metadata and generates a one-time approval nonce.
// 3. Expects: JSON body with `url` and `selectedFiles`.
// 4. Provides: Metadata DTO and a nonce to feed the Approval Gate modal.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { fetchHuggingFaceMetadata } from '$core/models/index.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { url, selectedFiles } = await request.json() as { url: string; selectedFiles: string[] };
  if (!url) throw error(400, 'Missing URL');

  try {
    const metadata = await fetchHuggingFaceMetadata(url);
    const filteredFiles = metadata.files
      .filter(f => selectedFiles.includes(f.rfilename))
      .map(f => ({ path: f.rfilename, sizeBytes: f.sizeBytes ?? 0, isRequired: true }));
      
    const nonce = locals.approvalGate.generateNonce(metadata.repoId, filteredFiles);
    
    return json({ metadata, filteredFiles, nonce });
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'Failed to fetch metadata');
  }
};