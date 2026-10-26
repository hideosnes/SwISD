// 1. Relative path: cockpit/src/routes/api/models/approve/+server.ts
// 2. Description: Consumes the approval nonce, persists the download intent, and starts the pipeline.
// 3. Expects: JSON body with `nonce`, `requiredCapability`, and `selectedFiles`.
// 4. Provides: Hard-block enforcement and optimistic UI handoff.
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
  
  if (!body.nonce) throw error(400, 'Missing approval nonce');
  if (!VALID_CAPABILITIES.has(body.requiredCapability)) throw error(400, `Invalid capability.`);
  if (!body.selectedFiles || body.selectedFiles.length === 0) throw error(400, 'No files selected.');
  
  const approvalReq = locals.approvalGate.consumeNonce(body.nonce);
  if (!approvalReq) throw error(403, 'Invalid or expired approval nonce.');

  const filesToDownload: ReadonlyArray<ModelFile> = body.selectedFiles.map((f: FileSelection) => ({
    path: f.path, sizeBytes: f.sizeBytes, isRequired: true,
  }));

  const modelId = approvalReq.repoId.replace(/\//g, '--');
  const totalSizeBytes = filesToDownload.reduce((sum: number, f: ModelFile) => sum + f.sizeBytes, 0);
  
  const sourcePeerId = locals.peerId || 'unknown-conductor';

  // Persist the intent with the pre-calculated total size
  await locals.intentRegistry.save({
    modelId,
    repoId: approvalReq.repoId,
    requiredCapability: body.requiredCapability,
    sourcePeerId,
    totalSizeBytes,
    createdAt: Date.now()
  });

  locals.modelDownloader.startDownload(
    approvalReq.repoId,
    filesToDownload,
    body.requiredCapability,
    sourcePeerId
  ).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[BFF] Download pipeline failed:', msg);
  });

  return json({ 
    status: 'download_started', 
    model: { modelId, repoId: approvalReq.repoId, totalSizeBytes, requiredCapability: body.requiredCapability }
  });
};