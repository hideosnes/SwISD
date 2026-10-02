/**
 * 1. Relative path: src/ownership/keystone.ts
 * 2. Description: The Keystone role: single-writer of the Ownership Ledger.
 * 3. Expects: A configured state directory and Ed25519 keypairs for signing.
 * 4. Provides: Swarm founding, conductor enrollment, workload policy, keystone transfer,
 *    successor pre-registration, and atomic ledger persistence.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { readFile, writeFile, rename, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { bytesToHex, hexToBytes } from '../crypto/hex.js';
import { hashArgon2id, verifyArgon2id } from '../crypto/argon2.js';
import { signEd25519, verifyEd25519 } from '../crypto/ed25519.js';
import {
  type OwnershipLedger,
  type OwnershipLedgerPayload,
  type ConductorDevice,
  type NodePolicy,
  type KeystoneWorkloadPolicy,
  type Ed25519PublicKeyHex,
  type Ed25519SignatureHex,
  type LedgerBackupBlob,
  type LedgerEvent,
  serializeLedgerPayload,
  assertOwnershipLedger,
  isEd25519PublicKeyHex,
} from './schema.js';
import {
  SwISDError,
  DeliveryFilesystemError,
  LedgerCorruptError,
  InvalidCountersignError,
  RecoveryFailedError,
  NotKeystoneError,
  AlreadyFoundedError,
} from '../errors.js';
import { RecoveryRateLimiter } from './recoveryRateLimiter.js';

export interface KeystoneConfig {
  readonly stateDir: string;
}

export interface FoundingOptions {
  readonly keystoneWorkload?: KeystoneWorkloadPolicy;
}

export interface FoundingResult {
  readonly ledger: OwnershipLedger;
  readonly recoveryPhrase: Uint8Array;
}

export interface TransferResult {
  readonly ledger: OwnershipLedger;
  readonly blob: LedgerBackupBlob;
}

interface SigningKeyPair {
  readonly publicKey: Uint8Array;
  readonly privateKey: Uint8Array;
}

export class Keystone {
  private readonly ownershipDir: string;
  private readonly ledgerPath: string;
  private readonly ledgerTempPath: string;

  private currentLedger: OwnershipLedger | null = null;
  private lastPersistedRaw: string | null = null;
  private transferred = false;

  private readonly rateLimiter: RecoveryRateLimiter;

  constructor(config: KeystoneConfig) {
    this.ownershipDir = join(config.stateDir, 'ownership');
    this.ledgerPath = join(this.ownershipDir, 'ledger.json');
    this.ledgerTempPath = join(this.ownershipDir, 'ledger.json.tmp');
    
    this.rateLimiter = new RecoveryRateLimiter({ ownershipDir: this.ownershipDir });
  }

  public async initialize(): Promise<void> {
    await mkdir(this.ownershipDir, { recursive: true });
    await this.rateLimiter.initialize();

    try {
      await access(this.ledgerPath);
      const raw = await readFile(this.ledgerPath, 'utf-8');
      const parsed = JSON.parse(raw) as unknown;
      const ledger = assertOwnershipLedger(parsed);

      const payloadBytes = serializeLedgerPayload(ledger);
      if (!verifyEd25519(hexToBytes(ledger.keystonePublicKey), payloadBytes, hexToBytes(ledger.signature))) {
        throw new LedgerCorruptError('Ledger signature verification failed on load');
      }

      this.currentLedger = ledger;
      this.lastPersistedRaw = raw;
    } catch (err: unknown) {
      if (err instanceof LedgerCorruptError) throw err;
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        // No ledger yet: this node is unfounded. Legal state.
      } else {
        throw new LedgerCorruptError('Failed to load ownership ledger', err);
      }
    }
  }

  public getLedger(): OwnershipLedger | null {
    return this.currentLedger;
  }

  public isActiveKeystone(): boolean {
    return this.currentLedger !== null && !this.transferred;
  }

  public async foundSwarm(
    swarmName: string,
    keystoneKeyPair: SigningKeyPair,
    options: FoundingOptions = {}
  ): Promise<FoundingResult> {
    if (this.currentLedger !== null) {
      throw new AlreadyFoundedError();
    }

    const recoveryPhrase = randomBytes(16); // 128-bit entropy
    const recoveryHash = hashArgon2id(recoveryPhrase);
    const keystonePubHex = bytesToHex(keystoneKeyPair.publicKey) as Ed25519PublicKeyHex;

    const payload: OwnershipLedgerPayload = {
      swarmName,
      revision: 1,
      conductors: [{
        publicKey: keystonePubHex,
        enrolledAt: Date.now(),
        enrolledBy: 'genesis',
      }],
      policy: 'open',
      keystoneWorkload: options.keystoneWorkload ?? 'forbidden',
      recoveryPhraseHash: recoveryHash,
      successorKey: null,
      event: null,
    };

    const ledger = await this.signAndPersist(payload, keystoneKeyPair);
    return { ledger, recoveryPhrase };
  }

  public async enrollConductor(
    newConductorPubKey: Ed25519PublicKeyHex,
    countersignature: Ed25519SignatureHex,
    countersignerPubKey: Ed25519PublicKeyHex,
    keystoneKeyPair: SigningKeyPair
  ): Promise<OwnershipLedger> {
    const current = this.assertActiveKeystone();

    if (!isEd25519PublicKeyHex(newConductorPubKey)) {
      throw new SwISDError('ERR_CRYPTO_INVALID', 'New conductor key must be a valid Ed25519 public key');
    }

    const countersigner = current.conductors.find(c => c.publicKey === countersignerPubKey);
    if (!countersigner) {
      throw new InvalidCountersignError('Countersigner is not a whitelisted conductor.');
    }

    const dataToSign = hexToBytes(newConductorPubKey);
    const sigBytes = hexToBytes(countersignature);
    const verifierKey = hexToBytes(countersignerPubKey);

    if (!verifyEd25519(verifierKey, dataToSign, sigBytes)) {
      throw new InvalidCountersignError('Countersignature is invalid.');
    }

    if (current.conductors.some(c => c.publicKey === newConductorPubKey)) {
      return current; // Idempotent
    }

    const newConductor: ConductorDevice = {
      publicKey: newConductorPubKey,
      enrolledAt: Date.now(),
      enrolledBy: countersignerPubKey,
    };

    const payload = this.buildNextPayload(current, {
      conductors: [...current.conductors, newConductor],
    });

    return this.signAndPersist(payload, keystoneKeyPair);
  }

  public async enrollConductorWithPhrase(
    newConductorPubKey: Ed25519PublicKeyHex,
    phrase: Uint8Array,
    keystoneKeyPair: SigningKeyPair
  ): Promise<OwnershipLedger> {
    const current = this.assertActiveKeystone();

    if (!isEd25519PublicKeyHex(newConductorPubKey)) {
      throw new SwISDError('ERR_CRYPTO_INVALID', 'New conductor key must be a valid Ed25519 public key');
    }

    this.rateLimiter.check();

    if (!verifyArgon2id(phrase, current.recoveryPhraseHash)) {
      await this.rateLimiter.recordAttempt();
      throw new RecoveryFailedError('Recovery phrase does not match ledger hash.');
    }

    // Successful recovery use resets the attempt window.
    await this.rateLimiter.reset();

    if (current.conductors.some(c => c.publicKey === newConductorPubKey)) {
      return current; // Idempotent
    }

    const newConductor: ConductorDevice = {
      publicKey: newConductorPubKey,
      enrolledAt: Date.now(),
      enrolledBy: 'recovery',
    };

    const payload = this.buildNextPayload(current, {
      conductors: [...current.conductors, newConductor],
    });

    return this.signAndPersist(payload, keystoneKeyPair);
  }

  public async preRegisterSuccessor(
    successorKey: Ed25519PublicKeyHex,
    keystoneKeyPair: SigningKeyPair
  ): Promise<OwnershipLedger> {
    const current = this.assertActiveKeystone();
    if (!isEd25519PublicKeyHex(successorKey)) {
      throw new SwISDError('ERR_CRYPTO_INVALID', 'Successor key must be a valid Ed25519 public key');
    }

    const payload = this.buildNextPayload(current, { successorKey });
    return this.signAndPersist(payload, keystoneKeyPair);
  }

  public async updatePolicy(
    policy: NodePolicy,
    keystoneKeyPair: SigningKeyPair
  ): Promise<OwnershipLedger> {
    const current = this.assertActiveKeystone();
    const payload = this.buildNextPayload(current, { policy });
    return this.signAndPersist(payload, keystoneKeyPair);
  }

  public async setKeystoneWorkload(
    keystoneWorkload: KeystoneWorkloadPolicy,
    keystoneKeyPair: SigningKeyPair
  ): Promise<OwnershipLedger> {
    const current = this.assertActiveKeystone();
    const payload = this.buildNextPayload(current, { keystoneWorkload });
    return this.signAndPersist(payload, keystoneKeyPair);
  }

  public async transferKeystone(
    newKeystoneKey: Ed25519PublicKeyHex,
    keystoneKeyPair: SigningKeyPair
  ): Promise<TransferResult> {
    const current = this.assertActiveKeystone();

    if (!isEd25519PublicKeyHex(newKeystoneKey)) {
      throw new SwISDError('ERR_CRYPTO_INVALID', 'New keystone key must be a valid Ed25519 public key');
    }
    const sittingKey = bytesToHex(keystoneKeyPair.publicKey);
    if (newKeystoneKey === sittingKey) {
      throw new SwISDError('ERR_CRYPTO_INVALID', 'Cannot transfer the keystone role to the sitting keystone');
    }

    const event: LedgerEvent = {
      type: 'transfer',
      previousKeystone: current.keystonePublicKey,
      newKeystone: newKeystoneKey,
    };

    const payload = this.buildNextPayload(current, { event });
    const ledger = await this.signAndPersist(payload, keystoneKeyPair);

    this.transferred = true;
    const blob = this.emitBackupBlob();
    return { ledger, blob };
  }

  public emitBackupBlob(): LedgerBackupBlob {
    if (this.lastPersistedRaw === null) {
      throw new NotKeystoneError('No ledger exists to back up on this node');
    }
    return new TextEncoder().encode(this.lastPersistedRaw);
  }

  private assertActiveKeystone(): OwnershipLedger {
    if (this.transferred) {
      throw new NotKeystoneError('Keystone role was transferred to another node; this node no longer signs revisions');
    }
    if (this.currentLedger === null) {
      throw new NotKeystoneError('Swarm is not founded on this node');
    }
    return this.currentLedger;
  }

  private buildNextPayload(
    current: OwnershipLedger,
    patch: Partial<Omit<OwnershipLedgerPayload, 'swarmName' | 'revision'>>
  ): OwnershipLedgerPayload {
    return {
      swarmName: current.swarmName,
      revision: current.revision + 1,
      conductors: current.conductors,
      policy: current.policy,
      keystoneWorkload: current.keystoneWorkload,
      recoveryPhraseHash: current.recoveryPhraseHash,
      successorKey: current.successorKey,
      event: null,
      ...patch,
    };
  }

  private async signAndPersist(
    payload: OwnershipLedgerPayload,
    keyPair: SigningKeyPair
  ): Promise<OwnershipLedger> {
    const payloadBytes = serializeLedgerPayload(payload);
    const signature = signEd25519(keyPair.privateKey, payloadBytes);

    const ledger: OwnershipLedger = {
      ...payload,
      keystonePublicKey: bytesToHex(keyPair.publicKey) as Ed25519PublicKeyHex,
      signature: bytesToHex(signature) as Ed25519SignatureHex,
    };

    const raw = JSON.stringify(ledger, null, 2);
    await this.atomicWrite(this.ledgerPath, this.ledgerTempPath, raw);

    this.currentLedger = ledger;
    this.lastPersistedRaw = raw;
    return ledger;
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