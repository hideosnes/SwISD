/**
 * 1. Relative path: cockpit/src/lib/server/sessionLock.ts
 * 2. Description: UI-only Argon2id session lock.
 * 3. Expects: A state directory path.
 * 4. Provides: Persistent session password hashing and lock state management.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { hashArgon2id, verifyArgon2id } from '$core/crypto/argon2.js';
import { DeliveryFilesystemError } from '$core/errors.js';

interface SessionLockFile {
  readonly hash: string;
}

export class SessionLock {
  private readonly cockpitDir: string;
  private readonly lockPath: string;
  private hash: string | null = null;
  private unlocked = true;

  constructor(stateDir: string) {
    this.cockpitDir = join(stateDir, 'cockpit');
    this.lockPath = join(this.cockpitDir, 'session-lock.json');
  }

  public async initialize(): Promise<void> {
    await mkdir(this.cockpitDir, { recursive: true });
    try {
      await access(this.lockPath);
      const raw = await readFile(this.lockPath, 'utf-8');
      const parsed = JSON.parse(raw) as SessionLockFile;
      this.hash = parsed.hash;
      this.unlocked = false; // Locked by default if a password exists
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        this.hash = null;
        this.unlocked = true;
      } else {
        throw new DeliveryFilesystemError('Failed to load session lock', err);
      }
    }
  }

  public isLocked(): boolean {
    return this.hash !== null && !this.unlocked;
  }

  public hasPassword(): boolean {
    return this.hash !== null;
  }

  public async setPassword(phrase: string): Promise<void> {
    const encoder = new TextEncoder();
    this.hash = hashArgon2id(encoder.encode(phrase));
    await writeFile(this.lockPath, JSON.stringify({ hash: this.hash }, null, 2), 'utf-8');
    this.unlocked = true;
  }

  public async verify(phrase: string): Promise<boolean> {
    if (!this.hash) return true;
    const encoder = new TextEncoder();
    const ok = verifyArgon2id(encoder.encode(phrase), this.hash);
    if (ok) this.unlocked = true;
    return ok;
  }

  public lock(): void {
    if (this.hash) this.unlocked = false;
  }
}