// 1. Relative path: src/provision/wifi.ts
// 2. Description: Typed nmcli wrapper for WiFi control: connect, forget, scan, and the temporary setup hotspot.
// 3. Expects: NetworkManager (nmcli) on the node; every nmcli invocation as an argument array — provision input never reaches a shell.
// 4. Provides: The WifiAgent with strict failure classification, hot-AP lifecycle tracking, and an injectable runner for testing.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { execFile } from 'node:child_process';
import { SwISDError } from '../errors.js';

export type WifiSecurity = 'wpa2-psk' | 'wpa3-sae' | 'open';

export interface WifiConnectRequest {
  readonly ssid: string;
  readonly password: string | null;
  readonly hidden: boolean;
  /** Delete the persisted NetworkManager profile after a verified join: the connection lasts this session only. */
  readonly temporary: boolean;
}

export type WifiFailureReason = 'ssid-not-found' | 'auth-failed' | 'timeout' | 'no-device' | 'unknown';

export interface WifiConnectResult {
  readonly ok: boolean;
  readonly reason?: WifiFailureReason;
  readonly message?: string;
}

export interface WifiScanEntry {
  readonly ssid: string;
  readonly signal: number;
  readonly security: WifiSecurity;
  readonly known: boolean;
}

export interface HotspotHandle {
  /** NetworkManager connection UUID of the hotspot profile — delete it to stop broadcasting and un-persist it. */
  readonly uuid: string;
  readonly ssid: string;
}

/** Injectable command runner: resolves stdout, rejects with stderr for tests and real nmcli alike. */
export type NmcliRunner = (args: ReadonlyArray<string>) => Promise<string>;

function runRealNmcli(args: ReadonlyArray<string>): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('nmcli', [...args], { encoding: 'utf-8', timeout: 60_000 }, (err, stdout, stderr) => {
      if (err) {
        const combined = `${String(stderr)}${err.message}`;
        reject(new SwISDError('ERR_PROVISION_WIFI_CONNECT_FAILED', combined.trim()));
        return;
      }
      resolve(String(stdout));
    });
  });
}

/**
 * Every WiFi mutation a Pi needs during setup, executed as strict nmcli argument arrays.
 * Passphrase values live only in arguments — never in logs, never in a shell string.
 */
export class WifiAgent {
  private readonly run: NmcliRunner;

  constructor(runner: NmcliRunner = runRealNmcli) {
    this.run = runner;
  }

  /** nmcli presence probe: ENOENT means no NetworkManager (dev machine / missing packaging). */
  public static async available(): Promise<boolean> {
    try {
      await runRealNmcli(['--version']);
      return true;
    } catch {
      return false;
    }
  }

