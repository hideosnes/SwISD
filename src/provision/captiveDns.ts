// 1. Relative path: src/provision/captiveDns.ts
// 2. Description: Minimal zero-dependency UDP DNS responder that points every A query at the setup portal (captive detection interception).
// 3. Expects: Port 53 (root on a Pi); raw DNS wire format without a resolver library.
// 4. Provides: A DnsCaptiveHandle to start/stop the interception socket. AAAA answers empty so stacks fall back to IPv4.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { createSocket, type Socket } from 'node:dgram';
import type { RemoteInfo } from 'node:dgram';
import { SwISDError } from '../errors.js';

const DNS_HEADER_BYTES = 12;
const DNS_TYPE_A = 1;
const DNS_TYPE_AAAA = 28;
const DNS_FLAG_QR = 0x8000;
const DNS_FLAG_AA = 0x0400;
const DNS_FLAG_RD = 0x0100;

export interface DnsCaptiveHandle {
  readonly port: number;
  stop(): Promise<void>;
}

export interface CaptiveDnsOptions {
  readonly portalIp: string;
  readonly port?: number;
  readonly host?: string;
}

/**
 * Answers every A query with the portal address so iOS/Android captive checks
 * and browser navigations land on the SwISD setup wizard. AAAA gets an
 * authoritative empty answer so happy-eyeballs falls through to IPv4.
 */
export function startCaptiveDns(options: CaptiveDnsOptions): Promise<DnsCaptiveHandle> {
  const port = options.port ?? 53;
  const host = options.host ?? '0.0.0.0';
  const portalIp = options.portalIp;

  const socket = createSocket({ type: 'udp4', reuseAddr: true });

  socket.on('message', (msg: Buffer, remote: RemoteInfo) => {
    if (!isPlausibleQuery(msg)) return;

    const questionType = readQuestionType(msg);
    const response =
      questionType === DNS_TYPE_A
        ? buildAResponse(msg, portalIp)
        : buildEmptyAuthoritative(msg);

    socket.send(response, remote.port, remote.address);
  });

  socket.on('error', () => {
    // A dropped UDP datagram is harmless — the client retries. Never crash the wizard over it.
  });

  return new Promise<DnsCaptiveHandle>((resolve, reject) => {
    socket.once('error', (err: Error) => {
      reject(
        new SwISDError('ERR_PROVISION_DNS_BIND_FAILED', `Failed to bind captive DNS on ${host}:${port}: ${err.message}`, err)
      );
    });

    socket.bind(port, host, () => {
      resolve({
        port,
        stop: () =>
          new Promise<void>((resolveStop) => {
            socket.close(() => resolveStop());
          }),
      });
    });
  });
}

function isPlausibleQuery(msg: Buffer): boolean {
  if (msg.length < DNS_HEADER_BYTES + 5) return false;
  const buffer = Buffer.from(msg);
  const flags = buffer.readUInt16BE(2);
  const isQuery = (flags & DNS_FLAG_QR) === 0;
  const qdcount = buffer.readUInt16BE(4);
  return isQuery && qdcount === 1;
}

function readQuestionType(msg: Buffer): number | null {
  const buffer = Buffer.from(msg);
  let offset = DNS_HEADER_BYTES;
  while (offset < buffer.length) {
    const length = buffer.readUInt8(offset);
    if (length === 0) {
      offset += 1;
      if (offset + 4 > buffer.length) return null;
      return buffer.readUInt16BE(offset);
    }
    // Label pointers inside a question are RFC-legal but never sent by real resolvers.
    if ((length & 0xc0) !== 0) return null;
    offset += length + 1;
  }
  return null;
}

function buildAResponse(query: Buffer, portalIp: string): Buffer {
  const question = buildQuestionSlice(query);
  const rdata = Buffer.from(parseIpv4(portalIp));

  const header = Buffer.alloc(DNS_HEADER_BYTES);
  query.copy(header, 0, 0, DNS_HEADER_BYTES);
  const flags = DNS_FLAG_QR | DNS_FLAG_AA | DNS_FLAG_RD | 0x0080; // RA: recursive-available bit set, RCODE=0
  header.writeUInt16BE(flags, 2);
  header.writeUInt16BE(1, 6); // ancount

  const rr = createAnswerRR(DNS_TYPE_A, rdata);
  return Buffer.concat([header, question, rr]);
}

function buildEmptyAuthoritative(query: Buffer): Buffer {
  const header = Buffer.alloc(DNS_HEADER_BYTES);
  query.copy(header, 0, 0, DNS_HEADER_BYTES);
  header.writeUInt16BE(DNS_FLAG_QR | DNS_FLAG_AA, 2);
  return Buffer.concat([header, buildQuestionSlice(query)]);
}

/** Echo the original question bytes verbatim (from offset 12 up to end of class field). */
function buildQuestionSlice(query: Buffer): Buffer {
  let offset = DNS_HEADER_BYTES;
  while (offset < query.length) {
    const length = query.readUInt8(offset);
    if (length === 0) {
      return query.subarray(0, offset + 5); // label terminator + qtype(2) + qclass(2)
    }
    if ((length & 0xc0) !== 0) return query.subarray(0, query.length);
    offset += length + 1;
  }
  return query.subarray(0, query.length);
}

function createAnswerRR(type: number, rdata: Buffer): Buffer {
  // Name: pointer to the question's first label (offset 12).
  const rr = Buffer.alloc(2 + 2 + 2 + 4 + 2 + rdata.length);
  let cursor = 0;
  rr.writeUInt16BE(0xc00c, cursor); cursor += 2;
  rr.writeUInt16BE(type, cursor); cursor += 2;
  rr.writeUInt16BE(1, cursor); cursor += 2; // class IN
  rr.writeUInt32BE(30, cursor); cursor += 4; // short TTL: intervention changes propagate fast
  rr.writeUInt16BE(rdata.length, cursor); cursor += 2;
  rdata.copy(rr, cursor);
  return rr;
}

function parseIpv4(ip: string): ReadonlyArray<number> {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error(`Invalid IPv4 portal address: ${ip}`);
  const bytes = parts.map((part: string) => {
    const value = Number.parseInt(part, 10);
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw new Error(`Invalid IPv4 octet in portal address: ${ip}`);
    }
    return value;
  });
  return bytes;
}
