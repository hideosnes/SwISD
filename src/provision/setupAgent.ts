// 1. Relative path: src/provision/setupAgent.ts
// 2. Description: Out-of-Box setup orchestration: fallback AP (SwISD-Setup-XXXX), captive DNS interception, portal lifecycle, and idempotent completion handoff.
// 3. Expects: Root privileges (nmcli, port 53/80), NetworkManager, and SWISD_DELIVERY_ROOT for state.
// 4. Provides: runSetupEpisode() — runs until a phone completes the wizard once, then tears everything down and persists the completion marker.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces, type NetworkInterfaceInfoIPv4 } from 'node:os';
import { join } from 'node:path';
import { IdentityManager } from '../delivery/index.js';
import { SwISDError } from '../errors.js';
import { parsePort } from '../utils.js';
import { startCaptiveDns, type DnsCaptiveHandle } from './captiveDns.js';
import { startPortalServer, type PortalServerHandle } from './portal.js';
import type { PortalFailureReason, PortalJoinRequest, PortalJoinResult } from './schema.js';
import { WifiAgent, type HotspotHandle, type WifiFailureReason } from './wifi.js';

const COMPLETED_MARKER = 'setup-portal-completed.json';

export interface SetupMarker {
  readonly completedAt: number;
  readonly ssid: string;
}

export interface SetupEpisodeRun {
  readonly outcome: 'completed' | 'skipped';
  readonly detail: string;
}

export interface SetupEpisodeOptions {
  readonly deliveryRoot: string;
  readonly identityManager: IdentityManager;
  readonly wifi?: WifiAgent;
  readonly hotspotSsid?: string;
  readonly hotspotPsk?: string;
  /** 'auto': run only when never completed and WiFi is down. 'on': force re-provisioning. 'off': never run. */
  readonly mode?: 'auto' | 'on' | 'off';
  readonly portalPort?: number;
  readonly dnsPort?: number;
  /** Override for tests and containers: skips interface autodetection. */
  readonly portalIp?: string;
  readonly successGraceMs?: number;
}

/** Marker contract: garbage on disk reads as "not done". Only a well-formed past success counts. */
export function readSetupMarker(deliveryRoot: string): SetupMarker | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(markerPath(deliveryRoot), 'utf-8'));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.completedAt !== 'number' || typeof record.ssid !== 'string') return null;
    return { completedAt: record.completedAt, ssid: record.ssid };
  } catch {
    return null;
  }
}

export async function writeSetupMarker(deliveryRoot: string, marker: SetupMarker): Promise<void> {
  const dir = join(deliveryRoot, 'state', 'provision');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, COMPLETED_MARKER), JSON.stringify(marker, null, 2));
}

function markerPath(deliveryRoot: string): string {
  return join(deliveryRoot, 'state', 'provision', COMPLETED_MARKER);
}

export function clearSetupMarker(deliveryRoot: string): void {
  try {
    rmSync(markerPath(deliveryRoot), { force: true });
  } catch {
    // Absent marker is already the cleared state.
  }
}

/**
 * Address the wizard lives at: NetworkManager's default AP subnet first, then any
 * private-scope interface. A phone on the AP gateway must reach it as its router.
 */
export function detectPortalIp(preferredApPrefix = '10.42.'): string {
  const all = Object.values(networkInterfaces()).flat();
  const candidates = all
    .filter((entry): entry is NetworkInterfaceInfoIPv4 =>
      entry?.family === 'IPv4' && !entry.internal)
    .sort((a, b) => {
      // AP gateway prefix first, then the rest of RFC1918.
      const aAp = a.address.startsWith(preferredApPrefix) ? 1 : 0;
      const bAp = b.address.startsWith(preferredApPrefix) ? 1 : 0;
      return bAp - aAp;
    });
  const preferred = candidates
    .map((entry) => entry.address)
    .find((addr) =>
      addr.startsWith('10.') || addr.startsWith('192.168.') ||
      (addr.startsWith('172.') && in172Range(addr))
    );

  if (!preferred) {
    throw new SwISDError('ERR_PROVISION_HOTSPOT_FAILED', 'No private IPv4 address found to host the wizard at.');
  }
  return preferred;
}

function in172Range(addr: string): boolean {
  const secondOctet = Number.parseInt(addr.split('.')[1] ?? '', 10);
  return secondOctet >= 16 && secondOctet <= 31;
}

/**
 * Full setup episode: skip fast when the node is already provisioned, otherwise run
 * AP + DNS + portal until a phone completes the wizard, then tear everything down.
 */
