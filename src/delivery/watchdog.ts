// 1. Relative path: src/delivery/watchdog.ts
// 2. Description: Watchdog logic for the supervisor to monitor app heartbeats and trigger rollbacks.
// 3. Expects: Paths to heartbeat and status files, grace period, and restart callback.
// 4. Provides: Periodic checking of the heartbeat file and automatic rollback invocation on timeout.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SupervisorStatus } from '../types.js';
import { isAppHeartbeat, isSupervisorStatus } from './schema.js';
import { DeliveryWatchdogError } from '../errors.js';

export interface WatchdogConfig {
  readonly deliveryRoot: string;
  readonly gracePeriodMs: number;
  readonly supervisorVersion: string;
  readonly onRestart: () => Promise<void>;
  readonly onRollback: () => Promise<void>;
}

export class DeliveryWatchdog {
  private readonly stateDir: string;
  private readonly heartbeatPath: string;
  private readonly statusPath: string;
  private readonly gracePeriodMs: number;
  private readonly supervisorVersion: string;
  private readonly onRestart: () => Promise<void>;
  private readonly onRollback: () => Promise<void>;
  private timer: ReturnType<typeof setInterval> | undefined;
  private status: SupervisorStatus;

  constructor(config: WatchdogConfig) {
    this.stateDir = join(config.deliveryRoot, 'state');
    this.heartbeatPath = join(this.stateDir, 'app-heartbeat.json');
    this.statusPath = join(this.stateDir, 'supervisor-status.json');
    this.gracePeriodMs = config.gracePeriodMs;
    this.supervisorVersion = config.supervisorVersion;
    this.onRestart = config.onRestart;
    this.onRollback = config.onRollback;
    
    this.status = {
      supervisorVersion: this.supervisorVersion,
      isRunning: true,
      currentAppVersion: null,
      previousAppVersion: null,
      targetUpdateVersion: null,
      updateStatus: 'idle',
      lastHeartbeatCheck: null,
      lastError: null,
      rollbackReason: null,
    };
  }

  private async updateStatus(partial: Partial<SupervisorStatus>): Promise<void> {
    this.status = { ...this.status, ...partial };
    try {
      await writeFile(this.statusPath, JSON.stringify(this.status, null, 2), { encoding: 'utf-8' });
    } catch (error) {
      console.error('[Watchdog] Failed to write supervisor status:', error);
    }
  }

  private async checkHeartbeat(): Promise<void> {
    try {
      const raw = await readFile(this.heartbeatPath, { encoding: 'utf-8' });
      const parsed = JSON.parse(raw) as unknown;
      
      if (!isAppHeartbeat(parsed)) {
        throw new DeliveryWatchdogError('Invalid heartbeat schema');
      }

      const ageMs = Date.now() - parsed.timestamp;
      
      await this.updateStatus({ 
        lastHeartbeatCheck: Date.now(), 
        lastError: null,
        rollbackReason: null,
        currentAppVersion: parsed.version 
      });

      if (ageMs > this.gracePeriodMs) {
        console.error(`[Watchdog] Heartbeat stale by ${ageMs}ms. Triggering rollback.`);
        await this.updateStatus({ 
          updateStatus: 'reverting', 
          rollbackReason: `Heartbeat timeout: ${ageMs}ms` 
        });
        await this.onRollback();
        await this.onRestart();
        await this.updateStatus({ updateStatus: 'idle' });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown heartbeat read error';
      await this.updateStatus({ lastError: msg, lastHeartbeatCheck: Date.now() });
    }
  }

  public start(): void {
    void this.updateStatus({ isRunning: true });
    this.timer = setInterval(() => {
      void this.checkHeartbeat();
    }, Math.min(this.gracePeriodMs / 2, 10000)); 
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    void this.updateStatus({ isRunning: false });
  }
}