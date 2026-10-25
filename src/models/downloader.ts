// 1. Relative path: src/models/downloader.ts
// 2. Description: Streaming download pipeline for HuggingFace models.
// 3. Expects: Approved repo IDs, file selections, a signing function, and a CredentialManager.
// 4. Provides: Background downloading with progress telemetry and Merkle-verified ingestion.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { EventEmitter } from 'node:events';
import type { ModelRegistry } from './registry.js';
import { ingestModelStream } from './ingest.js';
import type { ModelFile } from './schema.js';
import { SwISDError } from '../errors.js';
import type { CredentialManager } from '../config/credentials.js';

export interface DownloadProgress {
  readonly modelId: string;
  readonly bytesDownloaded: number;
  readonly totalBytes: number;
  readonly throughputBytesPerSec: number;
  readonly status: 'downloading' | 'chunking' | 'completed' | 'failed';
  readonly error?: string;
}

export class ModelDownloader extends EventEmitter {
  private activeDownloads = new Map<string, AbortController>();

  constructor(
    private readonly registry: ModelRegistry,
    private readonly deliveryRoot: string,
    private readonly signPayload: (payload: string) => Promise<Uint8Array>,
    private readonly credentialManager: CredentialManager
  ) {
    super();
  }

  public async startDownload(
    repoId: string,
    selectedFiles: ReadonlyArray<ModelFile>,
    requiredCapability: string
  ): Promise<void> {
    const modelId = repoId.replace(/\//g, '--');
    if (this.activeDownloads.has(modelId)) {
      throw new SwISDError('ERR_MODEL_DOWNLOAD_FAILED', 'Download already in progress');
    }

    if (selectedFiles.length === 0) {
      this.emitProgress(modelId, 0, 0, 0, 'failed', 'Blind download not supported: No files specified. Metadata fetch likely failed.');
      return;
    }

    const controller = new AbortController();
    this.activeDownloads.set(modelId, controller);

    const initialTotalBytes = selectedFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
    this.emitProgress(modelId, 0, initialTotalBytes, 0, 'downloading');

    try {
      const combinedStream = this.createCombinedHfStream(repoId, selectedFiles, controller.signal, initialTotalBytes);
      
      const manifest = await ingestModelStream({
        source: combinedStream,
        repoId,
        selectedFiles,
        requiredCapability,
        deliveryRoot: this.deliveryRoot,
        signPayload: this.signPayload,
      });

      await this.registry.add(manifest);
      this.emitProgress(modelId, initialTotalBytes, initialTotalBytes, 0, 'completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emitProgress(modelId, 0, initialTotalBytes, 0, 'failed', msg);
    } finally {
      this.activeDownloads.delete(modelId);
    }
  }

  private emitProgress(
    modelId: string,
    bytesDownloaded: number,
    totalBytes: number,
    throughput: number,
    status: DownloadProgress['status'],
    error?: string
  ): void {
    this.emit('progress', { modelId, bytesDownloaded, totalBytes, throughputBytesPerSec: throughput, status, error } as DownloadProgress);
  }

  private async *createCombinedHfStream(
    repoId: string,
    files: ReadonlyArray<ModelFile>,
    signal: AbortSignal,
    initialTotalBytes: number
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

      // Self-correcting total: read Content-Length to fix the totalBytes: 0 blindness
      const contentLength = response.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength, 10) : file.sizeBytes;
      
      if (!isNaN(fileSize) && fileSize > 0) {
        // If we started with 0 total bytes, or if actual files are larger than metadata suggested
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
            this.emitProgress(repoId.replace(/\//g, '--'), totalDownloaded, dynamicTotalBytes, throughput, 'downloading');
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