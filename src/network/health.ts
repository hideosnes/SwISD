// 1. Relative path: src/network/health.ts
// 2. Description: Background health monitor that uses @libp2p/ping to track peer liveness and latency.
// 3. Expects: A configured SwISDNode and TrustRegistry.
// 4. Provides: Periodic liveness checks and latency tracking for trusted peers, feeding routing decisions.

import type { SwISDNode } from './libp2p.js';
import type { TrustRegistry } from '../peer/index.js';
import { peerIdFromString } from '@libp2p/peer-id';

export class PeerHealthMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly latencies = new Map<string, number>();

  constructor(
    private readonly node: SwISDNode,
    private readonly trustRegistry: TrustRegistry
  ) {}

  public start(intervalMs: number = 15000): void {
    this.intervalId = setInterval(() => {
      this.checkHealth().catch(err => console.error('[Health] Check failed:', err));
    }, intervalMs);
    this.intervalId.unref();
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getLatency(peerId: string): number | undefined {
    return this.latencies.get(peerId);
  }

  private async checkHealth(): Promise<void> {
    const peers = this.trustRegistry.getAllPeers().filter(p => p.state === 'trusted');
    
    for (const peer of peers) {
      if (peer.peerId === this.node.peerId.toString()) continue;

      try {
        const peerId = peerIdFromString(peer.peerId);
        // ping returns a Promise<number> (latency in ms) or throws
        const latencyMs = await this.node.services.ping.ping(peerId);
        this.latencies.set(peer.peerId, latencyMs);
      } catch (err) {
        // Ping failed or timed out. Mark as unreachable/high latency.
        this.latencies.set(peer.peerId, Infinity);
      }
    }
  }
}