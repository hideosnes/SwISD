// src/protocols/health/healthCheck.ts
import type { Libp2p } from 'libp2p';

export function startHealthCheck(node: Libp2p, protocolId: string) {
    const interval = setInterval(async () => {
        const connections = node.getConnections();
        if (connections.length > 0) {
            console.log(`Sending message to ${connections.length} peer(s)...`);
            for (const connection of connections) {
                try {
                    const stream = await connection.newStream(protocolId);
                    const message = `MEOW! [${node.peerId.toString()} :: ${new Date().toISOString()}]`;
                    const eMsg = new TextEncoder().encode(message);
                    const ok = stream.send(eMsg);
                    if (!ok) {
                        await new Promise<void>((resolve) => {
                            stream.onDrain();
                            resolve();
                        });
                    }
                    
                    await stream.close();
                } catch (err: any) {
                    console.error(`Health check failed:`, err);
                }
            }
        }
    }, 10000);

    return interval;
}