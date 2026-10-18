/**
 * 1. Relative path: src/provision/portal.ts
 * 2. Description: HTTP server for the Out-of-Box Setup Portal, handling captive detection and WiFi injection.
 * 3. Expects: Node.js native http module, strict TypeScript, and the existing apply.ts CLI seam.
 * 4. Provides: A zero-dependency bootstrap surface for smartphone-friendly WiFi credential injection.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderWizardPage } from './wizardPage.js';
import {
  isPortalJoinRequest,
  type PortalFailureReason,
  type PortalJoinRequest,
  type PortalJoinResult,
  type PortalState,
} from './schema.js';
import { ProvisionPortalError } from '../errors.js';
import type { ProvisionConfig } from '../config/schema.js';
import { parsePort } from '../utils.js';

// Production binds 80 (captive detection demands it); local testing overrides via env.
const PORT = parsePort(process.env.SWISD_PORTAL_PORT, 80);
const HOST = process.env.SWISD_PORTAL_HOST ?? '0.0.0.0';

export interface PortalServerHandle {
  readonly url: string;
  stop(): Promise<void>;
}

export async function startPortalServer(): Promise<PortalServerHandle> {
  let currentState: PortalState = 'idle';
  let currentError: string | undefined = undefined;
  let joinedSsid: string | undefined = undefined;

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET') {
      if (pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: currentState,
          error: currentError ?? null,
          ssid: joinedSsid ?? null,
        }));
        return;
      }

      // Serve the wizard for every other GET: this is the captive-detection interception.
      // iOS/Android probes hit arbitrary hosts and paths; they all receive the form.
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderWizardPage(currentState, currentError, joinedSsid));
      return;
    }

    if (req.method === 'POST' && pathname === '/join') {
      if (currentState === 'joining' || currentState === 'joined') {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'failed',
          reason: 'invalid-request',
          message: 'Join already in progress or completed',
        }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += String(chunk);
      });

      req.on('end', () => {
        // Parse and validate BEFORE any state mutation or response write.
        // Garbage requests must never flip the portal into a failed state.
        let parsed: unknown;
        try {
          parsed = JSON.parse(body) as unknown;
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'failed',
            reason: 'invalid-request',
            message: 'Malformed JSON body',
          }));
          return;
        }

        if (!isPortalJoinRequest(parsed)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'failed',
            reason: 'invalid-request',
            message: 'Invalid join payload',
          }));
          return;
        }

        // Const copy: narrowing survives into the async closure.
        const request: PortalJoinRequest = parsed;

        currentState = 'joining';
        currentError = undefined;

        // 202 Accepted: the join runs async; the client polls /status for the verdict.
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'joining' }));

        void attemptJoin(request)
          .then((result: PortalJoinResult) => {
            if (result.status === 'joined') {
              currentState = 'joined';
              joinedSsid = request.ssid;
            } else if (result.status === 'failed') {
              currentState = 'failed';
              const detailed = result.message;
              currentError = detailed !== undefined && detailed.length > 0 ? detailed : result.reason;
            }
          })
          .catch((err: unknown) => {
            currentState = 'failed';
            currentError = err instanceof Error ? err.message : 'Unknown join failure';
          });
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return new Promise<PortalServerHandle>((resolve, reject) => {
    server.on('error', (err: Error) => {
      reject(new ProvisionPortalError(`Failed to bind portal server on ${HOST}:${PORT}: ${err.message}`, err));
    });

    server.listen(PORT, HOST, () => {
      console.log(`[Portal] Captive portal listening on http://${HOST}:${PORT}`);
      resolve({
        url: `http://${HOST}:${PORT}`,
        stop: () =>
          new Promise<void>((resolveStop) => {
            server.close(() => resolveStop());
          }),
      });
    });
  });
}

async function attemptJoin(req: PortalJoinRequest): Promise<PortalJoinResult> {
  const config: ProvisionConfig = {
    wifi: {
      ssid: req.ssid,
      psk: req.passphrase ?? '',
      country: req.country,
    },
    role: 'auto',
    modelSource: { type: 'hf', url: 'https://huggingface.co/swisd/placeholder' },
    version: 1,
  };

  const tempDir = mkdtempSync(join(tmpdir(), 'swisd-portal-'));
  const tempFile = join(tempDir, 'provision.json');

  try {
    writeFileSync(tempFile, JSON.stringify(config));

    const applyScript = fileURLToPath(new URL('./apply.js', import.meta.url));

    return await new Promise<PortalJoinResult>((resolve) => {
      const child = spawn('node', [applyScript], {
        env: { ...process.env, SWISD_PROVISION_PATH: tempFile },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code: number | null) => {
        if (code === 0) {
          resolve({ status: 'joined', ssid: req.ssid });
          return;
        }

        let reason: PortalFailureReason = 'auth-failed';
        if (stderr.includes('SSID not found') || stderr.includes('not found')) {
          reason = 'ssid-not-found';
        } else if (stderr.includes('Timeout') || stderr.includes('timed out')) {
          reason = 'join-timeout';
        } else if (stderr.includes('Invalid') || stderr.includes('schema')) {
          reason = 'invalid-request';
        }

        resolve({
          status: 'failed',
          reason,
          message: stderr.trim().length > 0 ? stderr.trim() : `Provision agent exited with code ${String(code)}`,
        });
      });

      child.on('error', (err: Error) => {
        resolve({
          status: 'failed',
          reason: 'unknown',
          message: `Failed to launch provision agent: ${err.message}`,
        });
      });
    });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}