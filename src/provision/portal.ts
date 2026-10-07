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
  type PortalJoinRequest, 
  type PortalJoinResult, 
  type PortalState,
  type PortalFailureReason
} from './schema.js';
import { ProvisionPortalError } from '../errors.js';
import type { ProvisionConfig } from '../config/schema.js';

const PORT = 80;
const HOST = '0.0.0.0';

export interface PortalServerHandle {
  readonly url: string;
  stop(): Promise<void>;
}

export async function startPortalServer(): Promise<PortalServerHandle> {
  let currentState: PortalState = 'idle';
  let currentError: string | undefined = undefined;
  let joinedSsid: string | undefined = undefined;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET') {
      if (pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: currentState, error: currentError, ssid: joinedSsid }));
        return;
      }
      
      // Serve the wizard for all other GET requests to intercept captive portal detection
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderWizardPage(currentState, currentError, joinedSsid));
      return;
    }

    if (req.method === 'POST' && pathname === '/join') {
      if (currentState === 'joining' || currentState === 'joined') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'failed', reason: 'invalid-request', message: 'Already joining or joined' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body) as unknown;
          if (!isPortalJoinRequest(parsed)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'failed', reason: 'invalid-request', message: 'Invalid payload' }));
            return;
          }

          currentState = 'joining';
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'joining' }));

          const result = await attemptJoin(parsed);
          if (result.status === 'joined') {
            currentState = 'joined';
            joinedSsid = parsed.ssid;
          } else if (result.status === 'failed') {
            currentState = 'failed';
            currentError = result.message || result.reason;
          }
        } catch (err) {
          currentState = 'failed';
          currentError = err instanceof Error ? err.message : 'Unknown error';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'failed', reason: 'unknown', message: currentError }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      reject(new ProvisionPortalError(`Failed to bind portal server on port ${PORT}: ${err.message}`, err));
    });

    server.listen(PORT, HOST, () => {
      console.log(`[Portal] Captive portal listening on http://${HOST}:${PORT}`);
      resolve({
        url: `http://${HOST}:${PORT}`,
        stop: () => new Promise<void>((res) => server.close(() => res()))
      });
    });
  });
}

async function attemptJoin(req: PortalJoinRequest): Promise<PortalJoinResult> {
  const config: ProvisionConfig = {
    wifi: {
      ssid: req.ssid,
      psk: req.passphrase ?? '',
      country: req.country
    },
    role: 'auto',
    modelSource: { type: 'hf', url: 'https://huggingface.co/dummy' },
    version: 1
  };

  const tempDir = mkdtempSync(join(tmpdir(), 'swisd-portal-'));
  const tempFile = join(tempDir, 'provision.json');
  
  try {
    writeFileSync(tempFile, JSON.stringify(config));
    
    const applyScript = fileURLToPath(new URL('./apply.js', import.meta.url));
    
    return await new Promise<PortalJoinResult>((resolve) => {
      const child = spawn('node', [applyScript], {
        env: { ...process.env, SWISD_PROVISION_PATH: tempFile },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';
      child.stderr?.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ status: 'joined', ssid: req.ssid });
        } else {
          let reason: PortalFailureReason = 'auth-failed';
          if (stderr.includes('SSID not found')) reason = 'ssid-not-found';
          else if (stderr.includes('Timeout')) reason = 'join-timeout';
          
          resolve({ status: 'failed', reason, message: stderr.trim() || `Process exited with code ${code}` });
        }
      });
      
      child.on('error', (err) => {
        resolve({ status: 'failed', reason: 'unknown', message: err.message });
      });
    });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}