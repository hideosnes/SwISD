// 1. Relative path: src/delivery/heartbeat.ts
// 2. Description: Lightweight, non-blocking app heartbeat writer for the SwISD delivery mechanism.
// 3. Expects: Delivery root path, peer ID, app version, and process PID.
// 4. Provides: Periodic, unref'd writes to app-heartbeat.json without blocking the main event loop.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { AppHeartbeat } from '../types.js';
import { DeliveryFilesystemError } from '../errors.js';

export interface HeartbeatWriterConfig {
  readonly deliveryRoot: string;
  readonly peerId: string;
  readonly version: string;
  readonly intervalMs: number;
}

export class HeartbeatWriter {
  private readonly stateDir: string;
  private readonly heartbeatPath: string;
  private readonly peerId: string;
  private readonly version: string;
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(config: HeartbeatWriterConfig) {
    this.stateDir = join(config.deliveryRoot, 'state');
    this.heartbeatPath = join(this.stateDir, 'app-heartbeat.json');
    this.peerId = config.peerId;
    this.version = config.version;
    this.intervalMs = config.intervalMs;
  }

  public async ensureStateDir(): Promise<void> {
    try {
      await mkdir(this.stateDir, { recursive: true });
    } catch (error) {
      throw new DeliveryFilesystemError(`Failed to create state directory: ${this.stateDir}`, error);
    }
  }

  public async writeOnce(): Promise<void> {
    const heartbeat: AppHeartbeat = {
      timestamp: Date.now(),
      version: this.version,
      peerId: this.peerId,
      pid: process.pid,
    };
    
    try {
      await writeFile(this.heartbeatPath, JSON.stringify(heartbeat), { encoding: 'utf-8' });
    } catch (error) {
      throw new DeliveryFilesystemError(`Failed to write heartbeat to ${this.heartbeatPath}`, error);
    }
  }

  public start(): void {
    void this.writeOnce();
    this.timer = setInterval(() => {
      void this.writeOnce();
    }, this.intervalMs);
    this.timer.unref();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}