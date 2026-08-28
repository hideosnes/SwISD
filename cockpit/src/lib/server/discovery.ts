// 1. Relative path: cockpit/src/lib/server/discovery.ts
// 2. Description: Server-side mDNS listener for the SvelteKit BFF, maintaining a reactive map of discovered swarm nodes.
// 3. Expects: Network access to the local multicast group.
// 4. Provides: A strictly typed, singleton discovery manager that the API routes can query.

import { Bonjour, type Service } from 'bonjour-service';

export interface DiscoveredNode {
  readonly peerId: string;
  readonly role: string;
  readonly version: string;
  readonly host: string;
  readonly port: number;
  readonly lastSeen: number;
}

// Singleton state for the SvelteKit server process
let bonjourInstance: Bonjour | null = null;
const discoveredNodes = new Map<string, DiscoveredNode>();

/**
 * Strictly extracts a string from a third-party mDNS TXT record, 
 * preventing any `any` leakage from the bonjour-service types.
 */
function extractTxtString(txt: unknown, key: string): string {
  if (typeof txt !== 'object' || txt === null) return 'unknown';
  const val = (txt as Record<string, unknown>)[key];
  if (typeof val === 'string') return val;
  if (val instanceof Buffer) return val.toString('utf-8');
  return 'unknown';
}

export function startCockpitDiscovery(): void {
  if (bonjourInstance) return;
  
  bonjourInstance = new Bonjour();
  console.log('[Cockpit BFF] Starting mDNS discovery for _swisd._tcp.local...');

  bonjourInstance.find({ type: 'swisd' }, (service: Service) => {
    const peerId = extractTxtString(service.txt, 'peerId');
    if (peerId === 'unknown') return;

    // bonjour-service provides the IP in service.referer.address or service.host
    const host = service.referer?.address ?? service.host ?? '127.0.0.1';

    discoveredNodes.set(peerId, {
      peerId,
      role: extractTxtString(service.txt, 'role'),
      version: extractTxtString(service.txt, 'version'),
      host,
      port: service.port,
      lastSeen: Date.now(),
    });
  });

  // Garbage collect stale nodes every 30 seconds
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, node] of discoveredNodes) {
      if (now - node.lastSeen > 60000) {
        discoveredNodes.delete(id);
      }
    }
  }, 30000);
  cleanupTimer.unref();
}

export function getDiscoveredNodes(): DiscoveredNode[] {
  return Array.from(discoveredNodes.values());
}