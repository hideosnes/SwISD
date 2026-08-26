// 1. Relative path: src/delivery/installer.ts
// 2. Description: Atomic symlink swap and rollback engine for SwISD releases.
// 3. Expects: Delivery root path, target version string, and a dry-run flag.
// 4. Provides: Safe, atomic filesystem operations to promote a release to 'current' or revert to 'previous'.

import { symlink, readlink, unlink, rename, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { constants } from 'node:fs';
import { DeliveryFilesystemError } from '../errors.js';

export interface InstallerConfig {
  readonly deliveryRoot: string;
  readonly isDryRun: boolean;
}

export class ReleaseInstaller {
  private readonly releasesDir: string;
  private readonly currentLink: string;
  private readonly previousLink: string;
  private readonly isDryRun: boolean;

  constructor(config: InstallerConfig) {
    this.releasesDir = join(config.deliveryRoot, 'releases');
    this.currentLink = join(config.deliveryRoot, 'current');
    this.previousLink = join(config.deliveryRoot, 'previous');
    this.isDryRun = config.isDryRun;
  }

  public async ensureDirectories(): Promise<void> {
    if (this.isDryRun) return;
    try {
      await mkdir(this.releasesDir, { recursive: true });
    } catch (error) {
      throw new DeliveryFilesystemError(`Failed to create releases directory: ${this.releasesDir}`, error);
    }
  }

  private async safeUnlink(path: string): Promise<void> {
    try {
      await access(path, constants.F_OK);
      await unlink(path);
    } catch {
      // File does not exist, which is fine.
    }
  }

  public async installRelease(version: string): Promise<void> {
    if (this.isDryRun) {
      console.log(`[DRY-RUN] Would install release: ${version}`);
      return;
    }

    const targetReleaseDir = join(this.releasesDir, version);
    try {
      await access(targetReleaseDir, constants.F_OK);
    } catch {
      throw new DeliveryFilesystemError(`Target release directory does not exist: ${targetReleaseDir}`);
    }

    const tempLink = join(this.releasesDir, `current_tmp_${Date.now()}`);
    
    try {
      await this.safeUnlink(tempLink);
      await symlink(targetReleaseDir, tempLink, 'dir');
      
      let previousTarget: string | null = null;
      try {
        previousTarget = await readlink(this.currentLink);
        await this.safeUnlink(this.previousLink);
        await rename(this.currentLink, this.previousLink);
      } catch {
        // No previous current link, which is fine for first install.
      }

      await rename(tempLink, this.currentLink);
      console.log(`[Installer] Successfully promoted release ${version} to current.`);
    } catch (error) {
      await this.safeUnlink(tempLink);
      throw new DeliveryFilesystemError(`Atomic swap failed for version ${version}`, error);
    }
  }

  public async rollback(): Promise<void> {
    if (this.isDryRun) {
      console.log('[DRY-RUN] Would rollback to previous release.');
      return;
    }

    try {
      const previousTarget = await readlink(this.previousLink);
      const tempLink = join(this.releasesDir, `current_tmp_${Date.now()}`);
      
      await this.safeUnlink(tempLink);
      await symlink(previousTarget, tempLink, 'dir');
      await rename(tempLink, this.currentLink);
      
      console.log(`[Installer] Successfully rolled back to: ${previousTarget}`);
    } catch (error) {
      throw new DeliveryFilesystemError('Rollback failed: previous release link is missing or invalid', error);
    }
  }
}