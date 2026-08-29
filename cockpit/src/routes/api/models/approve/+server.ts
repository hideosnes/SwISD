// 1. Relative path: cockpit/src/routes/api/models/approve/+server.ts
// 2. Description: Consumes the approval nonce and starts the download pipeline.
// 3. Expects: JSON body with `nonce` and `requiredCapability`.
// 4. Provides: Hard-block enforcement. Silent downloads are structurally impossible.

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { nonce, requiredCapability } = await request.json() as { nonce: string; requiredCapability: string };
  
  const approvalReq = locals.approvalGate.consumeNonce(nonce);
  if (!approvalReq) {
    throw error(403, 'Invalid or expired approval nonce. Silent downloads are forbidden.');
  }

  locals.modelDownloader.startDownload(
    approvalReq.repoId,
    approvalReq.selectedFiles,
    requiredCapability
  ).catch(err => console.error('[BFF] Download failed:', err));

  return json({ status: 'download_started', modelId: approvalReq.repoId.replace(/\//g, '--') });
};