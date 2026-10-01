// 1. Relative path: src/admin/server.ts
// 2. Description: Local token-guarded HTTP JSON API for observability and headless fleet management.
// 3. Expects: Admin server configuration, an observability source, and an event bus.
// 4. Provides: Read-only JSON endpoints for the SvelteKit Conductor Cockpit and local integrations.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { SwISDError } from '../errors.js';
import {
  buildSwarmSnapshot,
  ObservabilityEventBus,
  ObservabilitySource,
} from '../observability/index.js';

export interface AdminServerConfig {
  readonly host: string;
  readonly port: number;
  readonly token: string;
  readonly allowLan: boolean;
  readonly enableCors: boolean;
  readonly source: ObservabilitySource;
  readonly eventBus: ObservabilityEventBus;
}

export interface AdminServerHandle {
  start(): Promise<void>;
  stop(): Promise<void>;
  url(): string;
}

const LOOPBACK_HOSTS: ReadonlyArray<string> = ['127.0.0.1', 'localhost', '::1'];

function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.includes(host);
}

function safeTokenEqual(provided: string, expected: string): boolean {
  const left = new TextEncoder().encode(provided);
  const right = new TextEncoder().encode(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function getBearerToken(req: IncomingMessage): string | null {
  const rawAuth = req.headers.authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] ?? '' : rawAuth ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(payload);
}

function setCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const rawOrigin = req.headers.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] ?? '' : rawOrigin ?? '';
  const allowedOrigin = origin.length > 0 ? origin : '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
}

function validateAdminServerConfig(config: AdminServerConfig): void {
  if (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535) {
    throw new SwISDError('ERR_ADMIN_SERVER_FAILED', 'Admin server port must be a valid TCP port.');
  }
  if (config.token.trim().length < 16) {
    throw new SwISDError('ERR_ADMIN_SERVER_FAILED', 'Admin token must be at least 16 characters.');
  }
  if (!config.allowLan && !isLoopbackHost(config.host)) {
    throw new SwISDError(
      'ERR_ADMIN_SERVER_FAILED',
      `Admin host ${config.host} is not loopback. Set SWISD_ALLOW_LAN_ADMIN=true to bind non-loopback hosts.`
    );
  }
}

export function createAdminServer(config: AdminServerConfig): AdminServerHandle {
  let server: Server | undefined;

  const handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
    void handleRequestAsync(req, res);
  };

  const handleRequestAsync = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');

      if (config.enableCors) {
        setCorsHeaders(req, res);
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (!url.pathname.startsWith('/v1/')) {
        sendJson(res, 404, { error: 'Not found' });
        return;
      }

      const token = getBearerToken(req);
      if (token === null || !safeTokenEqual(token, config.token)) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }

      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
      }

      if (url.pathname === '/v1/health') {
        const info = config.source.getProcessInfo();
        sendJson(res, 200, {
          status: 'ok',
          peerId: info.peerId,
          version: info.version,
          uptimeMs: info.uptimeMs,
        });
        return;
      }

      if (url.pathname === '/v1/snapshot') {
        const snapshot = buildSwarmSnapshot(config.source, config.eventBus);
        sendJson(res, 200, snapshot);
        return;
      }

      if (url.pathname === '/v1/events') {
        const afterParam = url.searchParams.get('after') ?? '0';
        const afterParsed = Number.parseInt(afterParam, 10);
        const afterSafe = Number.isInteger(afterParsed) && afterParsed >= 0 ? afterParsed : 0;

        const limitParam = url.searchParams.get('limit') ?? '100';
        const limitParsed = Number.parseInt(limitParam, 10);
        const limitSafe = Number.isInteger(limitParsed) && limitParsed > 0
          ? Math.min(limitParsed, 500)
          : 100;

        const events = config.eventBus.since(afterSafe, limitSafe);
        const last = events.length > 0 ? events[events.length - 1] : undefined;
        const nextAfter = last ? last.sequence : afterSafe;

        sendJson(res, 200, {
          events,
          nextAfter,
        });
        return;
      }

      if (url.pathname === '/v1/delivery/status') {
        sendJson(res, 200, config.source.getDeliveryInfo());
        return;
      }

      sendJson(res, 404, { error: 'Unknown observability route' });
    } catch (error: unknown) {
      const message = error instanceof SwISDError
        ? error.message
        : error instanceof Error 
          ? error.message 
          : 'Internal observability server error';
      sendJson(res, 500, { error: message });
    }
  };

  return {
    async start(): Promise<void> {
      validateAdminServerConfig(config);
      await new Promise<void>((resolve, reject) => {
        const srv = createServer(handleRequest);
        const onError = (err: Error): void => {
          reject(new SwISDError('ERR_ADMIN_SERVER_FAILED', 'Failed to start admin server.', err));
        };
        srv.once('error', onError);
        srv.listen(config.port, config.host, () => {
          srv.removeListener('error', onError);
          server = srv;
          resolve();
        });
      });
    },
    async stop(): Promise<void> {
      await new Promise<void>((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        const activeServer = server as Server & { closeAllConnections?: () => void };
        activeServer.closeAllConnections?.();
        activeServer.close((err?: Error) => {
          if (err) {
            reject(new SwISDError('ERR_ADMIN_SERVER_FAILED', 'Failed to close admin server.', err));
            return;
          }
          resolve();
        });
      });
      server = undefined;
    },
    url(): string {
      return `http://${config.host}:${config.port}`;
    },
  };
}