export async function runSetupEpisode(options: SetupEpisodeOptions): Promise<SetupEpisodeRun> {
  const agent = options.wifi ?? new WifiAgent();
  const mode = options.mode ?? 'auto';
  const marker = readSetupMarker(options.deliveryRoot);

  if (mode === 'off') {
    return { outcome: 'skipped', detail: 'Setup portal disabled (mode=off).' };
  }

  if (mode === 'auto') {
    if (marker) {
      return {
        outcome: 'skipped',
        detail: `Setup already completed for '${marker.ssid}'; clear ${markerPath(options.deliveryRoot)} to re-run.`,
      };
    }
    const activeSsid = await agent.getActiveSsid();
    if (activeSsid) {
      return { outcome: 'skipped', detail: `WiFi already active on '${activeSsid}'.` };
    }
  }

  if (!(await WifiAgent.available())) {
    throw new SwISDError(
      'ERR_PROVISION_WIFI_UNAVAILABLE',
      'nmcli is not available; the setup portal cannot control WiFi on this node.'
    );
  }

  await options.identityManager.ensureStateDir();
  const identity = await options.identityManager.getOrCreateIdentity();
  const setupSsid = options.hotspotSsid ?? `SwISD-Setup-${identity.peerId.slice(-4).toUpperCase()}`;
  const hotspot = await agent.startHotspot(setupSsid, options.hotspotPsk ?? '');
  const portalIp = options.portalIp ?? detectPortalIp();
  console.log(`[Setup] Hotspot '${setupSsid}' active, gateway ${portalIp}.`);

  let dns: DnsCaptiveHandle | undefined;
  let portal: PortalServerHandle | undefined;
  try {
    dns = await startCaptiveDns({ portalIp, port: options.dnsPort ?? 53 });
    console.log('[Setup] Captive DNS interception active on port 53.');

    portal = await startPortalServer({
      host: '0.0.0.0',
      port: options.portalPort ?? 80,
      onJoin: (request) => performJoin(agent, hotspot, request),
    });

    console.log('[Setup] Waiting for a phone to complete the wizard…');
    const joined = await portal.whenJoined();

    await agent.stopHotspot(hotspot);
    await dns.stop();
    dns = undefined;

    await writeSetupMarker(options.deliveryRoot, {
      completedAt: Date.now(),
      ssid: joined.ssid,
    });

    // Give the phone's success screen time to finish rendering before the socket dies.
    await new Promise<void>((resolve) => setTimeout(resolve, options.successGraceMs ?? 30_000));
    await portal.stop();
    portal = undefined;

    return { outcome: 'completed', detail: `Node joined '${joined.ssid}'.` };
  } finally {
    if (portal) await portal.stop().catch(() => undefined);
    if (dns) await dns.stop().catch(() => undefined);
    await agent.stopHotspot(hotspot).catch(() => undefined);
  }
}

/**
 * Hosting an AP and joining a network use the same radio: drop the AP first,
 * re-raise it (same SSID) on failure so the phone can always come back and retry.
 */
async function performJoin(
  agent: WifiAgent,
  hotspot: HotspotHandle,
  request: PortalJoinRequest
): Promise<PortalJoinResult> {
  try {
    await agent.stopHotspot(hotspot);
  } catch (error: unknown) {
    console.warn('[Setup] Hotspot teardown before join failed:', error);
  }

  console.log(`[Setup] Joining '${request.ssid}' (security=${request.security}, temporary=${String(request.temporary)})…`);
  const result = await agent.connect({
    ssid: request.ssid,
    password: request.passphrase,
    hidden: request.hidden,
    temporary: request.temporary,
  });

  if (!result.ok) {
    const reason = toPortalReason(result.reason ?? 'unknown');
    console.warn(`[Setup] Join failed (${reason}); re-raising the setup hotspot.`);
    try {
      await agent.startHotspot(hotspot.ssid, '');
    } catch (error: unknown) {
      console.error('[Setup] Failed to re-raise the setup hotspot:', error);
    }
    return {
      status: 'failed',
      reason,
      message: result.message,
    };
  }

  console.log(`[Setup] Node joined '${request.ssid}'.`);
  return { status: 'joined', ssid: request.ssid };
}

/** Portal failure vocabulary is narrower than nmcli's: collapse at the boundary. */
function toPortalReason(reason: WifiFailureReason): PortalFailureReason {
  switch (reason) {
    case 'ssid-not-found':
      return 'ssid-not-found';
    case 'auth-failed':
      return 'auth-failed';
    case 'timeout':
      return 'join-timeout';
    case 'no-device':
    case 'unknown':
      return 'unknown';
  }
}

// --- CLI entry (compiled to dist/provision/setup.js; run as root via swisd-setup.service) ---

async function main(): Promise<void> {
  const deliveryRoot = process.env.SWISD_DELIVERY_ROOT ?? '/opt/swisd';
  const rawMode = process.env.SWISD_SETUP_PORTAL ?? 'auto';
  const mode = rawMode === 'on' || rawMode === 'off' ? rawMode : 'auto';
  const portalPort = parsePort(process.env.SWISD_PORTAL_PORT, 80);
  const dnsPort = parsePort(process.env.SWISD_DNS_PORT, 53);

  console.log(`[Setup] Setup portal starting (mode=${mode}, deliveryRoot=${deliveryRoot})…`);

  const identityManager = new IdentityManager(deliveryRoot);
  const run = await runSetupEpisode({ deliveryRoot, identityManager, mode, portalPort, dnsPort });
  console.log(`[Setup] Episode outcome: ${run.outcome} — ${run.detail}`);
  process.exit(0);
}

// CLI when *we* are the entry: compiled dist/provision/setup.js, or explicitly opted in
// via SWISD_SETUP_AS_CLI=1. Basename matching — a loose substring would fire on test filenames.
const cliBasename = process.argv[1]?.split('/').pop() ?? '';
const isCli = cliBasename === 'setup.js' || process.env.SWISD_SETUP_AS_CLI === '1';
if (isCli) {
  void main().catch((error: unknown) => {
    console.error('[Setup] Fatal setup-portal error:', error);
    process.exit(1);
  });
}
