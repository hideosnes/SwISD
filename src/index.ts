// 1. Relative path: src/index.ts
// 2. Description: Main entry point for the SwISD application, starting the observation plane, persistent identity, trust registry, and graceful shutdown.
// 3. Expects: Node.js process environment and local development configuration.
// 4. Provides: A resilient application instance with token-guarded local observability dashboard, persistent peer identity, delivery heartbeat, and OTA update capabilities.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { hostname as osHostname } from 'node:os';
import { SwISDError } from './errors.js';
import { createAdminServer } from './admin/index.js';
import type { AdminServerHandle } from './admin/index.js';
import { ObservabilityEventBus, createDevObservabilitySource } from './observability/index.js';
import type { DevObservabilitySource } from './observability/index.js';
import { HeartbeatWriter, IdentityManager } from './delivery/index.js';
import { Updater } from './delivery/updater.js';
import { TrustRegistry } from './peer/index.js';
import { startAdminDiscovery, type DiscoveryHandle } from './network/index.js';
import {
  createAdminToken,
  parseBoolean,
  parsePeerRole,
  parsePort,
} from './utils.js';

class SwISDApp {
  private isShuttingDown = false;
  private adminServer: AdminServerHandle | undefined;
  private source: DevObservabilitySource | undefined;
  private heartbeatWriter: HeartbeatWriter | undefined;
  private identityManager: IdentityManager | undefined;
  private trustRegistry: TrustRegistry | undefined;
  private discoveryHandle: DiscoveryHandle | undefined;
  private updater: Updater | undefined;

  public async start(): Promise<void> {
    console.log('[SwISD] Initializing decentralized swarm node...');

    const eventBus = new ObservabilityEventBus(500);

    const role = parsePeerRole(process.env.SWISD_ROLE);
    const version = process.env.SWISD_VERSION ?? '0.0.1';
    const deliveryRoot = process.env.SWISD_DELIVERY_ROOT ?? '.swisd/delivery';

    // 1. Bootstrap Persistent Identity
    this.identityManager = new IdentityManager(deliveryRoot);
    await this.identityManager.ensureStateDir();
    const identity = await this.identityManager.getOrCreateIdentity();
    
    const peerId = process.env.SWISD_DEV_PEER_ID ?? identity.peerId;
    if (process.env.SWISD_DEV_PEER_ID) {
      console.warn(`[SwISD] WARNING: Overriding persistent peer identity with SWISD_DEV_PEER_ID: ${peerId}`);
    } else {
      console.log(`[SwISD] Loaded persistent peer identity: ${peerId}`);
    }

    // Sync hostname from install script env var if provided and different
    const envHostname = process.env.SWISD_HOSTNAME;
    if (envHostname && envHostname !== identity.hostname) {
      await this.identityManager.setHostname(envHostname);
    }

    // 2. Initialize Trust Registry
    this.trustRegistry = new TrustRegistry();

    // 3. Initialize Observability Source
    const source = createDevObservabilitySource(
      {
        peerId,
        role,
        version,
        configSource: 'env',
        startedAt: Date.now(),
        deliveryRoot,
        trustRegistry: this.trustRegistry,
      },
      eventBus
    );

    this.source = source;
    source.tick();

    const obsTimer = setInterval(() => {
      source.tick();
    }, 5000);
    obsTimer.unref();

    // 4. Initialize Delivery Heartbeat & Updater
    this.heartbeatWriter = new HeartbeatWriter({
      deliveryRoot,
      peerId,
      version,
      intervalMs: 5000,
    });
    await this.heartbeatWriter.ensureStateDir();
    this.heartbeatWriter.start();

    this.updater = new Updater(deliveryRoot);
    await this.updater.ensureDirs();

    // 5. Start Admin Server
    const token = process.env.SWISD_ADMIN_TOKEN ?? createAdminToken();
    const host = process.env.SWISD_ADMIN_HOST ?? '127.0.0.1';
    const allowLan = parseBoolean(process.env.SWISD_ALLOW_LAN_ADMIN, false);
    const enableCors = parseBoolean(process.env.SWISD_ADMIN_CORS, true);
    const port = parsePort(process.env.SWISD_ADMIN_PORT, 4101);

    // Helper to restart mDNS discovery with a new hostname
    const startDiscovery = (hostName: string) => {
      if (this.discoveryHandle) {
        this.discoveryHandle.stop();
      }
      this.discoveryHandle = startAdminDiscovery({
        peerId,
        role,
        version,
        hostname: hostName,
        host,
        port,
      });
    };

    // Start initial discovery with persisted hostname
    startDiscovery(this.identityManager.getHostname());

    const adminServer = createAdminServer({
      host,
      port,
      token,
      allowLan,
      enableCors,
      source,
      eventBus,
      identityManager: this.identityManager,
      updater: this.updater,
      onHostnameUpdate: async (newHostname: string) => {
        console.log(`[SwISD] Hostname updated to ${newHostname}. Restarting mDNS broadcast...`);
        startDiscovery(newHostname);
      }
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

    if (this.discoveryHandle) {
      this.discoveryHandle.stop();
      this.discoveryHandle = undefined;
    }

    if (this.heartbeatWriter) {
      this.heartbeatWriter.stop();
      this.heartbeatWriter = undefined;
    }

    if (this.adminServer) {
      await this.adminServer.stop();
      this.adminServer = undefined;
    }

    this.source = undefined;
    this.identityManager = undefined;
    this.trustRegistry = undefined;
    this.updater = undefined;
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