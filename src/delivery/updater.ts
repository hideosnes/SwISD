/**
 * 1. Relative path: src/delivery/updater.ts
 * 2. Description: Cryptographically verified OTA update pipeline for the SwISD headless core.
 * 3. Expects: Delivery root path, GitHub repo metadata, and embedded Ed25519 public key.
 * 4. Provides: Atomic download, verification, symlink promotion, and graceful process exit for supervisor restart.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { readFile, writeFile, mkdir, access, symlink, readlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createPublicKey, createHash, verify } from 'node:crypto';
import { DeliveryFilesystemError, SwISDError } from '../errors.js';

const execAsync = promisify(exec);

const REPO = 'hideosnes/swisd';
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQqTUJL3N9AJGTYSoZHOZL5B2KN5aL7WUVzmnJ9VqQMs=
-----END PUBLIC KEY-----`;

export interface UpdateResult {
  readonly success: boolean;
  readonly version: string;
  readonly message: string;
}

export class Updater {
  private readonly installDir: string;
  private readonly releasesDir: string;
  private readonly currentLink: string;
  private readonly previousLink: string;

  constructor(deliveryRoot: string) {
    this.installDir = deliveryRoot;
    this.releasesDir = join(deliveryRoot, 'releases');
    this.currentLink = join(deliveryRoot, 'current');
    this.previousLink = join(deliveryRoot, 'previous');
  }

  public async ensureDirs(): Promise<void> {
    await mkdir(this.releasesDir, { recursive: true });
  }

  public async checkForUpdate(): Promise<{ hasUpdate: boolean; latestVersion: string; currentVersion: string | null }> {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!res.ok) throw new SwISDError('ERR_DELIVERY_INVALID_ARTIFACT', 'Failed to fetch latest release from GitHub');
    
    const data = (await res.json()) as { tag_name: string };
    const latestVersion = data.tag_name.replace(/^v/, '');

    let currentVersion: string | null = null;
    try {
      const target = await readlink(this.currentLink);
      currentVersion = target.split('/').pop() || null;
    } catch {
      // No current link yet
    }

    return {
      hasUpdate: currentVersion !== latestVersion,
      latestVersion,
      currentVersion,
    };
  }

  public async executeUpdate(): Promise<UpdateResult> {
    await this.ensureDirs();

    const { latestVersion } = await this.checkForUpdate();
    const releaseDir = join(this.releasesDir, latestVersion);
    
    // Check if already installed
    try {
      const currentTarget = await readlink(this.currentLink);
      if (currentTarget === releaseDir) {
        return { success: true, version: latestVersion, message: 'Already on latest version' };
      }
    } catch { /* Ignore */ }

    const workDir = join(this.releasesDir, `_tmp_${Date.now()}`);
    await mkdir(workDir, { recursive: true });

    try {
      // 1. Fetch release metadata
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/v${latestVersion}`);
      const releaseData = (await res.json()) as { assets: { name: string; browser_download_url: string }[] };
      
      const getAssetUrl = (name: string) => {
        const asset = releaseData.assets.find(a => a.name === name);
        if (!asset) throw new SwISDError('ERR_DELIVERY_INVALID_ARTIFACT', `Missing asset: ${name}`);
        return asset.browser_download_url;
      };

      const tarballUrl = getAssetUrl(`swisd-${latestVersion}.tar.gz`);
      const shaUrl = getAssetUrl(`swisd-${latestVersion}.tar.gz.sha256`);
      const sigUrl = getAssetUrl(`swisd-${latestVersion}.tar.gz.sig`);

      // 2. Download artifacts
      const tarballPath = join(workDir, `swisd-${latestVersion}.tar.gz`);
      const shaPath = join(workDir, `swisd-${latestVersion}.tar.gz.sha256`);
      const sigPath = join(workDir, `swisd-${latestVersion}.tar.gz.sig`);

      await Promise.all([
        this.downloadFile(tarballUrl, tarballPath),
        this.downloadFile(shaUrl, shaPath),
        this.downloadFile(sigUrl, sigPath),
      ]);

      // 3. Verify SHA256
      const expectedSha = (await readFile(shaPath, 'utf-8')).trim().split(' ')[0];
      const fileBuffer = await readFile(tarballPath);
      const actualSha = createHash('sha256').update(fileBuffer).digest('hex');
      if (expectedSha !== actualSha) {
        throw new SwISDError('ERR_DELIVERY_INVALID_ARTIFACT', 'SHA-256 checksum mismatch');
      }

      // 4. Verify Ed25519 Signature
      const sigBuffer = await readFile(sigPath);
      const publicKey = createPublicKey({ key: PUBLIC_KEY_PEM, format: 'pem', type: 'spki' });
      const isValid = verify(null, fileBuffer, publicKey, sigBuffer);
      if (!isValid) {
        throw new SwISDError('ERR_DELIVERY_INVALID_ARTIFACT', 'Ed25519 signature verification failed');
      }

      // 5. Extract to release directory
      await mkdir(releaseDir, { recursive: true });
      await execAsync(`tar -xzf "${tarballPath}" -C "${releaseDir}"`);

      // 6. Install dependencies
      await execAsync(`npm ci --omit=dev --prefix "${releaseDir}"`);

      // 7. Atomic Symlink Swap
      try {
        const oldTarget = await readlink(this.currentLink);
        if (oldTarget !== releaseDir) {
          await symlink(oldTarget, this.previousLink, 'dir');
        }
      } catch { /* No previous link to preserve */ }

      await symlink(releaseDir, this.currentLink, 'dir');

      // 8. Graceful exit to allow systemd/supervisor to restart into new version
      console.log(`[Updater] Update to ${latestVersion} successful. Exiting for restart...`);
      process.exit(0);

      return { success: true, version: latestVersion, message: 'Update successful, restarting...' };
    } catch (err: unknown) {
      // Cleanup on failure
      await execAsync(`rm -rf "${workDir}"`).catch(() => {});
      const msg = err instanceof Error ? err.message : 'Unknown update error';
      throw new SwISDError('ERR_DELIVERY_INVALID_ARTIFACT', msg, err);
    }
  }

  private async downloadFile(url: string, dest: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new SwISDError('ERR_DELIVERY_INVALID_ARTIFACT', `Failed to download ${url}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buffer);
  }
}