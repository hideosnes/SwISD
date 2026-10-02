/**
 * 1. Relative path: src/ownership/succession.ts
 * 2. Description: The Succession Ceremony: promotes a successor node to the active Keystone role.
 * 3. Expects: A cached ledger from the BondAnchor, the new Keystone keypair, and optional recovery phrase.
 * 4. Provides: Authority verification, succession event generation, and persistent audit logging.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { bytesToHex } from '../crypto/hex.js';
import { verifyArgon2id } from '../crypto/argon2.js';
import { signEd25519 } from '../crypto/ed25519.js';
import {
  type OwnershipLedger,
  type OwnershipLedgerPayload,
  type Ed25519PublicKeyHex,
  type Ed25519SignatureHex,
  type LedgerEvent,
  serializeLedgerPayload,
} from './schema.js';
import { RecoveryFailedError, SwISDError } from '../errors.js';
import { RecoveryRateLimiter } from './recoveryRateLimiter.js';

export interface SuccessionCeremonyConfig {
  readonly ownershipDir: string;
}

export interface SuccessionInput {
  readonly cachedLedger: OwnershipLedger;
  readonly newKeypair: { publicKey: Uint8Array; privateKey: Uint8Array };
  readonly recoveryPhrase?: Uint8Array;
}

interface AttemptLogEntry {
  readonly timestamp: number;
  readonly previousRevision: number;
  readonly newRevision: number;
  readonly previousKeystone: Ed25519PublicKeyHex;
  readonly newKeystone: Ed25519PublicKeyHex;
  readonly authority: 'successor-key' | 'recovery-phrase';
  readonly success: boolean;
  readonly error?: string;
}

export class SuccessionCeremony {
  private readonly ownershipDir: string;
  private readonly logPath: string;

  constructor(
    config: SuccessionCeremonyConfig,
    private readonly rateLimiter: RecoveryRateLimiter
  ) {
    this.ownershipDir = config.ownershipDir;
    this.logPath = join(this.ownershipDir, 'succession-attempts.jsonl');
  }

  public async execute(input: SuccessionInput): Promise<OwnershipLedger> {
    await mkdir(this.ownershipDir, { recursive: true });

    const { cachedLedger, newKeypair, recoveryPhrase } = input;
    const newPubHex = bytesToHex(newKeypair.publicKey) as Ed25519PublicKeyHex;
    
    let authority: 'successor-key' | 'recovery-phrase' = 'successor-key';

    try {
      if (cachedLedger.successorKey === newPubHex) {
        authority = 'successor-key';
      } else if (recoveryPhrase !== undefined) {
        this.rateLimiter.check();
        if (!verifyArgon2id(recoveryPhrase, cachedLedger.recoveryPhraseHash)) {
          await this.rateLimiter.recordAttempt();
          throw new RecoveryFailedError('Recovery phrase does not match ledger hash.');
        }
        await this.rateLimiter.reset();
        authority = 'recovery-phrase';
      } else {
        throw new SwISDError(
          'ERR_OWNERSHIP_RECOVERY_FAILED', 
          'No authority provided for succession: node is not the pre-registered successor and no recovery phrase was supplied.'
        );
      }

      const event: LedgerEvent = {
        type: 'succession',
        previousKeystone: cachedLedger.keystonePublicKey,
        newKeystone: newPubHex,
      };

      const payload: OwnershipLedgerPayload = {
        swarmName: cachedLedger.swarmName,
        revision: cachedLedger.revision + 1,
        conductors: cachedLedger.conductors,
        policy: cachedLedger.policy,
        keystoneWorkload: cachedLedger.keystoneWorkload,
        recoveryPhraseHash: cachedLedger.recoveryPhraseHash,
        successorKey: null, // Successor consumed the slot
        event,
      };

      const payloadBytes = serializeLedgerPayload(payload);
      const signature = signEd25519(newKeypair.privateKey, payloadBytes);

      const newLedger: OwnershipLedger = {
        ...payload,
        keystonePublicKey: newPubHex,
        signature: bytesToHex(signature) as Ed25519SignatureHex,
      };

      await this.logAttempt({
        timestamp: Date.now(),
        previousRevision: cachedLedger.revision,
        newRevision: newLedger.revision,
        previousKeystone: cachedLedger.keystonePublicKey,
        newKeystone: newPubHex,
        authority,
        success: true,
      });

      return newLedger;
    } catch (err: unknown) {
      await this.logAttempt({
        timestamp: Date.now(),
        previousRevision: cachedLedger.revision,
        newRevision: cachedLedger.revision + 1,
        previousKeystone: cachedLedger.keystonePublicKey,
        newKeystone: newPubHex,
        authority,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private async logAttempt(entry: AttemptLogEntry): Promise<void> {
    const line = JSON.stringify(entry) + '\n';
    try {
      await appendFile(this.logPath, line, 'utf-8');
    } catch {
      // Best effort logging. If the disk is full, we fail the ceremony, not the log.
      console.error('[Succession] Failed to append attempt log:', entry);
    }
  }
}