/**
 * 1. Relative path: src/provision/portal.ts
 * 2. Description: HTTP server for the Out-of-Box Setup Portal, handling captive detection and WiFi injection.
 * 3. Expects: A join executor provided at startup — the portal stays a dumb transport, never an orchestrator.
 * 4. Provides: A zero-dependency intercept surface (port 80), a joining→joined/failed state machine with retry arm, join polling.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { renderWizardPage } from './wizardPage.js';
import {
  isPortalJoinRequest,
  type PortalJoinRequest,
  type PortalJoinResult,
  type PortalState,
} from './schema.js';
import { ProvisionPortalError } from '../errors.js';

export interface PortalServerHandle {
  /** Resolves exactly when the portal reaches the "joined" state; never on failure (the wizard re-arms instead). */
  whenJoined(): Promise<PortalJoinRequest>;
  /** After a failed join the coordinator re-raises the AP and re-arms the wizard for the next attempt. */
  reset(): void;
  stop(): Promise<void>;
}

export interface PortalServerOptions {
  readonly host?: string;
  readonly port?: number;
  readonly onJoin: (request: PortalJoinRequest) => Promise<PortalJoinResult>;
}

export async function startPortalServer(options: PortalServerOptions): Promise<PortalServerHandle> {
  const HOST = options.host ?? '0.0.0.0';
  const PORT = options.port ?? 80;

  let currentState: PortalState = 'idle';
  let currentError: string | undefined = undefined;
  let joinedSsid: string | undefined = undefined;
  let joinInProgress = false;

  const joinedWaiters = new Array<(request: PortalJoinRequest) => void>();

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
      const isNewSubmission = currentState !== 'joining';
      if (!isNewSubmission || joinInProgress) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'failed',
          reason: 'invalid-request',
          message: 'A join is already in progress',
        }));
        return;
      }

      let body = '';
      req.on('data', (chunk: Buffer) => {
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
        joinInProgress = true;

        // 202 Accepted: the join runs async; the client polls /status for the verdict.
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'joining' }));

        void options
          .onJoin(request)
          .then((result: PortalJoinResult) => {
            if (result.status === 'joined') {
              currentState = 'joined';
              joinedSsid = request.ssid;
              for (const waiter of joinedWaiters.splice(0)) {
                waiter(request);
              }
            } else if (result.status === 'failed') {
              currentState = 'failed';
              const detailed = result.message;
              currentError = detailed !== undefined && detailed.length > 0 ? detailed : result.reason;
            }
          })
          .catch((err: unknown) => {
            currentState = 'failed';
            currentError = err instanceof Error ? err.message : 'Unknown join failure';
          })
          .finally(() => {
            joinInProgress = false;
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
        whenJoined: () =>
          new Promise<PortalJoinRequest>((waitForJoined) => {
            joinedWaiters.push(waitForJoined);
          }),
        reset: () => {
          if (currentState === 'joined') return;
          currentState = 'idle';
          currentError = undefined;
        },
        stop: () =>
          new Promise<void>((resolveStop) => {
            server.close(() => resolveStop());
          }),
      });
    });
  });
}