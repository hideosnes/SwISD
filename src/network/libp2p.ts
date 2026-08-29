// 1. Relative path: src/network/libp2p.ts
// 2. Description: Factory function to initialize and configure the libp2p node for the SwISD swarm, including gossip routing, ping, and backpressure.
// 3. Expects: Network configuration, optional protobuf-encoded private key, and router dependencies including a load score evaluator.
// 4. Provides: A fully typed, strictly configured libp2p node instance with TCP, mDNS, Noise, Yamux, Gossipsub, Ping, and active routing.

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mdns } from '@libp2p/mdns';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { gossipsub, type GossipSub } from '@libp2p/gossipsub';
import { ping } from '@libp2p/ping';
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys';
import type { PrivateKey, Libp2p, PeerId } from '@libp2p/interface';
import { createHash } from 'node:crypto';

import type { GossipMessage, GossipPayload, TaskResultPayload, TaskHistoryEvent, ReputationEvent } from '../types.js';
import { initEgressTunnel, type EgressTunnelDependencies } from './router/egressTunnel.js';
import { handleIncomingGossipMessage } from './router/gossipRouter.js';
import type { GossipRouterDependencies } from './router/index.js';
import type { TrustRegistry } from '../peer/index.js';
import type { ExecutorRegistry } from '../executor/index.js';
import type { ReputationLog } from '../crdt/index.js';
import { SwISDError, BackpressureError } from '../errors.js';

export interface SwISDLibp2pConfig {
  readonly listenPort: number;
  readonly privateKeyBytes?: Uint8Array; 
}

export interface SwISDNodeDependencies {
  readonly trustRegistry: TrustRegistry;
  readonly executorRegistry: ExecutorRegistry;
  readonly reputationLog: ReputationLog;
  readonly getCapablePeers: (requiredType: string) => ReadonlyArray<string>;
  readonly onTaskResultReceived: (result: TaskResultPayload, senderPeerId: string) => Promise<void>;
  readonly onReputationEvent: (event: ReputationEvent) => void;
  readonly getTaskLatencyMs: (taskId: string) => number;
  readonly onTaskPreempted: (taskId: string, event: TaskHistoryEvent) => void;
  readonly getLoadScore: () => number;
  readonly tryConsumeGossipToken: () => boolean;
}

// Define the PingService interface locally to avoid breaking changes in @libp2p/ping exports.
// We only expose the exact surface area we consume.
export interface PingService {
  ping(peerId: PeerId): Promise<number>;
}

// Satisfies the ServiceMap index signature constraint without using 'any'
export interface SwISDServiceMap {
  pubsub: GossipSub;
  ping: PingService;
  [key: string]: unknown;
}

export type SwISDNode = Libp2p<SwISDServiceMap>;

export async function createSwISDNode(
  config: SwISDLibp2pConfig,
  deps: SwISDNodeDependencies
): Promise<SwISDNode> {
  let privateKey: PrivateKey | undefined;

  if (config.privateKeyBytes) {
    privateKey = await privateKeyFromProtobuf(config.privateKeyBytes);
  }

  const node = await createLibp2p<SwISDServiceMap>({
    privateKey,
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${config.listenPort}`],
    },
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [mdns()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        fallbackToFloodsub: false,
      }),
      ping: ping(),
    },
  });

  const localPeerId = node.peerId.toString();

  const signPayload = async (payloadToSign: string): Promise<Uint8Array> => {
    if (!privateKey) {
      throw new SwISDError('ERR_CRYPTO_VERIFICATION_FAILED', 'Cannot sign payload: private key missing');
    }
    const hash = createHash('sha256').update(payloadToSign).digest();
    return await privateKey.sign(hash);
  };

  const routerDeps: GossipRouterDependencies = {
    localPeerId,
    trustRegistry: deps.trustRegistry,
    reputationLog: deps.reputationLog,
    node,
    signPayload,
    onTaskPreempted: deps.onTaskPreempted,
    getLoadScore: deps.getLoadScore,
    tryConsumeGossipToken: deps.tryConsumeGossipToken,
    getCapablePeers: deps.getCapablePeers,
  };

  const egressDeps: EgressTunnelDependencies = {
    localPeerId,
    signPayload,
    onReputationEvent: deps.onReputationEvent,
    getTaskLatencyMs: deps.getTaskLatencyMs,
  };

  await initEgressTunnel(node, deps.onTaskResultReceived, egressDeps);

  const topic = 'swisd-gossip-v1';
  await node.services.pubsub.subscribe(topic);

  node.services.pubsub.addEventListener('message', (evt) => {
    if (evt.detail.topic !== topic) return;

    try {
      const textDecoder = new TextDecoder();
      const jsonString = textDecoder.decode(evt.detail.data);
      const parsed = JSON.parse(jsonString) as unknown;

      if (!isValidGossipMessage(parsed)) {
        console.warn('[Libp2p] Received invalid GossipMessage structure. Dropping.');
        return;
      }

      handleIncomingGossipMessage(parsed, routerDeps).catch((error) => {
        if (error instanceof BackpressureError) {
          console.debug(`[Libp2p] Backpressure applied: ${error.message}`);
        } else {
          console.error(`[Libp2p] Critical error in GossipRouter for message ${parsed.messageId}:`, error);
        }
      });
    } catch (error) {
      console.error('[Libp2p] Failed to parse incoming gossip message:', error);
    }
  });

  return node;
}

function isValidGossipMessage(msg: unknown): msg is GossipMessage<GossipPayload> {
  const m = msg as Record<string, unknown>;
  return (
    typeof m?.messageId === 'string' &&
    typeof m?.senderPeerId === 'string' &&
    typeof m?.timestamp === 'number' &&
    typeof m?.ttlBloom === 'object' &&
    m.ttlBloom !== null &&
    'filter' in m.ttlBloom &&
    'hashFunctionsCount' in m.ttlBloom &&
    m?.signature instanceof Uint8Array &&
    typeof m?.payload === 'object' &&
    m?.payload !== null
  );
}