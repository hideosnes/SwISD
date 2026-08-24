// src/protocols/connections/eventHandler.ts
import type { Libp2p } from 'libp2p';
import { RoleAssignmentManager } from '../discovery/roleAssignments.ts';

export function setupEventHandlers(node: Libp2p, roleManager: RoleAssignmentManager) {

    node.addEventListener('peer:discovery', (event) => {
        if (!roleManager.isSwISDNode) return;
        const { detail: peerInfo } = event;
        console.log(`Discovered SwISD peer: ${peerInfo.id.toString()}`);
    });

    node.addEventListener('peer:connect', (event) => {
        const peerId = event.detail.toString();  
        
        if (!roleManager.isSwISDNode) {
            console.log(`Ignoring non-SwISD peer: ${peerId}`);
            return;
        }
        
        console.log(`Connected to SwISD peer: ${peerId}`);
    });

    node.addEventListener('peer:disconnect', (event) => {
        if (!roleManager.isSwISDNode) return;
        
        const detail = event.detail;
        
        if ('remotePeer' in detail && detail.remotePeer) {
            console.log(`SwISD peer disconnected: ${detail.remotePeer.toString()}`);
        } else {
            console.log(`SwISD peer disconnected: ${detail.toString()}`);
        }
    });
}


