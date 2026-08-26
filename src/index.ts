// src/index.ts
// Description: Main entry point for the SwISD application, starting the observation plane and graceful shutdown.
// Expects: Node.js process environment and local development configuration.
// Provides: A resilient application instance with token-guarded local observability dashboard.

import { SwISDError } from './errors.js';
import { createAdminServer } from './admin/index.js';
import type { AdminServerHandle } from './admin/index.js';
import { ObservabilityEventBus, createDevObservabilitySource } from './observability/index.js';
import type { DevObservabilitySource } from './observability/index.js';
import {
  createAdminToken,
  parseBoolean,
  parsePeerRole,
  parsePort,
} from './utils.js';

class SwISDApp {
  private isShuttingDown = false;
  private adminServer: AdminServerHandle | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private source: DevObservabilitySource | undefined;

  public async start(): Promise<void> {
    console.log('[SwISD] Initializing decentralized swarm node...');

    const eventBus = new ObservabilityEventBus(500);

    const role = parsePeerRole(process.env.SWISD_ROLE);
    const peerId = process.env.SWISD_DEV_PEER_ID ?? `dev-${process.pid}-${Date.now().toString(36)}`;
    const version = process.env.SWISD_VERSION ?? '0.0.1';

    const source = createDevObservabilitySource(
      {
        peerId,
        role,
        version,
        configSource: 'env',
        startedAt: Date.now(),
      },
      eventBus
    );

    this.source = source;
    source.tick();

    this.heartbeatTimer = setInterval(() => {
      source.tick();
    }, 5000);

    this.heartbeatTimer.unref();

    const token = process.env.SWISD_ADMIN_TOKEN ?? createAdminToken();
    const host = process.env.SWISD_ADMIN_HOST ?? '127.0.0.1';
    const allowLan = parseBoolean(process.env.SWISD_ALLOW_LAN_ADMIN, false);
    const enableCors = parseBoolean(process.env.SWISD_ADMIN_CORS, true);
    const port = parsePort(process.env.SWISD_ADMIN_PORT, 4101);

    const adminServer = createAdminServer({
      host,
      port,
      token,
      allowLan,
      enableCors,
      source,
      eventBus,
    });

    await adminServer.start();
    this.adminServer = adminServer;

    console.log(`[SwISD] Observation dashboard available at ${adminServer.url()}`);

    if (!process.env.SWISD_ADMIN_TOKEN) {
      console.log(`[SwISD] Generated admin token: ${token}`);
    }

    this.registerShutdownHooks();

    console.log('[SwISD] Node started successfully.');
  }

  private registerShutdownHooks(): void {
    const handleShutdown = (signal: string): void => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      console.log(`[SwISD] Received ${signal}. Initiating graceful shutdown...`);

      void this.shutdown(signal)
        .then(() => {
          console.log('[SwISD] Graceful shutdown complete. Exiting.');
          process.exit(0);
        })
        .catch((error: unknown) => {
          console.error('[SwISD] Error during shutdown:', error);
          process.exit(1);
        });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  }

  private async shutdown(signal: string): Promise<void> {
    console.log(`[SwISD] Shutting down due to ${signal}.`);

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    if (this.adminServer) {
      await this.adminServer.stop();
      this.adminServer = undefined;
    }

    this.source = undefined;
  }
}

const app = new SwISDApp();

app.start().catch((error: unknown) => {
  const err = error instanceof Error
    ? error
    : new SwISDError('ERR_UNKNOWN', `Fatal startup error: ${String(error)}`);

  console.error('[SwISD] Fatal startup error:', err);
  process.exit(1);
});