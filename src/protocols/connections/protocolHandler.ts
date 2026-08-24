// src/protocols/connections/protocolHandler.ts
import type { Libp2p } from 'libp2p';
import type { Stream, Connection } from '@libp2p/interface';
import { PROTOCOLS } from '../protocols.ts';

const PROTOCOL_ID = PROTOCOLS.SWARM;

export function setupProtocolHandler(node: Libp2p) {
    node.handle([PROTOCOL_ID], async (stream: Stream, connection: Connection) => {
        console.log('Received incoming stream from:', connection.remotePeer.toString());

        for await (const data of stream) {
            const msg = new TextDecoder().decode(data.subarray());
            console.log(`Received message: '${msg}' from ${connection.remotePeer.toString()}`);
            
            const echo = new TextEncoder().encode(`Echo: ${msg}`);
            const ok = stream.send(echo);
            if (!ok) {
                await new Promise<void>((resolve) => {
                    stream.onDrain();
                    resolve();
                });
            }
        }
    });

    return PROTOCOL_ID;
}