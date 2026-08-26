// 1. Relative path: src/delivery/localSupervisor.ts
// 2. Description: Local CLI entrypoint for the SwISD supervisor, supporting release generation, installation, and watchdog monitoring.
// 3. Expects: Command-line arguments for mode (generate, install, watchdog), delivery root, and grace period.
// 4. Provides: A testable, local supervisor instance that manages releases, verifies artifacts, and runs the watchdog.

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { generateEd25519KeyPair } from '../crypto/index.js';
import { ReleaseInstaller } from './installer.js';
import { DeliveryWatchdog } from './watchdog.js';
import { verifyReleaseArtifact } from './verifier.js';
import { generateMockRelease } from './mockReleaseGenerator.js';

interface SupervisorCliArgs {
  readonly command: 'generate' | 'install' | 'watchdog';
  readonly deliveryRoot: string;
  readonly gracePeriodMs: number;
  readonly isDryRun: boolean;
  readonly targetVersion?: string;
}

function parseArgs(): SupervisorCliArgs {
  const args = process.argv.slice(2);
  let command: 'generate' | 'install' | 'watchdog' = 'watchdog';
  let deliveryRoot = '.swisd/delivery';
  let gracePeriodMs = 15000;
  let isDryRun = true;
  let targetVersion: string | undefined;

  let i = 0;
  while (i < args.length) {
    const currentArg = args[i];
    
    if (currentArg === 'generate' || currentArg === 'install') {
      command = currentArg;
      const nextArg = args[i + 1];
      if (nextArg !== undefined && !nextArg.startsWith('--')) {
        targetVersion = nextArg;
        i++;
      }
    } else if (currentArg === '--root') {
      const nextArg = args[i + 1];
      if (nextArg !== undefined) {
        deliveryRoot = nextArg;
        i++;
      }
    } else if (currentArg === '--grace') {
      const nextArg = args[i + 1];
      if (nextArg !== undefined) {
        const parsed = Number.parseInt(nextArg, 10);
        if (!Number.isNaN(parsed)) {
          gracePeriodMs = parsed;
        }
        i++;
      }
    } else if (currentArg === '--no-dry-run') {
      isDryRun = false;
    }
    i++;
  }

  return { command, deliveryRoot, gracePeriodMs, isDryRun, targetVersion };
}

async function ensureDevPublicKey(deliveryRoot: string): Promise<Uint8Array> {
  const supervisorDir = join(deliveryRoot, 'supervisor');
  const keyPath = join(supervisorDir, 'dev-public-key.der');
  
  try {
    await mkdir(supervisorDir, { recursive: true });
    const existing = await readFile(keyPath);
    return new Uint8Array(existing);
  } catch {
    const keyPair = generateEd25519KeyPair();
    await writeFile(keyPath, keyPair.publicKey);
    console.log('[Supervisor] Generated new local dev public key at:', keyPath);
    return keyPair.publicKey;
  }
}

async function simulateRestart(): Promise<void> {
  console.log('[Supervisor] SIMULATED: Restarting swisd-app.service...');
}

async function runGenerate(config: SupervisorCliArgs): Promise<void> {
  if (!config.targetVersion) {
    console.error('[Generator] Error: Version required. Usage: generate <version>');
    process.exit(1);
  }
  await generateMockRelease({ deliveryRoot: config.deliveryRoot, version: config.targetVersion });
}

async function runInstall(config: SupervisorCliArgs): Promise<void> {
  if (!config.targetVersion) {
    console.error('[Supervisor] Error: Version required. Usage: install <version>');
    process.exit(1);
  }

  const releaseDir = join(config.deliveryRoot, 'releases', config.targetVersion);
  
  const payloadPath = join(releaseDir, 'swisd.bin');
  const sha256Path = join(releaseDir, 'swisd.bin.sha256');
  const sigPath = join(releaseDir, 'swisd.bin.sig');

  try {
    await access(payloadPath);
  } catch {
    console.error(`[Supervisor] Error: Release payload not found at ${payloadPath}`);
    process.exit(1);
  }

  console.log(`[Supervisor] Verifying release ${config.targetVersion}...`);
  const publicKey = await ensureDevPublicKey(config.deliveryRoot);
  
  const verification = await verifyReleaseArtifact(payloadPath, sha256Path, sigPath, publicKey);
  
  if (!verification.isValid) {
    console.error(`[Supervisor] Verification FAILED: ${verification.error}`);
    process.exit(1);
  }

  console.log('[Supervisor] Verification SUCCESSFUL. Proceeding with atomic swap...');
  
  const installer = new ReleaseInstaller({ deliveryRoot: config.deliveryRoot, isDryRun: config.isDryRun });
  await installer.ensureDirectories();
  await installer.installRelease(config.targetVersion);
  
  console.log(`[Supervisor] Release ${config.targetVersion} is now active.`);
}

async function runWatchdog(config: SupervisorCliArgs): Promise<void> {
  console.log(`[Supervisor] Starting in ${config.isDryRun ? 'DRY-RUN' : 'LIVE'} mode.`);
  console.log(`[Supervisor] Delivery Root: ${config.deliveryRoot}`);
  console.log(`[Supervisor] Grace Period: ${config.gracePeriodMs}ms`);

  await ensureDevPublicKey(config.deliveryRoot);

  const installer = new ReleaseInstaller({ deliveryRoot: config.deliveryRoot, isDryRun: config.isDryRun });
  await installer.ensureDirectories();

  const watchdog = new DeliveryWatchdog({
    deliveryRoot: config.deliveryRoot,
    gracePeriodMs: config.gracePeriodMs,
    supervisorVersion: '0.0.1-local',
    onRestart: simulateRestart,
    onRollback: async () => {
      console.log('[Supervisor] Initiating rollback sequence...');
      await installer.rollback();
    },
  });

  watchdog.start();
  console.log('[Supervisor] Watchdog started. Waiting for app heartbeat...');

  process.on('SIGINT', () => {
    console.log('\n[Supervisor] Shutting down gracefully...');
    watchdog.stop();
    process.exit(0);
  });
}

async function main() {
  const config = parseArgs();

  try {
    if (config.command === 'generate') {
      await runGenerate(config);
    } else if (config.command === 'install') {
      await runInstall(config);
    } else {
      await runWatchdog(config);
    }
  } catch (error) {
    console.error('[Supervisor] Fatal error:', error);
    process.exit(1);
  }
}

void main();