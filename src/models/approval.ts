// 1. Relative path: src/models/approval.ts
// 2. Description: Hard-block approval gate for model downloads.
// 3. Expects: Repo IDs and selected file lists.
// 4. Provides: One-time, time-limited nonces to make silent background downloads structurally impossible.

import { randomBytes } from 'node:crypto';
import type { ModelFile } from './schema.js';

export interface ApprovalRequest {
  readonly nonce: string;
  readonly repoId: string;
  readonly selectedFiles: ReadonlyArray<ModelFile>;
  readonly createdAt: number;
}

export class ApprovalGate {
  private pendingApprovals = new Map<string, ApprovalRequest>();
  private readonly TTL_MS = 10 * 60 * 1000; // 10 minutes

  public generateNonce(repoId: string, selectedFiles: ReadonlyArray<ModelFile>): string {
    const nonce = randomBytes(16).toString('hex');
    this.pendingApprovals.set(nonce, {
      nonce,
      repoId,
      selectedFiles,
      createdAt: Date.now(),
    });
    this.cleanup();
    return nonce;
  }

  public consumeNonce(nonce: string): ApprovalRequest | null {
    this.cleanup();
    const req = this.pendingApprovals.get(nonce);
    if (!req) return null;
    this.pendingApprovals.delete(nonce);
    return req;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [nonce, req] of this.pendingApprovals) {
      if (now - req.createdAt > this.TTL_MS) {
        this.pendingApprovals.delete(nonce);
      }
    }
  }
}