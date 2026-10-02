/**
 * 1. Relative path: src/ownership/schema.ts
 * 2. Description: Strict schema types for the Sovereignty Layer Ownership Ledger.
 * 3. Expects: Hex-pure domain types and canonical serialization.
 * 4. Provides: Type-safe contracts for the keystone, conductors, rotation events, ledger backups, and a shared strict parser.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { type HexString } from '../crypto/hex.js';
import { LedgerCorruptError } from '../errors.js';

export type Ed25519PublicKeyHex = HexString;
export type Ed25519SignatureHex = HexString;
export type Argon2idHash = string;

export type NodePolicy = 'locked' | 'open';

/**
 * Amended Keystone Doctrine: workload participation is policy-governed.
 * 'forbidden' preserves canon behavior (ownership only, never workload).
 * 'allowed' lets the keystone behave like any other worker node.
 */
export type KeystoneWorkloadPolicy = 'forbidden' | 'allowed';

export interface ConductorDevice {
  readonly publicKey: Ed25519PublicKeyHex;
  readonly enrolledAt: number;
  readonly enrolledBy: Ed25519PublicKeyHex | 'recovery' | 'genesis';
}

/** Healthy keystone hands the crown to a designated node. Signed by the SITTING keystone. */
export interface LedgerTransferEvent {
  readonly type: 'transfer';
  readonly previousKeystone: Ed25519PublicKeyHex;
  readonly newKeystone: Ed25519PublicKeyHex;
}

/** Keystone died; the pre-registered successor takes over. Signed by the SUCCESSOR. */
export interface LedgerSuccessionEvent {
  readonly type: 'succession';
  readonly previousKeystone: Ed25519PublicKeyHex;
  readonly newKeystone: Ed25519PublicKeyHex;
}

export type LedgerEvent = LedgerTransferEvent | LedgerSuccessionEvent;

export interface OwnershipLedgerPayload {
  readonly swarmName: string;
  readonly revision: number;
  readonly conductors: ReadonlyArray<ConductorDevice>;
  readonly policy: NodePolicy;
  readonly keystoneWorkload: KeystoneWorkloadPolicy;
  readonly recoveryPhraseHash: Argon2idHash;
  readonly successorKey: Ed25519PublicKeyHex | null;
  /** One-shot rotation event; null on ordinary revisions. */
  readonly event: LedgerEvent | null;
}

export interface OwnershipLedger extends OwnershipLedgerPayload {
  /** Public key of the signer of THIS revision (sitting keystone, or successor during succession). */
  readonly keystonePublicKey: Ed25519PublicKeyHex;
  readonly signature: Ed25519SignatureHex;
}

/** The exact signed bytes of a ledger revision. Never mutated, never re-serialized locally. */
export type LedgerBackupBlob = Uint8Array;

/**
 * Canonical serialization for signing. Explicitly picks payload fields only,
 * so passing a full OwnershipLedger can never leak signature fields into the
 * signed byte range. Keys are sorted for deterministic JSON output.
 */
export function serializeLedgerPayload(payload: OwnershipLedgerPayload): Uint8Array {
  const canonical: OwnershipLedgerPayload = {
    swarmName: payload.swarmName,
    revision: payload.revision,
    conductors: payload.conductors,
    policy: payload.policy,
    keystoneWorkload: payload.keystoneWorkload,
    recoveryPhraseHash: payload.recoveryPhraseHash,
    successorKey: payload.successorKey,
    event: payload.event,
  };
  const encoder = new TextEncoder();
  return encoder.encode(JSON.stringify(sortKeys(canonical)));
}

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);

  const sortedObj: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sortedObj[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }
  return sortedObj;
}

export function isEd25519PublicKeyHex(value: string): value is Ed25519PublicKeyHex {
  return /^0x[0-9a-f]{64}$/.test(value);
}

export function isEd25519SignatureHex(value: string): value is Ed25519SignatureHex {
  return /^0x[0-9a-f]{128}$/.test(value);
}

/**
 * Shared strict parser used by BOTH the keystone and the bond anchor.
 * Single source of truth for ledger shape validation; throws LedgerCorruptError
 * with surgical messages instead of returning boolean mush.
 */
