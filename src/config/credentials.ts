// 1. Relative path: src/config/credentials.ts
// 2. Description: Secure storage and validation for external API credentials (e.g., HuggingFace).
// 3. Expects: A state directory path with strict OS permissions.
// 4. Provides: CredentialManager for loading, saving, and validating API tokens.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { readFile, writeFile, chmod, access, constants } from 'node:fs/promises';
import { join } from 'node:path';

export interface StoredCredentials {
  readonly huggingFaceToken?: string;
}

export interface HuggingFaceValidationResult {
  readonly valid: boolean;
  readonly username?: string;
  readonly error?: string;
}

export class CredentialManager {
  private readonly filePath: string;
  private credentials: StoredCredentials = {};

  constructor(stateDir: string) {
    this.filePath = join(stateDir, 'swisd-credentials.json');
  }

  async initialize(): Promise<void> {
    try {
      await access(this.filePath, constants.R_OK);
      const raw = await readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      
      if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        if (typeof obj.huggingFaceToken === 'string') {
          this.credentials = { huggingFaceToken: obj.huggingFaceToken };
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist yet, perfectly normal for first run
        this.credentials = {};
      } else {
        throw new Error(`Failed to load credentials: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  getHuggingFaceToken(): string | undefined {
    return this.credentials.huggingFaceToken;
  }

  async saveHuggingFaceToken(token: string): Promise<void> {
    this.credentials = { ...this.credentials, huggingFaceToken: token };
    await writeFile(this.filePath, JSON.stringify(this.credentials, null, 2), 'utf-8');
    // Strict OS permissions: owner read/write only
    await chmod(this.filePath, 0o600);
  }

  async validateHuggingFaceToken(token: string): Promise<HuggingFaceValidationResult> {
    try {
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { valid: false, error: 'Invalid token. HuggingFace rejected the credentials.' };
        }
        return { valid: false, error: `HuggingFace API returned status ${response.status}.` };
      }

      const data = await response.json() as unknown;
      if (typeof data === 'object' && data !== null && 'name' in data && typeof (data as Record<string, unknown>).name === 'string') {
        return { valid: true, username: (data as Record<string, unknown>).name as string };
      }
      
      return { valid: true }; // Valid but couldn't parse username
    } catch (err: unknown) {
      return { valid: false, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}