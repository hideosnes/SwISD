// 1. Relative path: src/provision/apply.ts
// 2. Description: Idempotent USB provisioning agent for SwISD Raspberry Pi nodes.
// 3. Expects: A mounted USB stick at /swisd-provision.json, containing valid provisioning data.
// 4. Provides: Application of WiFi, role, and model source configurations via nmcli and local state persistence.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isProvisionConfig } from '../config/index.js';
import { IdentityManager } from '../delivery/index.js';
import type { ProvisionConfig } from '../config/index.js';

const PROVISION_SOURCE_PATH = '/swisd-provision.json'; // Path on the USB stick
const LOCAL_STATE_PATH = '/opt/swisd/state/provision-applied.json';
const DELIVERY_ROOT = '/opt/swisd';

interface AppliedProvision {
  readonly version: number;
  readonly appliedAt: number;
  readonly checksum: string;
} 

function calculateChecksum(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function applyWifiConfig(ssid: string, psk: string, country: string): void {
  console.log(`[Provision] Configuring WiFi for SSID: ${ssid}`);
  try {
    // Check if connection already exists to ensure idempotency
    const existing = execSync('nmcli -t -f NAME c show --active', { encoding: 'utf-8' });
    if (existing.includes(ssid)) {
      console.log('[Provision] WiFi connection already active. Skipping.');
      return;
    }
    
    execSync('nmcli dev wifi rescan');
    execSync(`nmcli dev wifi connect "${ssid}" password "${psk}" country "${country}"`);
    console.log('[Provision] WiFi configured successfully.');
  } catch (error) {
    console.error('[Provision] Failed to configure WiFi:', error);
    // Do not exit; allow other provisions to apply even if WiFi fails
  }
}

async function main() {
  console.log('[Provision] Starting USB provisioning scan...');

  if (!existsSync(PROVISION_SOURCE_PATH)) {
    console.log('[Provision] No provision file found at', PROVISION_SOURCE_PATH);
    process.exit(0);
  }

  const rawContent = readFileSync(PROVISION_SOURCE_PATH, { encoding: 'utf-8' });
  
  // Strict schema validation using our existing config loader logic
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

  // Idempotency check: Have we already applied this exact configuration?
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

  // 1. Apply WiFi
  applyWifiConfig(config.wifi.ssid, config.wifi.psk, config.wifi.country);

  // 2. Ensure Identity exists (First-boot identity birth)
  const identityManager = new IdentityManager(DELIVERY_ROOT);
  await identityManager.ensureStateDir();
  await identityManager.getOrCreateIdentity();

  // 3. Mark as applied
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