// 1. Relative path: src/models/approval.ts
// 2. Description: Approval gate for model downloads, generating and consuming one-time nonces.
// 3. Expects: Repo ID and file selections.
// 4. Provides: One-time nonces for secure, explicit operator approval.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { randomBytes } from 'node:crypto';
import type { ModelFile } from './schema.js';

export interface ApprovalRequest {
  readonly repoId: string;
  readonly selectedFiles: ReadonlyArray<ModelFile>;
}

export class ApprovalGate {
  private pendingApprovals = new Map<string, ApprovalRequest>();

  public generateNonce(repoId: string, selectedFiles: ReadonlyArray<ModelFile>): string {
    const nonce = randomBytes(32).toString('hex');
    this.pendingApprovals.set(nonce, { repoId, selectedFiles });
    
    // Auto-expire after 5 minutes to prevent stale nonce accumulation
    setTimeout(() => {
      this.pendingApprovals.delete(nonce);
    }, 5 * 60 * 1000);
    
    return nonce;
  }

  public consumeNonce(nonce: string): ApprovalRequest | undefined {
    const request = this.pendingApprovals.get(nonce);
    if (request) {
      this.pendingApprovals.delete(nonce);
      return request;
    }
    return undefined;
  }
}