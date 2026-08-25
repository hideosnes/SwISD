/**
 * 1. Relative path: src/index.ts
 * 2. Description: Main entry point for the SwISD application, orchestrating startup and graceful shutdown.
 * 3. Expects: Node.js process environment, valid configuration, and initialized subsystems.
 * 4. Provides: A resilient, gracefully shutting down application instance listening for SIGINT/SIGTERM.
 */

import { SwISDError } from './errors.js';

class SwISDApp {
  private isShuttingDown = false;

  public async start(): Promise<void> {
    console.log('[SwISD] Initializing decentralized swarm node...');
    this.registerShutdownHooks();
    // TODO: Initialize config, crypto, crdt, network, tasks, storage subsystems here.
    console.log('[SwISD] Node started successfully.');
  }

  private registerShutdownHooks(): void {
    const handleShutdown = (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log(`[SwISD] Received ${signal}. Initiating graceful shutdown...`);
      
      // TODO: Trigger subsystem teardown (close libp2p, flush CRDT state, etc.)
      
      console.log('[SwISD] Graceful shutdown complete. Exiting.');
      process.exit(0);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  }
}

const app = new SwISDApp();
app.start().catch((error: unknown) => {
  const err = error instanceof Error ? error : new SwISDError('ERR_UNKNOWN', String(error));
  console.error('[SwISD] Fatal startup error:', err);
  process.exit(1);
});