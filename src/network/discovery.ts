// 1. Relative path: src/network/discovery.ts
// 2. Description: mDNS broadcaster for the SwISD Admin HTTP API, allowing zero-config discovery by the Conductor Cockpit.
// 3. Expects: Peer identity, role, version, hostname, and the HTTP server's host/port.
// 4. Provides: A strictly typed handle to start and stop the mDNS service advertisement on the local network.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { Bonjour, type Service } from 'bonjour-service';

export interface DiscoveryConfig {
  readonly peerId: string;
  readonly role: string;
  readonly version: string;
  readonly hostname: string;
  readonly host: string;
  readonly port: number;
}

export interface DiscoveryHandle {
  stop(): void;
}

export function startAdminDiscovery(config: DiscoveryConfig): DiscoveryHandle {
  const bonjour = new Bonjour();
  
  // We use the high-entropy tail of the peerId for the service name to keep it mDNS-friendly (max 63 chars)
  const serviceName = `swisd-${config.peerId.slice(-8)}`;

  const service: Service = bonjour.publish({
    name: serviceName,
    type: 'swisd',
    protocol: 'tcp',
    port: config.port,
    host: config.host,
    txt: {
      peerId: config.peerId,
      role: config.role,
      version: config.version,
      hostname: config.hostname,
    },
  });

  console.log(`[Discovery] Broadcasting SwISD Admin API via mDNS: ${serviceName}._swisd._tcp.local`);

  return {
    stop(): void {
      service.stop();
      bonjour.destroy();
      console.log('[Discovery] Stopped mDNS broadcasting.');
    },
  };
}



