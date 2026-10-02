/**
 * 1. Relative path: cockpit/src/routes/api/models/approve/+server.ts
 * 2. Description: Consumes the approval nonce and starts the download pipeline.
 * 3. Expects: JSON body with `nonce` and `requiredCapability`.
 * 4. Provides: Hard-block enforcement. Silent downloads are structurally impossible.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

interface ApproveRequestBody {
  readonly nonce: string;
  readonly requiredCapability: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as ApproveRequestBody;
  
  const approvalReq = locals.approvalGate.consumeNonce(body.nonce);
  if (!approvalReq) {
    throw error(403, 'Invalid or expired approval nonce. Silent downloads are forbidden.');
  }

  locals.modelDownloader.startDownload(
    approvalReq.repoId,
    approvalReq.selectedFiles,
    body.requiredCapability
  ).catch((err: unknown) => {
    console.error('[BFF] Download failed:', err instanceof Error ? err.message : err);
  });

  return json({ status: 'download_started', modelId: approvalReq.repoId.replace(/\//g, '--') });
};