  public async getActiveSsid(): Promise<string | null> {
    let active: string;
    try {
      active = await this.run(['-g', 'GENERAL.CONNECTION', 'dev', 'show']);
    } catch {
      return null;
    }
    // Self-hosted setup APs are not membership in someone else's network.
    const lines = active
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line !== '--');
    const nonHotspot = lines.find((line: string) => line !== 'Hotspot' && !line.startsWith('swisd-setup'));
    return nonHotspot ?? null;
  }

  public async findWifiDevice(): Promise<string | null> {
    try {
      const status = await this.run(['-t', '-f', 'DEVICE,TYPE', 'dev', 'status']);
      const wifi = status
        .split('\n')
        .find((line: string) => line.split(':')[1] === 'wifi');
      const device = wifi?.split(':')[0];
      return device && device.length > 0 ? device : null;
    } catch {
      return null;
    }
  }

  public async scan(): Promise<ReadonlyArray<WifiScanEntry>> {
    const device = await this.findWifiDevice();
    if (!device) return [];
    try {
      await this.run(['dev', 'wifi', 'rescan', 'ifname', device]);
    } catch {
      // Rescan is advisory: the cached list covers a first paint.
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 3000));

    let raw: string;
    try {
      raw = await this.run([
        '-g',
        'SSID,SIGNAL,FREQUENCY,SECURITY,IN-USE',
        'dev',
        'wifi',
        'list',
        'ifname',
        device,
      ]);
    } catch {
      return [];
    }

    const knownProfiles = await this.listKnownSsids();

    return raw
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => {
        const [ssid, signal, , security, inUse] = line.split(':');
        const cleanSsid = ssid.trim();
        const signalValue = Number.parseInt(signal, 10);
        return {
          ssid: cleanSsid,
          signal: Number.isFinite(signalValue) ? signalValue : 0,
          security: security.includes('SAE')
            ? ('wpa3-sae' as const)
            : security.includes('WPA')
              ? ('wpa2-psk' as const)
              : ('open' as const),
          known: knownProfiles.includes(cleanSsid),
          inUse: inUse === 'yes',
        };
      })
      .filter((entry: WifiScanEntry & { readonly inUse: boolean }) => entry.ssid.length > 0 && !entry.inUse);
  }

  public async listKnownSsids(): Promise<ReadonlyArray<string>> {
    try {
      const raw = await this.run(['-t', '-f', 'NAME,TYPE', 'c', 'show']);
      return raw
        .split('\n')
        .filter((line: string) => line.includes(':wifi'))
        .map((line: string) => line.split(':')[0]);
    } catch {
      return [];
    }
  }

  public async connect(req: WifiConnectRequest): Promise<WifiConnectResult> {
    if (!req.temporary) {
      // Forget any stale profile of the same name: nmcli silently reuses old (possibly wrong) seeds.
      await this.forgetSsid(req.ssid);
    }

    const args = ['dev', 'wifi', 'connect', req.ssid];
    if (req.password !== null) args.push('password', req.password);
    if (req.hidden) args.push('hidden', 'yes');

    try {
      await this.run(args);
    } catch (err: unknown) {
      return this.classifyFailure(err);
    }

    const active = await this.getActiveSsid();
    if (active !== req.ssid) {
      return {
        ok: false,
        reason: 'unknown',
        message: 'nmcli exited cleanly but the requested network is not the active connection.',
      };
    }

    if (req.temporary) {
      // Deleting the active profile keeps the session alive; NetworkManager just forgets it on reboot.
      await this.forgetSsid(req.ssid);
    }

    return { ok: true };
  }

  /**
   * Remove a saved profile for the given SSID — the "forget without a keyboard" primitive.
   * Returns false when no such profile exists (already forgotten).
   */
  public async forgetSsid(ssid: string): Promise<boolean> {
    let profiles: string;
    try {
      profiles = await this.run(['-t', '-f', 'NAME,UUID,TYPE', 'c', 'show']);
    } catch {
      return false;
    }
    for (const line of profiles.split('\n')) {
      const [name, uuid, type] = line.split(':');
      if (name === ssid && type === 'wifi') {
        try {
          await this.run(['c', 'delete', 'uuid', uuid]);
        } catch {
          return false;
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Raise the temporary setup hotspot. Returns a handle whose delete() tears the AP down
   * and removes the profile so it never auto-starts after reboot.
   */
  public async startHotspot(ssid: string, hotspotPsk: string): Promise<HotspotHandle> {
    const before = await this.listConnectionUuids();
    let device = await this.findWifiDevice();
    if (!device) {
      throw new SwISDError('ERR_PROVISION_HOTSPOT_FAILED', 'No WiFi device found to host the setup hotspot.');
    }

    const args = ['dev', 'wifi', 'hotspot', 'ifname', device, 'ssid', ssid];
    if (hotspotPsk.length > 0) args.push('password', hotspotPsk);

    try {
      await this.run(args);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new SwISDError('ERR_PROVISION_HOTSPOT_FAILED', `Failed to raise setup hotspot: ${msg}`, err);
    }

    const after = await this.listConnectionUuids();
    const added = after.filter((uuid: string) => !before.includes(uuid));
    if (added.length !== 1) {
      throw new SwISDError(
        'ERR_PROVISION_HOTSPOT_FAILED',
        `Hotspot raised but profile identification is ambiguous (${String(added.length)} candidates).`
      );
    }
    return { uuid: added[0], ssid };
  }

  public async stopHotspot(handle: HotspotHandle): Promise<void> {
    try {
      await this.run(['c', 'delete', 'uuid', handle.uuid]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new SwISDError('ERR_PROVISION_HOTSPOT_FAILED', `Failed to tear down setup hotspot: ${msg}`, err);
    }
  }

  private async listConnectionUuids(): Promise<ReadonlyArray<string>> {
    try {
      const raw = await this.run(['-t', '-f', 'UUID,TYPE', 'c', 'show']);
      return raw
        .split('\n')
        .filter((line: string) => line.includes(':wifi'))
        .map((line: string) => line.split(':')[0]);
    } catch {
      return [];
    }
  }

  private classifyFailure(err: unknown): WifiConnectResult {
    const message = err instanceof Error ? err.message : String(err);
    const lowered = message.toLowerCase();

    if (lowered.includes('no network with ssid') || lowered.includes('no match')) {
      return { ok: false, reason: 'ssid-not-found', message };
    }
    if (lowered.includes('secret') || lowered.includes('auth') || lowered.includes('802-11-wireless')) {
      return { ok: false, reason: 'auth-failed', message };
    }
    if (lowered.includes('timeout') || lowered.includes('timed out')) {
      return { ok: false, reason: 'timeout', message };
    }
    if (lowered.includes('no suitable device') || lowered.includes('not enabled')) {
      return { ok: false, reason: 'no-device', message };
    }
    return { ok: false, reason: 'unknown', message };
  }
}
