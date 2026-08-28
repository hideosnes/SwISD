// 1. Relative path: src/network/router/egressTunnel.ts
// 2. Description: Direct egress tunnel for pushing TaskResultPayloads to a specific returnAddress via libp2p streams.
// 3. Expects: A configured SwISDNode instance, a strictly typed TaskResultPayload, and reputation emission hooks.
// 4. Provides: A targeted, encrypted stream protocol (`/swisd/egress/1.0.0`) that prevents blind-gossip bandwidth choking.

import type { SwISDNode } from '../libp2p.js';
import type { Stream, Connection } from '@libp2p/interface';
import { peerIdFromString } from '@libp2p/peer-id';
import { isTaskResultPayload, type TaskResultPayload, type ReputationEvent } from '../../types.js';
import { SwISDError } from '../../errors.js';
import { createHash } from 'node:crypto';

const EGRESS_PROTOCOL = '/swisd/egress/1.0.0';

export interface EgressTunnelDependencies {
  readonly localPeerId: string;
  readonly signPayload: (payloadToSign: string) => Promise<Uint8Array>;
  readonly onReputationEvent: (event: ReputationEvent) => void;
  readonly getTaskLatencyMs: (taskId: string) => number;
}

export async function initEgressTunnel(
  node: SwISDNode,
  onResultReceived: (result: TaskResultPayload, senderPeerId: string) => Promise<void>,
  deps: EgressTunnelDependencies
): Promise<void> {
  await node.handle(EGRESS_PROTOCOL, async (stream: Stream, connection: Connection) => {
    const senderPeerId = connection.remotePeer.toString();
    
    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of stream) {
        const bytes = chunk instanceof Uint8Array ? chunk : chunk.subarray();
        chunks.push(bytes);
      }
      
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const dataBytes = new Uint8Array(totalLength);
      let offset = 0;
      for (const c of chunks) {
        dataBytes.set(c, offset);
        offset += c.length;
      }

      const jsonString = new TextDecoder().decode(dataBytes);
      const parsed = JSON.parse(jsonString) as unknown;

      if (!isTaskResultPayload(parsed)) {
        throw new SwISDError('ERR_UNKNOWN', 'Invalid TaskResultPayload schema on egress tunnel');
      }

      await onResultReceived(parsed, senderPeerId);
      
      // --- REPUTATION EMISSION ---
      const latencyMs = deps.getTaskLatencyMs(parsed.taskId);
      const outcome: 'success' | 'failure' = parsed.success ? 'success' : 'failure';
      const timestamp = Date.now();
      
      const eventPayload = {
        authorPeerId: deps.localPeerId,
        targetPeerId: senderPeerId,
        outcome,
        latencyMs,
        timestamp,
      };
      
      const eventId = createHash('sha256')
        .update(JSON.stringify(eventPayload))
        .digest('hex')
        .slice(0, 16);

      const payloadToSign = { ...eventPayload, eventId };
      const signature = await deps.signPayload(JSON.stringify(payloadToSign));
      
      const reputationEvent: ReputationEvent = {
        ...payloadToSign,
        signature,
      };

      deps.onReputationEvent(reputationEvent);
      // ---------------------------
      
      const canSend = stream.send(new Uint8Array([1]));
      if (!canSend) {
        await stream.onDrain();
      }
      
      await stream.close();
    } catch (error) {
      console.error(`[EgressTunnel] Error handling stream from ${senderPeerId}:`, error);
      const err = error instanceof Error ? error : new Error(String(error));
      stream.abort(err);
    }
  });
}

export async function sendResultViaEgress(
  node: SwISDNode,
  targetPeerId: string,
  result: TaskResultPayload
): Promise<void> {
  try {
    const peerId = peerIdFromString(targetPeerId);
    const stream = await node.dialProtocol(peerId, EGRESS_PROTOCOL);
    
    const payloadBytes = new TextEncoder().encode(JSON.stringify(result));
    
    const canSend = stream.send(payloadBytes);
    if (!canSend) {
      await stream.onDrain();
    }
    
    const ackChunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      const bytes = chunk instanceof Uint8Array ? chunk : chunk.subarray();
      ackChunks.push(bytes);
    }
    
    const totalAckLength = ackChunks.reduce((acc, c) => acc + c.length, 0);
    const ackData = new Uint8Array(totalAckLength);
    let offset = 0;
    for (const c of ackChunks) {
      ackData.set(c, offset);
      offset += c.length;
    }

    if (ackData.length === 0 || ackData[0] !== 1) {
      throw new SwISDError('ERR_UNKNOWN', 'Failed to receive valid ACK from egress target');
    }

    await stream.close();
  } catch (error) {
    throw new SwISDError(
      'ERR_UNKNOWN',
      `Failed to send result via egress to ${targetPeerId}`,
      error
    );
  }
}