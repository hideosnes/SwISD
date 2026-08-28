// 1. Relative path: src/peer/trust.ts
// 2. Description: Manages the cryptographic trust state of discovered peers, enforcing the "Pending Trust" protocol for Genesis network connections.
// 3. Expects: Peer IDs and discovery sources.
// 4. Provides: A strictly typed registry to accept, reject, or query peer trust states, preventing unauthorized CRDT participation.

import type { PeerTrustRecord, PeerTrustState } from '../types.js';

export class TrustRegistry {
  private readonly peers = new Map<string, PeerTrustRecord>();

  public discoverPeer(peerId: string, source: 'mdns' | 'gossip' | 'usb'): PeerTrustRecord {
    const existing = this.peers.get(peerId);
    if (existing) {
      return existing;
    }

    const record: PeerTrustRecord = {
      peerId,
      state: 'pending',
      discoveredAt: Date.now(),
      trustedAt: null,
      source,
    };

    this.peers.set(peerId, record);
    console.log(`[TrustRegistry] Discovered new peer ${peerId} via ${source}. State: PENDING.`);
    return record;
  }

  public trustPeer(peerId: string): boolean {
    const record = this.peers.get(peerId);
    if (!record || record.state === 'trusted') return false;

    const updated: PeerTrustRecord = {
      ...record,
      state: 'trusted',
      trustedAt: Date.now(),
    };

    this.peers.set(peerId, updated);
    console.log(`[TrustRegistry] Peer ${peerId} is now TRUSTED.`);
    return true;
  }

  public rejectPeer(peerId: string): boolean {
    const record = this.peers.get(peerId);
    if (!record || record.state === 'rejected') return false;

    const updated: PeerTrustRecord = {
      ...record,
      state: 'rejected',
    };

    this.peers.set(peerId, updated);
    console.log(`[TrustRegistry] Peer ${peerId} is now REJECTED.`);
    return true;
  }

  public getPeer(peerId: string): PeerTrustRecord | undefined {
    return this.peers.get(peerId);
  }

  public getAllPeers(): ReadonlyArray<PeerTrustRecord> {
    return Array.from(this.peers.values());
  }
}