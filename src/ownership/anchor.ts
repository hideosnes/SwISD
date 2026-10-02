/**
 * 1. Relative path: src/ownership/anchor.ts
 * 2. Description: Worker-side bond anchor: fixed-size keystone bond, offline whitelist cache,
 *    revision monotonicity enforcement, key-rotation verification, and read-only backup blob custody.
 * 3. Expects: A state directory and signed ledger blobs received from the keystone or trusted peers.
 * 4. Provides: Bond ceremony, ledger verification with downgrade protection, conductor command
 *    authorization against the signed whitelist, and locked/open node policy enforcement.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { readFile, writeFile, rename, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { hexToBytes } from '../crypto/hex.js';
import { verifyEd25519 } from '../crypto/ed25519.js';
import {
  type OwnershipLedger,
  type LedgerBackupBlob,
  type NodePolicy,
  type Ed25519PublicKeyHex,
  type Ed25519SignatureHex,
  serializeLedgerPayload,
  assertOwnershipLedger,
  isEd25519PublicKeyHex,
} from './schema.js';
import {
  BondMissingError,
  BondSealedError,
  CryptoVerificationError,
  DeliveryFilesystemError,
  LedgerCorruptError,
  StaleRevisionError,
} from '../errors.js';

export interface BondAnchorConfig {
  readonly stateDir: string;
}

interface BondStateFile {
  readonly keystonePublicKey: Ed25519PublicKeyHex;
  readonly nodePolicy: NodePolicy;
  readonly revision: number;
}

/**
 * The anchor is a security anchor, not a cache: corrupt bond state is LOUD,
 * never silently reset. Missing bond state is the only quiet path (unbonded).
 */
export class BondAnchor {
  private readonly ownershipDir: string;
  private readonly bondPath: string;
  private readonly bondTempPath: string;
  private readonly cachePath: string;
  private readonly cacheTempPath: string;

  private bondState: BondStateFile | null = null;
  private cachedLedger: OwnershipLedger | null = null;
  private cachedRaw: string | null = null;

  constructor(config: BondAnchorConfig) {
    this.ownershipDir = join(config.stateDir, 'ownership');
    this.bondPath = join(this.ownershipDir, 'bond.json');
    this.bondTempPath = join(this.ownershipDir, 'bond.json.tmp');
    this.cachePath = join(this.ownershipDir, 'ledger-cache.json');
    this.cacheTempPath = join(this.ownershipDir, 'ledger-cache.json.tmp');
  }

  public async initialize(): Promise<void> {
    await mkdir(this.ownershipDir, { recursive: true });

    let rawBond: string;
    try {
      await access(this.bondPath);
      rawBond = await readFile(this.bondPath, 'utf-8');
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return; // Unbonded: legal first-boot state.
      }
      throw new DeliveryFilesystemError(`Failed to read bond anchor at ${this.bondPath}`, err);
    }

    let parsedBond: unknown;
    try {
      parsedBond = JSON.parse(rawBond);
    } catch (err: unknown) {
      throw new LedgerCorruptError('Bond anchor file is not valid JSON', err);
    }

    if (!this.isBondState(parsedBond)) {
      throw new LedgerCorruptError('Bond anchor file is corrupt; refusing to silently reset a security anchor');
    }
    this.bondState = parsedBond;

    let rawCache: string;
    try {
      rawCache = await readFile(this.cachePath, 'utf-8');
    } catch (err: unknown) {
      throw new LedgerCorruptError('Bond anchor exists but ledger cache is missing', err);
    }

    const ledger = this.parseBlob(rawCache);
    this.verifySignature(ledger);

    if (this.bondState.revision > ledger.revision) {
      throw new LedgerCorruptError('Bond anchor revision is ahead of the ledger cache; state is corrupt');
    }
    if (this.bondState.revision === ledger.revision && this.bondState.keystonePublicKey !== ledger.keystonePublicKey) {
      throw new LedgerCorruptError('Bond anchor disagrees with the ledger cache at the same revision');
    }

