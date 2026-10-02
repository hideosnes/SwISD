/**
 * 1. Relative path: src/ownership/recoveryRateLimiter.ts
 * 2. Description: Persisted rate limiter for recovery phrase attempts.
 * 3. Expects: An ownership state directory.
 * 4. Provides: Restart-proof rate limiting (5 attempts/hour) shared between the active Keystone and the Succession Ceremony.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { readFile, writeFile, rename, access } from 'node:fs/promises';
import { join } from 'node:path';
import { RateLimitError, DeliveryFilesystemError } from '../errors.js';

export interface RateLimiterConfig {
  readonly ownershipDir: string;
  readonly windowMs?: number;
  readonly maxAttempts?: number;
}

export class RecoveryRateLimiter {
  private readonly attemptsPath: string;
  private readonly attemptsTempPath: string;
  private readonly windowMs: number;
  private readonly maxAttempts: number;
  private attempts: number[] = [];
  private loaded = false;

  constructor(config: RateLimiterConfig) {
    this.attemptsPath = join(config.ownershipDir, 'recovery-attempts.json');
    this.attemptsTempPath = join(config.ownershipDir, 'recovery-attempts.json.tmp');
    this.windowMs = config.windowMs ?? 60 * 60 * 1000;
    this.maxAttempts = config.maxAttempts ?? 5;
  }

  public async initialize(): Promise<void> {
    if (this.loaded) return;
    try {
      await access(this.attemptsPath);
      const raw = await readFile(this.attemptsPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        this.attempts = parsed.filter((t): t is number => typeof t === 'number' && Number.isFinite(t));
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        this.attempts = [];
      } else {
        // Fail closed: corrupt file assumes maximum rate limit to prevent brute force.
        const now = Date.now();
        this.attempts = Array.from({ length: this.maxAttempts }, () => now);
      }
    }
    this.loaded = true;
  }

  public check(): void {
    if (!this.loaded) throw new Error('RecoveryRateLimiter must be initialized before checking');
    const now = Date.now();
    this.attempts = this.attempts.filter(t => now - t < this.windowMs);
    if (this.attempts.length >= this.maxAttempts) {
      const oldestInWindow = this.attempts[0]!;
      const retryAfterMs = this.windowMs - (now - oldestInWindow);
      throw new RateLimitError(retryAfterMs);
    }
  }

  public async recordAttempt(): Promise<void> {
    if (!this.loaded) await this.initialize();
    this.attempts.push(Date.now());
    await this.persist();
  }

  public async reset(): Promise<void> {
    if (!this.loaded) await this.initialize();
    this.attempts = [];
    await this.persist();
  }

  private async persist(): Promise<void> {
    const raw = JSON.stringify(this.attempts, null, 2);
    try {
      await writeFile(this.attemptsTempPath, raw, 'utf-8');
      await rename(this.attemptsTempPath, this.attemptsPath);
    } catch (err: unknown) {
      throw new DeliveryFilesystemError(`Failed to atomically write ${this.attemptsPath}`, err);
    }
  }
}