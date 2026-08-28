// 1. Relative path: src/network/router/gossipRouter.ts
// 2. Description: Capability-aware gossip router that intercepts, validates, and routes GossipMessages, including preemption events.
// 3. Expects: Incoming GossipMessage, TrustRegistry, ExecutorRegistry, local peerId, and a signing function.
// 4. Provides: Mathematically sound loop prevention, O(1) capability filtering, targeted egress routing, and decentralized preemption handling.

import type { SwISDNode } from '../libp2p.js';
import type { GossipMessage, GossipPayload, TaskHistoryEvent } from '../../types.js';
import { 
  isExecutionPayload, 
  isTaskResultPayload, 
  isTaskHistoryEvent 
} from '../../types.js';
import type { TrustRegistry } from '../../peer/trust.js';
import type { ExecutorRegistry } from '../../executor/registry.js';
import { mightContain, addToBloomFilter } from '../bloom.js';
import { sendResultViaEgress } from './egressTunnel.js';
import { createHash } from 'node:crypto';

export interface GossipRouterDependencies {
  readonly localPeerId: string;
  readonly trustRegistry: TrustRegistry;
  readonly executorRegistry: ExecutorRegistry;
  readonly node: SwISDNode;
  readonly signPayload: (payloadToSign: string) => Promise<Uint8Array>;
  readonly onTaskPreempted: (taskId: string, event: TaskHistoryEvent) => void;
}

export async function handleIncomingGossipMessage(
  message: GossipMessage<GossipPayload>,
  deps: GossipRouterDependencies
): Promise<void> {
  const trustRecord = deps.trustRegistry.getPeer(message.senderPeerId);
  if (!trustRecord || trustRecord.state !== 'trusted') {
    return; 
  }

  if (mightContain(message.ttlBloom, deps.localPeerId)) {
    return; 
  }

  if (isTaskResultPayload(message.payload)) {
    await sendResultViaEgress(deps.node, message.payload.returnAddress, message.payload);
    return; 
  }

  if (isTaskHistoryEvent(message.payload)) {
    if (message.payload.action === 'preempted' || message.payload.action === 'failed') {
      deps.onTaskPreempted(message.payload.taskId, message.payload);
    }
  }

  if (isExecutionPayload(message.payload)) {
    const requiredType = message.payload.requiredExecutorType;
    if (!deps.executorRegistry.supports(requiredType)) {
      return; 
    }
  }

  const updatedBloom = addToBloomFilter(message.ttlBloom, deps.localPeerId);
  
  const messageToRepublish: Omit<GossipMessage<GossipPayload>, 'signature'> = {
    messageId: message.messageId,
    senderPeerId: message.senderPeerId,
    timestamp: message.timestamp,
    ttlBloom: updatedBloom,
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
}

export function generateMessageId(payload: GossipPayload, timestamp: number): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(payload))
    .update(timestamp.toString())
    .digest('hex');
  return hash.slice(0, 16);
}