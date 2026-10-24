// 1. Relative path: cockpit/src/routes/api/models/approve/+server.ts
// 2. Description: Consumes the approval nonce and starts the download pipeline.
// 3. Expects: JSON body with `nonce` and `requiredCapability`.
// 4. Provides: Hard-block enforcement. Silent downloads are structurally impossible.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

type Capability = 'inference' | 'embedding' | 'vision';

interface ApproveRequestBody {
  readonly nonce: string;
  readonly requiredCapability: Capability;
}

const VALID_CAPABILITIES: ReadonlySet<Capability> = new Set(['inference', 'embedding', 'vision']);

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as ApproveRequestBody;
  
  if (!body.nonce) {
    throw error(400, 'Missing approval nonce');
  }

  if (!VALID_CAPABILITIES.has(body.requiredCapability)) {
    throw error(400, `Invalid capability. Expected one of: ${Array.from(VALID_CAPABILITIES).join(', ')}`);
  }
  
  const approvalReq = locals.approvalGate.consumeNonce(body.nonce);
  if (!approvalReq) {
    throw error(403, 'Invalid or expired approval nonce. Silent downloads are forbidden.');
  }

  locals.modelDownloader.startDownload(
    approvalReq.repoId,
    approvalReq.selectedFiles,
    body.requiredCapability
  ).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[BFF] Download pipeline failed:', msg);
    // Note: We do not throw here to the client, as the approval was valid. 
    // The failure is handled asynchronously by the downloader's internal state/telemetry.
  });

  return json({ status: 'download_started', modelId: approvalReq.repoId.replace(/\//g, '--') });
};