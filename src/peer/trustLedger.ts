// 1. Relative path: src/peer/trustLedger.ts
// 2. Description: Signed, append-only trust event ledger with Merkle root and replay projection.
// 3. Expects: A keystone Ed25519 public key (hex) and swisd-core crypto primitives.
// 4. Provides: Verifiable trust-granted/trust-revoked events, gossip merge, deterministic
//              replay into a TrustRegistry, JSONL persistence, and an anti-entropy root hash.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { signEd25519, verifyEd25519 } from '../crypto/ed25519.js';
import { hexToBytes, type HexString } from '../crypto/hex.js';
import { createLeafNode, createInternalNode } from '../crdt/merkle.js';
import type { TrustRegistry } from './trust.js';

export type TrustAction = 'trust-granted' | 'trust-revoked';

export interface TrustEvent {
  readonly peerId: string;
  readonly action: TrustAction;
  readonly timestamp: number;
  readonly authorPeerId: string;
  /** Ed25519 signature (hex) over the canonical payload (everything except signature). */
  readonly signature: string;
}

const ACTIONS: readonly TrustAction[] = ['trust-granted', 'trust-revoked'];
const encoder = new TextEncoder();

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

/** Canonical JSON serialization of an event (signature included when present). */
export function serializeTrustEvent(event: TrustEvent): string {
  return JSON.stringify(sortKeys(event));
}

function payloadBytes(event: Omit<TrustEvent, 'signature'>): Uint8Array {
  return encoder.encode(serializeTrustEvent(event as TrustEvent));
}

function eventId(event: TrustEvent): string {
  return createHash('sha256').update(encoder.encode(serializeTrustEvent(event))).digest('hex');
}

export interface CreateTrustEventInput {
  peerId: string;
  action: TrustAction;
  timestamp: number;
  authorPeerId: string;
}

/** Creates a keystone-signed trust event. Throws on an invalid action. */
export function createTrustEvent(
  input: CreateTrustEventInput,
  keystonePrivateKey: Uint8Array,
): TrustEvent {
  if (!ACTIONS.includes(input.action)) {
    throw new Error(`Invalid trust action: ${String(input.action)}`);
  }
  if (!Number.isFinite(input.timestamp) || input.timestamp < 0) {
    throw new Error('timestamp must be a non-negative finite number');
  }
  if (typeof input.peerId !== 'string' || input.peerId.length === 0) {
    throw new Error('peerId must be a non-empty string');
  }
  const signature = signEd25519(keystonePrivateKey, payloadBytes(input));
  return {
    ...input,
    signature: '0x' + Buffer.from(signature).toString('hex'),
  };
}

function verifyTrustEvent(event: TrustEvent, keystonePublicKeyHex: string): boolean {
  const { signature, ...payload } = event;
  if (typeof signature !== 'string' || !/^0x[0-9a-f]{128}$/.test(signature)) return false;
  return verifyEd25519(
    hexToBytes(keystonePublicKeyHex as HexString),
    payloadBytes(payload as Omit<TrustEvent, 'signature'>),
    hexToBytes(signature as HexString),
  );
}

export class TrustLedger {
  private readonly events = new Map<string, TrustEvent>();

  constructor(private readonly keystonePublicKeyHex: string) {}

  /** Verifies and appends an event. Returns false if forged, invalid, or already present. */
  public append(event: TrustEvent): boolean {
    if (this.events.has(eventId(event))) return false;
    if (!verifyTrustEvent(event, this.keystonePublicKeyHex)) return false;
    this.events.set(eventId(event), event);
    return true;
  }

  /** Merges a batch of gossip events; returns the number accepted. */
  public merge(events: ReadonlyArray<TrustEvent>): number {
    let accepted = 0;
    for (const event of events) {
      if (this.append(event)) accepted++;
    }
    return accepted;
  }

  /** Deterministic ordering: timestamp, then event id as a stable tiebreak. */
  public getEvents(): ReadonlyArray<TrustEvent> {
    return [...this.events.values()].sort((a, b) => {
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
      return eventId(a) < eventId(b) ? -1 : 1;
    });
  }

  /** Merkle root over the serialized event leaves — the anti-entropy fingerprint. */
  public getRoot(): string {
    const events = this.getEvents();
    if (events.length === 0) return '';
    let level = events.map(e => createLeafNode(encoder.encode(serializeTrustEvent(e))).cid);
    while (level.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        next.push(i + 1 < level.length
          ? createInternalNode([level[i]!, level[i + 1]!]).cid
          : level[i]!);
      }
      level = next;
    }
    return level[0]!;
  }

  /** Projects the ledger into a TrustRegistry, applying events in deterministic order. */
  public replay(registry: TrustRegistry): void {
    for (const event of this.getEvents()) {
      registry.discoverPeer(event.peerId, 'gossip');
      if (event.action === 'trust-granted') {
        registry.trustPeer(event.peerId);
      } else {
        registry.revokePeer(event.peerId);
      }
    }
  }

  /** Persists as JSONL (one serialized event per line). */
  public async persist(path: string): Promise<void> {
    const body = this.getEvents().map(serializeTrustEvent).join('\n') + '\n';
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body, 'utf-8');
  }

  /** Loads a JSONL file; every line must verify — throws on corrupt or tampered data. */
  public static async load(path: string, keystonePublicKeyHex: string): Promise<TrustLedger> {
    const ledger = new TrustLedger(keystonePublicKeyHex);
    let raw: string;
    try {
      raw = await readFile(path, 'utf-8');
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return ledger;
      }
      throw err;
    }
    for (const line of raw.split('\n')) {
      if (line.trim() === '') continue;
      let event: TrustEvent;
      try {
        event = JSON.parse(line) as TrustEvent;
      } catch {
        throw new Error(`Trust ledger corrupt: unparseable line in ${path}`);
      }
      if (!ledger.append(event)) {
        throw new Error(`Trust ledger corrupt: signature verification failed for a line in ${path}`);
      }
    }
    return ledger;
  }
}
