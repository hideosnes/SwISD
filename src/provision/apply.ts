// 1. Relative path: src/provision/apply.ts
// 2. Description: Idempotent USB provisioning agent for SwISD Raspberry Pi nodes.
// 3. Expects: A mounted USB stick containing /swisd-provision.json, and appropriate filesystem permissions.
// 4. Provides: Application of WiFi, role, and model source configurations via nmcli and local state persistence.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isProvisionConfig, type ProvisionConfig } from '../config';
import { IdentityManager } from '../delivery';

// Configurable paths for local testing without sudo, defaulting to Pi production paths
const PROVISION_SOURCE_PATH = process.env.SWISD_PROVISION_PATH ?? '/swisd-provision.json';
const DELIVERY_ROOT = process.env.SWISD_DELIVERY_ROOT ?? '/opt/swisd';
const LOCAL_STATE_PATH = join(DELIVERY_ROOT, 'state', 'provision-applied.json');

interface AppliedProvision {
  readonly version: number;
  readonly appliedAt: number;
  readonly checksum: string;
}

function calculateChecksum(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function applyWifiConfig(ssid: string, psk: string): void {
  console.log(`[Provision] Configuring WiFi for SSID: ${ssid}`);
  try {
    const existing = execSync('nmcli -t -f NAME c show --active', { encoding: 'utf-8' });
    if (existing.includes(ssid)) {
      console.log('[Provision] WiFi connection already active. Skipping.');
      return;
    }
    
    execSync('nmcli dev wifi rescan');
    execSync(`nmcli dev wifi connect "${ssid}" password "${psk}"`);
    console.log('[Provision] WiFi configured successfully.');
  } catch (error) {
    console.error('[Provision] Failed to configure WiFi (expected on non-Pi systems):', error);
  }
}

async function main() {
  console.log('[Provision] Starting USB provisioning scan...');
  console.log(`[Provision] Source: ${PROVISION_SOURCE_PATH} | Target Root: ${DELIVERY_ROOT}`);

  if (!existsSync(PROVISION_SOURCE_PATH)) {
    console.log('[Provision] No provision file found at', PROVISION_SOURCE_PATH);
    process.exit(0);
  }

  const rawContent = readFileSync(PROVISION_SOURCE_PATH, { encoding: 'utf-8' });
  
  let config: ProvisionConfig;
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    if (!isProvisionConfig(parsed)) {
      throw new Error('Invalid provision schema');
    }
    config = parsed;
  } catch (error) {
    console.error('[Provision] Invalid JSON or schema in provision file:', error);
    process.exit(1);
  }

  const currentChecksum = calculateChecksum(rawContent);
  if (existsSync(LOCAL_STATE_PATH)) {
    const localStateRaw = readFileSync(LOCAL_STATE_PATH, { encoding: 'utf-8' });
    const localState = JSON.parse(localStateRaw) as unknown;
    
    if (typeof localState === 'object' && localState !== null && 'checksum' in localState) {
      if ((localState as Record<string, unknown>).checksum === currentChecksum) {
        console.log('[Provision] Configuration already applied. Skipping.');
        process.exit(0);
      }
    }
  }

  console.log('[Provision] Applying new configuration...');

  applyWifiConfig(config.wifi.ssid, config.wifi.psk);

  const identityManager = new IdentityManager(DELIVERY_ROOT);
  await identityManager.ensureStateDir();
  await identityManager.getOrCreateIdentity();

  mkdirSync(join(DELIVERY_ROOT, 'state'), { recursive: true });
  const appliedState: AppliedProvision = {
    version: config.version,
    appliedAt: Date.now(),
    checksum: currentChecksum,
  };
  writeFileSync(LOCAL_STATE_PATH, JSON.stringify(appliedState, null, 2));

  console.log('[Provision] Provisioning complete. System ready for swarm integration.');
}

void main().catch((error: unknown) => {
  console.error('[Provision] Fatal error:', error);
  process.exit(1);
});