    // Repair a bond left stale by a crash mid-rotation; policy is node-local and preserved.
    const repaired: BondStateFile = {
      keystonePublicKey: ledger.keystonePublicKey,
      nodePolicy: this.bondState.nodePolicy,
      revision: ledger.revision,
    };
    await this.persistBond(repaired);

    this.bondState = repaired;
    this.cachedLedger = ledger;
    this.cachedRaw = rawCache;
  }

  public isBonded(): boolean {
    return this.bondState !== null && this.cachedLedger !== null;
  }

  /** Unbonded nodes are 'open' by definition: they must accept initial bonding. */
  public getNodePolicy(): NodePolicy {
    return this.bondState?.nodePolicy ?? 'open';
  }

  public getBondedKeystoneKey(): Ed25519PublicKeyHex | null {
    return this.bondState?.keystonePublicKey ?? null;
  }

  public getCachedLedger(): OwnershipLedger | null {
    return this.cachedLedger;
  }

  /** Exact signed bytes as received. Never re-serialized — this is the peer-side backup artifact. */
  public getBackupBlob(): LedgerBackupBlob | null {
    if (this.cachedRaw === null) return null;
    return new TextEncoder().encode(this.cachedRaw);
  }

  /** Operator action. Locked nodes refuse (re-)bonding; open nodes accept it. */
  public async setNodePolicy(policy: NodePolicy): Promise<void> {
    if (this.bondState === null) {
      throw new BondMissingError('Cannot set node policy on an unbonded node');
    }
    const next: BondStateFile = { ...this.bondState, nodePolicy: policy };
    await this.persistBond(next);
    this.bondState = next;
  }

  /**
   * Bonding ceremony. Allowed only while node policy is 'open'.
   * Trust-on-first-use under direct operator action; the ledger's own signature
   * is verified, and its signer becomes the bonded keystone key.
   */
  public async bond(blobRaw: string, lockAfterBond = true): Promise<OwnershipLedger> {
    if (this.bondState !== null && this.bondState.nodePolicy === 'locked') {
      throw new BondSealedError();
    }

    const ledger = this.parseBlob(blobRaw);
    this.verifySignature(ledger);

    const nextBond: BondStateFile = {
      keystonePublicKey: ledger.keystonePublicKey,
      nodePolicy: lockAfterBond ? 'locked' : 'open',
      revision: ledger.revision,
    };

    await this.persistCache(blobRaw);
    await this.persistBond(nextBond);

    this.bondState = nextBond;
    this.cachedLedger = ledger;
    this.cachedRaw = blobRaw;
    return ledger;
  }

  /**
   * Ingest a newer signed ledger revision. This is how bonded nodes — locked OR open —
   * refresh their offline whitelist. Verification order: shape, signature, monotonicity,
   * then signer authority (sitting keystone, or pre-registered successor via succession event).
   * Rotations move the bond anchor forward; stale keys are dead forever after.
   */
  public async verifyAndCacheLedger(blobRaw: string): Promise<OwnershipLedger> {
    if (this.bondState === null || this.cachedLedger === null) {
      throw new BondMissingError('Node is unbonded; run the bonding ceremony before ledger ingestion');
    }

    const incoming = this.parseBlob(blobRaw);
    this.verifySignature(incoming);

    const cached = this.cachedLedger;
    if (incoming.revision <= cached.revision) {
      throw new StaleRevisionError(incoming.revision, cached.revision);
    }

    const bondedKey = this.bondState.keystonePublicKey;
    const signerIsBonded = incoming.keystonePublicKey === bondedKey;

    const successionPath =
      cached.successorKey !== null &&
      incoming.keystonePublicKey === cached.successorKey &&
      incoming.event !== null &&
      incoming.event.type === 'succession' &&
      incoming.event.previousKeystone === bondedKey &&
      incoming.event.newKeystone === incoming.keystonePublicKey;

    if (!signerIsBonded && !successionPath) {
      throw new LedgerCorruptError(
        `Revision ${incoming.revision} signed by an unrecognized key; foreign or resurrected keystone refused`
      );
    }

    let nextBondKey = bondedKey;

    if (incoming.event !== null && incoming.event.type === 'transfer') {
      if (!signerIsBonded) {
        throw new LedgerCorruptError('Transfer events must be signed by the sitting keystone');
      }
      if (incoming.event.previousKeystone !== bondedKey) {
        throw new LedgerCorruptError('Transfer event does not reference the bonded keystone');
      }
      nextBondKey = incoming.event.newKeystone;
    }

    if (successionPath) {
      nextBondKey = incoming.keystonePublicKey;
    }

    const nextBond: BondStateFile = {
      keystonePublicKey: nextBondKey,
      nodePolicy: this.bondState.nodePolicy,
      revision: incoming.revision,
    };

    await this.persistCache(blobRaw);
    await this.persistBond(nextBond);

    this.bondState = nextBond;
    this.cachedLedger = incoming;
    this.cachedRaw = blobRaw;
    return incoming;
  }

  /** Whitelist membership against the latest verified ledger. No cache, no authority. */
  public isConductorAuthorized(publicKey: Ed25519PublicKeyHex): boolean {
    if (this.cachedLedger === null) return false;
    return this.cachedLedger.conductors.some(c => c.publicKey === publicKey);
  }

  /**
   * Command gate for locked nodes (and open ones — bonding is the only policy-gated
   * difference): the signer must be whitelisted AND the signature must verify.
   */
  public verifyCommand(
    signerKey: Ed25519PublicKeyHex,
    signature: Ed25519SignatureHex,
    payload: Uint8Array
  ): boolean {
    if (!this.isConductorAuthorized(signerKey)) return false;
    return verifyEd25519(hexToBytes(signerKey), payload, hexToBytes(signature));
  }

  private parseBlob(blobRaw: string): OwnershipLedger {
    let parsed: unknown;
    try {
      parsed = JSON.parse(blobRaw);
    } catch (err: unknown) {
      throw new LedgerCorruptError('Ledger blob is not valid JSON', err);
    }
    return assertOwnershipLedger(parsed);
  }

  private verifySignature(ledger: OwnershipLedger): void {
    const payloadBytes = serializeLedgerPayload(ledger);
    const ok = verifyEd25519(
      hexToBytes(ledger.keystonePublicKey),
      payloadBytes,
      hexToBytes(ledger.signature)
    );
    if (!ok) {
      throw new CryptoVerificationError(`Ledger revision ${ledger.revision} failed signature verification`);
    }
  }

  private isBondState(data: unknown): data is BondStateFile {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.keystonePublicKey === 'string' &&
      isEd25519PublicKeyHex(obj.keystonePublicKey) &&
      (obj.nodePolicy === 'locked' || obj.nodePolicy === 'open') &&
      typeof obj.revision === 'number' &&
      Number.isInteger(obj.revision) &&
      obj.revision >= 1
    );
  }

  private async persistBond(state: BondStateFile): Promise<void> {
    await this.atomicWrite(this.bondPath, this.bondTempPath, JSON.stringify(state, null, 2));
  }

  private async persistCache(blobRaw: string): Promise<void> {
    // The EXACT received bytes. Re-serialization here would be a doctrine violation.
    await this.atomicWrite(this.cachePath, this.cacheTempPath, blobRaw);
  }

  private async atomicWrite(targetPath: string, tempPath: string, data: string): Promise<void> {
    try {
      await writeFile(tempPath, data, 'utf-8');
      await rename(tempPath, targetPath);
    } catch (err: unknown) {
      throw new DeliveryFilesystemError(`Failed to atomically write ${targetPath}`, err);
    }
  }
}