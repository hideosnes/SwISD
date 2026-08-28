// 1. Relative path: src/peer/trust.ts
// 2. Description: Manages the cryptographic trust state and public keys of discovered peers.
// 3. Expects: Peer IDs, discovery sources, and raw Ed25519 public keys.
// 4. Provides: A strictly typed registry to accept, reject, or query peer trust states and retrieve keys for signature verification.

import type { PeerTrustRecord, PeerTrustState } from '../types.js';

export class TrustRegistry {
  private readonly peers = new Map<string, PeerTrustRecord>();
  private readonly publicKeys = new Map<string, Uint8Array>();

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

  public registerPublicKey(peerId: string, publicKey: Uint8Array): void {
    this.publicKeys.set(peerId, publicKey);
  }

  public getPublicKey(peerId: string): Uint8Array | undefined {
    return this.publicKeys.get(peerId);
  }

  public getPeer(peerId: string): PeerTrustRecord | undefined {
    return this.peers.get(peerId);
  }

  public getAllPeers(): ReadonlyArray<PeerTrustRecord> {
    return Array.from(this.peers.values());
  }
}