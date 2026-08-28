// 1. Relative path: src/network/router/egressTunnel.ts
// 2. Description: Direct egress tunnel for pushing TaskResultPayloads to a specific returnAddress via libp2p streams.
// 3. Expects: A configured libp2p node instance and a strictly typed TaskResultPayload.
// 4. Provides: A targeted, encrypted stream protocol (`/swisd/egress/1.0.0`) that prevents blind-gossip bandwidth choking.

import type { Libp2p } from '@libp2p/interface';
import type { GossipSub } from '@libp2p/gossipsub';
import type { Stream, Connection } from '@libp2p/interface';
import { peerIdFromString } from '@libp2p/peer-id';
import type { TaskResultPayload } from '../../types.js';
import { isTaskResultPayload } from '../../types.js';
import { SwISDError } from '../../errors.js';

const EGRESS_PROTOCOL = '/swisd/egress/1.0.0';

export async function initEgressTunnel(
  node: Libp2p<{ pubsub: GossipSub }>,
  onResultReceived: (result: TaskResultPayload, senderPeerId: string) => Promise<void>
): Promise<void> {
  // StreamHandler signature is strictly (stream: Stream, connection: Connection) => void | Promise<void>
  await node.handle(EGRESS_PROTOCOL, async (stream: Stream, connection: Connection) => {
    const senderPeerId = connection.remotePeer.toString();
    
    try {
      const chunks: Uint8Array[] = [];
      
      // In libp2p v1+, Stream is directly an AsyncIterable<Uint8Array | Uint8ArrayList>
      for await (const chunk of stream) {
        const bytes = chunk instanceof Uint8Array ? chunk : chunk.subarray();
        chunks.push(bytes);
      }
      
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const data = new Uint8Array(totalLength);
      let offset = 0;
      for (const c of chunks) {
        data.set(c, offset);
        offset += c.length;
      }

      const jsonString = new TextDecoder().decode(data);
      const parsed = JSON.parse(jsonString) as unknown;

      if (!isTaskResultPayload(parsed)) {
        throw new SwISDError('ERR_UNKNOWN', 'Invalid TaskResultPayload schema on egress tunnel');
      }

      await onResultReceived(parsed, senderPeerId);
      
      // Acknowledge receipt using .send()
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
  node: Libp2p<{ pubsub: GossipSub }>,
  targetPeerId: string,
  result: TaskResultPayload
): Promise<void> {
  try {
    // Convert string to valid DialTarget (PeerId)
    const peerId = peerIdFromString(targetPeerId);
    const stream = await node.dialProtocol(peerId, EGRESS_PROTOCOL);
    
    const payloadBytes = new TextEncoder().encode(JSON.stringify(result));
    
    // Send with backpressure awareness
    const canSend = stream.send(payloadBytes);
    if (!canSend) {
      await stream.onDrain();
    }
    
    // Wait for ACK by reading from the stream (AsyncIterable)
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      const bytes = chunk instanceof Uint8Array ? chunk : chunk.subarray();
      chunks.push(bytes);
    }
    
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const ackData = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      ackData.set(c, offset);
      offset += c.length;
    }

    if (ackData.length === 0 || ackData[0] !== 1) {
      throw new SwISDError('ERR_UNKNOWN', 'Failed to receive ACK from egress target');
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