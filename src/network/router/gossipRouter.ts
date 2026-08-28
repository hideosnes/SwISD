// 1. Relative path: src/network/router/gossipRouter.ts
// 2. Description: Capability-aware gossip router that intercepts, validates, and routes GossipMessages.
// 3. Expects: Incoming GossipMessage, TrustRegistry, ExecutorRegistry, local peerId, and a signing function.
// 4. Provides: Mathematically sound loop prevention, O(1) capability filtering, and targeted egress routing.

import type { Libp2p } from '@libp2p/interface';
import type { GossipSub } from '@libp2p/gossipsub';
import type { GossipMessage, GossipPayload, BloomFilterState } from '../../types.js';
import { isExecutionPayload, isTaskResultPayload } from '../../types.js';
import type { TrustRegistry } from '../../peer/trust.js';
import type { ExecutorRegistry } from '../../executor/registry.js';
import { mightContain, addToBloomFilter, type BloomFilter } from '../bloom.js';
import { sendResultViaEgress } from './egressTunnel.js';
import { SwISDError } from '../../errors.js';
import { createHash } from 'node:crypto';

export interface GossipRouterDependencies {
  readonly localPeerId: string;
  readonly trustRegistry: TrustRegistry;
  readonly executorRegistry: ExecutorRegistry;
  readonly node: Libp2p<{ pubsub: GossipSub }>;
  readonly signPayload: (payloadToSign: string) => Promise<Uint8Array>;
}

function toBloomFilter(state: BloomFilterState): BloomFilter {
  return { bits: state.filter, hashCount: state.hashFunctionsCount };
}

function toBloomFilterState(filter: BloomFilter): BloomFilterState {
  return { filter: filter.bits, hashFunctionsCount: filter.hashCount };
}

export async function handleIncomingGossipMessage(
  message: GossipMessage<GossipPayload>,
  deps: GossipRouterDependencies
): Promise<void> {
  // 1. Trust Boundary Check
  const trustRecord = deps.trustRegistry.getPeer(message.senderPeerId);
  if (!trustRecord || trustRecord.state !== 'trusted') {
    console.debug(`[GossipRouter] Dropping message from untrusted peer: ${message.senderPeerId}`);
    return;
  }

  // 2. Loop Prevention (Bloom Filter Check)
  const localBloomFilter = toBloomFilter(message.ttlBloom);
  if (mightContain(localBloomFilter, deps.localPeerId)) {
    console.debug(`[GossipRouter] Loop detected. Dropping message ${message.messageId}`);
    return;
  }

  // 3. Targeted Egress Prep (Do not blind-gossip results)
  if (isTaskResultPayload(message.payload)) {
    console.debug(`[GossipRouter] Routing TaskResultPayload directly to ${message.payload.returnAddress}`);
    await sendResultViaEgress(deps.node, message.payload.returnAddress, message.payload);
    return; // Do not propagate further via gossip
  }

  // 4. Capability Matching (For ExecutionPayloads)
  if (isExecutionPayload(message.payload)) {
    const requiredType = message.payload.requiredExecutorType;
    if (!deps.executorRegistry.supports(requiredType)) {
      console.debug(`[GossipRouter] Capability mismatch. Dropping ExecutionPayload requiring ${requiredType}`);
      return; // Do not propagate garbage we cannot handle
    }
  }

  // 5. Propagation (Option A: Mutate Bloom, Re-sign, Republish)
  const updatedBloom = addToBloomFilter(localBloomFilter, deps.localPeerId);
  
  const messageToRepublish: Omit<GossipMessage<GossipPayload>, 'signature'> = {
    messageId: message.messageId,
    senderPeerId: message.senderPeerId,
    timestamp: message.timestamp,
    ttlBloom: toBloomFilterState(updatedBloom),
    payload: message.payload,
  };

  const payloadString = JSON.stringify(messageToRepublish);
  const newSignature = await deps.signPayload(payloadString);

  const signedMessage: GossipMessage<GossipPayload> = {
    ...messageToRepublish,
    signature: newSignature,
  };

  const topic = 'swisd-gossip-v1';
  const encodedMessage = new TextEncoder().encode(JSON.stringify(signedMessage));
  
  await deps.node.services.pubsub.publish(topic, encodedMessage);
  console.debug(`[GossipRouter] Successfully mutated and republished message ${message.messageId}`);
}

export function generateMessageId(payload: GossipPayload, timestamp: number): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(payload))
    .update(timestamp.toString())
    .digest('hex');
  return hash.slice(0, 16);
}