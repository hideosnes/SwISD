/**
 * 1. Relative path: src/network/libp2p.ts
 * 2. Description: Factory function to initialize and configure the libp2p node for the SwISD swarm.
 * 3. Expects: Network configuration and an optional protobuf-encoded private key (Uint8Array).
 * 4. Provides: A fully typed, strictly configured libp2p node instance with TCP, mDNS, Noise, Yamux, and Gossipsub.
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mdns } from '@libp2p/mdns';
import { noise } from '@libp2p/noise';
import { yamux } from '@libp2p/yamux';
import { gossipsub } from '@libp2p/gossipsub';
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys';
import type { PrivateKey, Libp2p } from '@libp2p/interface';

export interface SwISDLibp2pConfig {
  readonly listenPort: number;
  // Optional: Pass a previously persisted protobuf-encoded private key to maintain identity across restarts.
  // If omitted, libp2p will natively generate a fresh Ed25519 keypair on boot.
  readonly privateKeyBytes?: Uint8Array; 
}

export async function createSwISDNode(config: SwISDLibp2pConfig): Promise<Libp2p> {
  let privateKey: PrivateKey | undefined;

  // Strictly deserialize the persisted key if provided
  if (config.privateKeyBytes) {
    privateKey = await privateKeyFromProtobuf(config.privateKeyBytes);
  }

  const node = await createLibp2p({
    privateKey, // Modern libp2p accepts the PrivateKey object directly here
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${config.listenPort}`],
    },
    transports: [tcp()],
    connectionEncrypters: [noise()], // FIXED: Renamed from connectionEncryption
    streamMuxers: [yamux()],
    peerDiscovery: [mdns()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        fallbackToFloodsub: false
      }),
    },
  });

  return node;
}