export function assertOwnershipLedger(data: unknown): OwnershipLedger {
  if (typeof data !== 'object' || data === null) {
    throw new LedgerCorruptError('Ledger must be a non-null object');
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.swarmName !== 'string' || obj.swarmName.length === 0) {
    throw new LedgerCorruptError('Ledger swarmName is missing or empty');
  }
  if (typeof obj.revision !== 'number' || !Number.isInteger(obj.revision) || obj.revision < 1) {
    throw new LedgerCorruptError('Ledger revision must be an integer >= 1');
  }
  if (!Array.isArray(obj.conductors)) {
    throw new LedgerCorruptError('Ledger conductors must be an array');
  }
  const conductors: ConductorDevice[] = [];
  for (const entry of obj.conductors) {
    conductors.push(assertConductor(entry));
  }
  if (obj.policy !== 'locked' && obj.policy !== 'open') {
    throw new LedgerCorruptError('Ledger policy must be locked | open');
  }
  if (obj.keystoneWorkload !== 'forbidden' && obj.keystoneWorkload !== 'allowed') {
    throw new LedgerCorruptError('Ledger keystoneWorkload must be forbidden | allowed');
  }
  if (typeof obj.recoveryPhraseHash !== 'string' || obj.recoveryPhraseHash.length === 0) {
    throw new LedgerCorruptError('Ledger recoveryPhraseHash is missing');
  }
  if (obj.successorKey !== null && !(typeof obj.successorKey === 'string' && isEd25519PublicKeyHex(obj.successorKey))) {
    throw new LedgerCorruptError('Ledger successorKey must be null or a valid Ed25519 public key');
  }
  if (typeof obj.keystonePublicKey !== 'string' || !isEd25519PublicKeyHex(obj.keystonePublicKey)) {
    throw new LedgerCorruptError('Ledger keystonePublicKey is not a valid Ed25519 public key');
  }
  if (typeof obj.signature !== 'string' || !isEd25519SignatureHex(obj.signature)) {
    throw new LedgerCorruptError('Ledger signature is not a valid Ed25519 signature');
  }
  const event = assertLedgerEvent(obj.event);

  return {
    swarmName: obj.swarmName,
    revision: obj.revision,
    conductors,
    policy: obj.policy,
    keystoneWorkload: obj.keystoneWorkload,
    recoveryPhraseHash: obj.recoveryPhraseHash,
    successorKey: obj.successorKey,
    event,
    keystonePublicKey: obj.keystonePublicKey,
    signature: obj.signature,
  };
}

function assertConductor(data: unknown): ConductorDevice {
  if (typeof data !== 'object' || data === null) {
    throw new LedgerCorruptError('Conductor entry must be a non-null object');
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.publicKey !== 'string' || !isEd25519PublicKeyHex(obj.publicKey)) {
    throw new LedgerCorruptError('Conductor publicKey is not a valid Ed25519 public key');
  }
  if (typeof obj.enrolledAt !== 'number' || !Number.isInteger(obj.enrolledAt) || obj.enrolledAt < 0) {
    throw new LedgerCorruptError('Conductor enrolledAt must be a non-negative integer');
  }

  const enrolledBy = obj.enrolledBy;
  const isValidEnrolledBy =
    enrolledBy === 'recovery' ||
    enrolledBy === 'genesis' ||
    (typeof enrolledBy === 'string' && isEd25519PublicKeyHex(enrolledBy));
  if (!isValidEnrolledBy) {
    throw new LedgerCorruptError('Conductor enrolledBy must be genesis | recovery | a valid Ed25519 public key');
  }

  return {
    publicKey: obj.publicKey,
    enrolledAt: obj.enrolledAt,
    enrolledBy: enrolledBy as ConductorDevice['enrolledBy'],
  };
}

function assertLedgerEvent(data: unknown): LedgerEvent | null {
  if (data === null) return null;
  if (typeof data !== 'object') {
    throw new LedgerCorruptError('Ledger event must be an object or null');
  }
  const obj = data as Record<string, unknown>;

  const previousKeystone = obj.previousKeystone;
  const newKeystone = obj.newKeystone;
  if (typeof previousKeystone !== 'string' || !isEd25519PublicKeyHex(previousKeystone)) {
    throw new LedgerCorruptError('Ledger event previousKeystone is not a valid Ed25519 public key');
  }
  if (typeof newKeystone !== 'string' || !isEd25519PublicKeyHex(newKeystone)) {
    throw new LedgerCorruptError('Ledger event newKeystone is not a valid Ed25519 public key');
  }

  if (obj.type === 'transfer') {
    return { type: 'transfer', previousKeystone, newKeystone };
  }
  if (obj.type === 'succession') {
    return { type: 'succession', previousKeystone, newKeystone };
  }
  throw new LedgerCorruptError('Ledger event type must be transfer | succession');
}