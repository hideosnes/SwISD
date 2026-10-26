// 1. Relative path: src/models/downloader.ts
// 2. Description: Streaming download pipeline for HuggingFace models.
// 3. Expects: Approved repo IDs, file selections, a signing function, and a CredentialManager.
// 4. Provides: Background downloading with progress telemetry, Merkle-verified ingestion, and ruthless pre-flight storage validation.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { statfs, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ModelRegistry } from './registry.js';
import { ingestModelStream } from './ingest.js';
import type { ModelFile, ModelManifest } from './schema.js';
import { SwISDError } from '../errors.js';
import type { CredentialManager } from '../config/credentials.js';

export interface DownloadProgress {
  readonly modelId: string;
  readonly repoId: string;
  readonly storagePath: string;
  readonly bytesDownloaded: number;
  readonly totalBytes: number;
  readonly throughputBytesPerSec: number;
  readonly status: 'downloading' | 'chunking' | 'completed' | 'failed';
  readonly error?: string;
}

export class ModelDownloader extends EventEmitter {
  private activeDownloads = new Map<string, AbortController>();
  private lastEmittedBytes = 0;
  public readonly __instanceId = Math.random().toString(36).slice(2, 8);

  constructor(
    private readonly registry: ModelRegistry,
    private readonly deliveryRoot: string,
    private readonly signPayload: (payload: string) => Promise<Uint8Array>,
    private readonly credentialManager: CredentialManager
  ) {
    super();
    console.log(`[ModelDownloader] Instance ${this.__instanceId} initialized.`);
  }

  public async startDownload(
    repoId: string,
    selectedFiles: ReadonlyArray<ModelFile>,
    requiredCapability: string,
    sourcePeerId: string
  ): Promise<void> {
    const modelId = repoId.replace(/\//g, '--');
    console.log(`[ModelDownloader] Instance ${this.__instanceId} starting download for ${modelId}`);

    if (this.activeDownloads.has(modelId)) {
      throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', 'Download already in progress');
    }

    const totalBytes = selectedFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
    const modelDir = resolve(join(this.deliveryRoot, 'models', modelId));

    this.emitProgress(modelId, repoId, modelDir, 0, totalBytes, 0, 'downloading');

    const controller = new AbortController();
    this.activeDownloads.set(modelId, controller);
    this.lastEmittedBytes = 0;

    try {
      if (selectedFiles.length === 0) {
        throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', 'Blind download not supported: No files specified.');
      }

      if (existsSync(modelDir)) {
        const manifestPath = join(modelDir, 'manifest.json');
        if (!existsSync(manifestPath)) {
          console.log(`[ModelDownloader] Found incomplete/corrupted directory for ${modelId}. Purging...`);
          try {
            await rm(modelDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new SwISDError('ERR_DELETION_FAILED', `Failed to purge corrupted directory ${modelId}: ${msg}`, err);
          }
        } else {
          throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', 'Model already exists and is complete');
        }
      }

      if (totalBytes > 0) {
        const stats = await statfs(this.deliveryRoot);
        const freeBytes = Number(stats.bsize) * Number(stats.bfree);
        const requiredBytes = totalBytes * 1.1;
        if (freeBytes < requiredBytes) {
          throw new SwISDError(
            'ERR_STORAGE_FULL', 
            `Insufficient disk space. Required: ${totalBytes} bytes, Available: ${freeBytes} bytes.`
          );
        }
      }

      const combinedStream = this.createCombinedHfStream(repoId, selectedFiles, controller.signal, totalBytes, modelDir);
      
      const manifest = await ingestModelStream({
        source: combinedStream,
        repoId,
        selectedFiles,
        requiredCapability,
        deliveryRoot: this.deliveryRoot,
        signPayload: this.signPayload,
        sourcePeerId,
      });

      const stampedManifest: ModelManifest = {
        ...manifest,
        sourcePeerId,
      };

      await this.registry.add(stampedManifest);
      this.emitProgress(modelId, repoId, modelDir, totalBytes, totalBytes, 0, 'completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emitProgress(modelId, repoId, modelDir, this.lastEmittedBytes, totalBytes, 0, 'failed', msg);
    } finally {
      this.activeDownloads.delete(modelId);
    }
  }

  private emitProgress(
    modelId: string,
    repoId: string,
    storagePath: string,
    bytesDownloaded: number,
    totalBytes: number,
    throughput: number,
    status: DownloadProgress['status'],
    error?: string
  ): void {
    this.lastEmittedBytes = bytesDownloaded;
    this.emit('progress', { modelId, repoId, storagePath, bytesDownloaded, totalBytes, throughputBytesPerSec: throughput, status, error } as DownloadProgress);
  }

  private async *createCombinedHfStream(
    repoId: string,
    files: ReadonlyArray<ModelFile>,
    signal: AbortSignal,
    initialTotalBytes: number,
    modelDir: string
  ): AsyncIterable<Uint8Array> {
    let totalDownloaded = 0;
    let lastTime = Date.now();
    let lastBytes = 0;
    let dynamicTotalBytes = initialTotalBytes;

    const token = this.credentialManager.getHuggingFaceToken();
    const headers: Record<string, string> = { 'Accept': 'application/octet-stream' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    for (const file of files) {
      const url = `https://huggingface.co/${repoId}/resolve/main/${file.path}`;
      const response = await fetch(url, { signal, headers });
      
      if (!response.ok) {
        throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `Failed to fetch ${file.path}: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', `No body for ${file.path}`);
      }

      const contentLength = response.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength, 10) : file.sizeBytes;
      
      if (!isNaN(fileSize) && fileSize > 0) {
        if (dynamicTotalBytes < totalDownloaded + fileSize) {
          dynamicTotalBytes = totalDownloaded + fileSize;
        }
      }

      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          totalDownloaded += value.length;
          
          const now = Date.now();
          const elapsed = now - lastTime;
          if (elapsed > 500) {
            const throughput = ((totalDownloaded - lastBytes) / elapsed) * 1000;
            this.emitProgress(repoId.replace(/\//g, '--'), repoId, modelDir, totalDownloaded, dynamicTotalBytes, throughput, 'downloading');
            lastTime = now;
            lastBytes = totalDownloaded;
          }

          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    }
  }
}