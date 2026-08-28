// 1. Relative path: src/crdt/reputationLog.ts
// 2. Description: Append-only G-Set CRDT for reputation events with read-time decay projection and anti-entropy sync.
// 3. Expects: TrustRegistry for signature verification, strict Ed25519 crypto primitives, and calculateReputationScore.
// 4. Provides: Mathematically pure reputation tracking, idempotent merging, and Merkle root generation.

import { createHash } from 'node:crypto';
import type { ReputationEvent, PeerTrustRecord } from '../types.js';
import type { TrustRegistry } from '../peer/index.js';
import { calculateReputationScore } from './reputation.js';
import { SwISDError } from '../errors.js';
import { verifyEd25519 } from '../crypto/index.js';

export interface ReputationLogDependencies {
  readonly trustRegistry: TrustRegistry;
}

export class ReputationLog {
  private readonly events: Set<ReputationEvent> = new Set();
  private readonly deps: ReputationLogDependencies;

  constructor(deps: ReputationLogDependencies) {
    this.deps = deps;
  }

  public append(event: ReputationEvent): void {
    // 1. Idempotency check (G-Set union property)
    for (const existing of this.events) {
      if (existing.eventId === event.eventId) return;
    }

    // 2. Trust Boundary Check
    const authorRecord: PeerTrustRecord | undefined = this.deps.trustRegistry.getPeer(event.authorPeerId);
    if (!authorRecord || authorRecord.state !== 'trusted') {
      throw new SwISDError('ERR_TRUST_INVALID', `Author ${event.authorPeerId} is not trusted`);
    }

    // 3. Signature Verification
    // We strip the signature to verify the rest of the payload deterministically
    const { signature, ...payloadWithoutSig } = event;
    const dataToVerify = new TextEncoder().encode(JSON.stringify(payloadWithoutSig));
    
    const publicKey: Uint8Array | undefined = this.deps.trustRegistry.getPublicKey(event.authorPeerId);
    if (!publicKey) {
      throw new SwISDError('ERR_CRYPTO_INVALID', `No public key found for author ${event.authorPeerId}`);
    }

    const isValid: boolean = verifyEd25519(signature, dataToVerify, publicKey);
    if (!isValid) {
      throw new SwISDError('ERR_CRYPTO_INVALID', `Invalid signature for reputation event ${event.eventId}`);
    }

    // 4. Append (Inflationary update)
    this.events.add(event);
  }

  public merge(remote: ReadonlySet<ReputationEvent>): void {
    for (const event of remote) {
      // We wrap in try/catch to prevent a single bad remote event from poisoning the entire merge batch
      try {
        this.append(event);
      } catch (error) {
        if (error instanceof SwISDError) {
          console.warn(`[ReputationLog] Dropping invalid remote event: ${error.message}`);
        }
      }
    }
  }

  public getEventsForPeer(peerId: string): ReadonlyArray<ReputationEvent> {
    const result: ReputationEvent[] = [];
    for (const event of this.events) {
      if (event.targetPeerId === peerId) {
        result.push(event);
      }
    }
    return result;
  }

  public readScore(peerId: string, nowMs: number): number {
    const events = this.getEventsForPeer(peerId);
    // Pure read-time projection. No state mutation.
    return calculateReputationScore(events, nowMs);
  }

  public getMerkleRoot(): string {
    const eventIds = Array.from(this.events).map(e => e.eventId).sort();
    if (eventIds.length === 0) {
      return createHash('sha256').update('swisd-empty-reputation-set').digest('hex');
    }
    
    const hash = createHash('sha256');
    for (const id of eventIds) {
      hash.update(id);
    }
    return hash.digest('hex');
  }

  public getAllEvents(): ReadonlySet<ReputationEvent> {
    return new Set(this.events);
  }
}

export function reconcileReputation(
  local: ReputationLog,
  remoteRoot: string,
  remoteEvents: ReadonlySet<ReputationEvent>
): ReputationLog {
  // 1. Verify remote events hash matches the claimed remoteRoot
  const remoteIds = Array.from(remoteEvents).map(e => e.eventId).sort();
  const remoteHash = createHash('sha256');
  for (const id of remoteIds) {
    remoteHash.update(id);
  }
  const computedRemoteRoot = remoteHash.digest('hex');

  if (computedRemoteRoot !== remoteRoot) {
    throw new SwISDError('ERR_CRDT_INVALID_MERGE', 'Remote events do not match the provided Merkle root');
  }

  // 2. Merge only if roots differ (Anti-entropy)
  const localRoot = local.getMerkleRoot();
  if (localRoot !== remoteRoot) {
    local.merge(remoteEvents);
  }

  return local;
}