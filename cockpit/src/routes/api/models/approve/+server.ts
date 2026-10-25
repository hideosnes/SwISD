// 1. Relative path: cockpit/src/routes/api/models/approve/+server.ts
// 2. Description: Consumes the approval nonce and starts the download pipeline with explicitly selected files.
// 3. Expects: JSON body with `nonce`, `requiredCapability`, and `selectedFiles` (with path and sizeBytes).
// 4. Provides: Hard-block enforcement. Silent downloads are structurally impossible.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import type { ModelFile } from '$core/models/index.js';

type Capability = 'inference' | 'embedding' | 'vision';

interface FileSelection {
  readonly path: string;
  readonly sizeBytes: number;
}

interface ApproveRequestBody {
  readonly nonce: string;
  readonly requiredCapability: Capability;
  readonly selectedFiles: ReadonlyArray<FileSelection>;
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

  if (!body.selectedFiles || body.selectedFiles.length === 0) {
    throw error(400, 'No files selected for download.');
  }
  
  const approvalReq = locals.approvalGate.consumeNonce(body.nonce);
  if (!approvalReq) {
    throw error(403, 'Invalid or expired approval nonce. Silent downloads are forbidden.');
  }

  const filesToDownload: ReadonlyArray<ModelFile> = body.selectedFiles.map((f: FileSelection) => ({
    path: f.path,
    sizeBytes: f.sizeBytes,
    isRequired: true,
  }));

  console.log(`[BFF] Starting download for ${approvalReq.repoId}: ${filesToDownload.length} files selected.`);

  locals.modelDownloader.startDownload(
    approvalReq.repoId,
    filesToDownload,
    body.requiredCapability
  ).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[BFF] Download pipeline failed:', msg);
  });

  return json({ status: 'download_started', modelId: approvalReq.repoId.replace(/\//g, '--') });
};