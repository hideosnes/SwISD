/**
 * 1. Relative path: src/errors.ts
 * 2. Description: Centralized error texts and custom error classes for SwISD.
 * 3. Expects: String error codes and optional underlying cause typed as unknown.
 * 4. Provides: Type-safe, identifiable error classes for graceful degradation and logging.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

export type SwISDErrorCode =
  | 'ERR_CRYPTO_VERIFICATION_FAILED'
  | 'ERR_CRYPTO_INVALID'
  | 'ERR_TRUST_INVALID'
  | 'ERR_CRDT_INVALID_MERGE'
  | 'ERR_BACKPRESSURE_LIMIT_EXCEEDED'
  | 'ERR_TASK_PREEMPTED'
  | 'ERR_UPDATE_REVERT_REQUIRED'
  | 'ERR_INVALID_PROVISION_SCHEMA'
  | 'ERR_PEER_ID_RESOLUTION_FAILED'
  | 'ERR_ADMIN_UNAUTHORIZED'
  | 'ERR_ADMIN_SERVER_FAILED'
  | 'ERR_OBSERVABILITY_INVALID_CURSOR'
  | 'ERR_OBSERVABILITY_EVENT_CAPACITY_INVALID'
  | 'ERR_DELIVERY_INVALID_ARTIFACT'
  | 'ERR_DELIVERY_WATCHDOG_TIMEOUT'
  | 'ERR_DELIVERY_FILESYSTEM'
  | 'ERR_MODEL_METADATA_FETCH'
  | 'ERR_MODEL_APPROVAL_INVALID'
  | 'ERR_MODEL_DOWNLOAD_FAILED'
  | 'ERR_OWNERSHIP_STALE_REVISION'
  | 'ERR_OWNERSHIP_RATE_LIMIT'
  | 'ERR_OWNERSHIP_INVALID_COUNTERSIGN'
  | 'ERR_OWNERSHIP_BOND_MISSING'
  | 'ERR_OWNERSHIP_BOND_SEALED'
  | 'ERR_OWNERSHIP_KEYSTONE_LOST'
  | 'ERR_OWNERSHIP_RECOVERY_FAILED'
  | 'ERR_OWNERSHIP_LEDGER_CORRUPT'
  | 'ERR_OWNERSHIP_NOT_KEYSTONE'
  | 'ERR_OWNERSHIP_ALREADY_FOUNDED'
  | 'ERR_UNKNOWN';

export class SwISDError extends Error {
  public readonly code: SwISDErrorCode;
  public readonly cause?: unknown;

  constructor(code: SwISDErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'SwISDError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, SwISDError.prototype);
  }
}

export class CryptoVerificationError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_CRYPTO_VERIFICATION_FAILED', message, cause);
    this.name = 'CryptoVerificationError';
    Object.setPrototypeOf(this, CryptoVerificationError.prototype);
  }
}

export class CRDTMergeError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_CRDT_INVALID_MERGE', message, cause);
    this.name = 'CRDTMergeError';
    Object.setPrototypeOf(this, CRDTMergeError.prototype);
  }
}

export class BackpressureError extends SwISDError {
  public readonly currentLoad: number;

  constructor(currentLoad: number, message: string = 'Node load exceeds safe threshold') {
    super('ERR_BACKPRESSURE_LIMIT_EXCEEDED', message);
    this.name = 'BackpressureError';
    this.currentLoad = currentLoad;
    Object.setPrototypeOf(this, BackpressureError.prototype);
  }
}

export class TaskPreemptionError extends SwISDError {
  public readonly taskId: string;

  constructor(taskId: string, message: string = 'Task preempted due to peer drop') {
    super('ERR_TASK_PREEMPTED', message);
    this.name = 'TaskPreemptionError';
    this.taskId = taskId;
    Object.setPrototypeOf(this, TaskPreemptionError.prototype);
  }
}

export class UpdateRevertError extends SwISDError {
  public readonly targetVersion: string;

  constructor(targetVersion: string, message: string = 'Update failed, triggering watchdog revert') {
    super('ERR_UPDATE_REVERT_REQUIRED', message);
    this.name = 'UpdateRevertError';
    this.targetVersion = targetVersion;
    Object.setPrototypeOf(this, UpdateRevertError.prototype);
  }
}

export class AdminUnauthorizedError extends SwISDError {
  constructor(message: string = 'Admin endpoint requires a valid bearer token') {
    super('ERR_ADMIN_UNAUTHORIZED', message);
    this.name = 'AdminUnauthorizedError';
    Object.setPrototypeOf(this, AdminUnauthorizedError.prototype);
  }
}

export class AdminServerFailedError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_ADMIN_SERVER_FAILED', message, cause);
    this.name = 'AdminServerFailedError';
    Object.setPrototypeOf(this, AdminServerFailedError.prototype);
  }
}

export class DeliveryArtifactError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_DELIVERY_INVALID_ARTIFACT', message, cause);
    this.name = 'DeliveryArtifactError';
    Object.setPrototypeOf(this, DeliveryArtifactError.prototype);
  }
}

export class DeliveryWatchdogError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_DELIVERY_WATCHDOG_TIMEOUT', message, cause);
    this.name = 'DeliveryWatchdogError';
    Object.setPrototypeOf(this, DeliveryWatchdogError.prototype);
  }
}

export class DeliveryFilesystemError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_DELIVERY_FILESYSTEM', message, cause);
    this.name = 'DeliveryFilesystemError';
    Object.setPrototypeOf(this, DeliveryFilesystemError.prototype);
  }
}

export class StaleRevisionError extends SwISDError {
  public readonly attemptedRevision: number;
  public readonly currentRevision: number;

  constructor(attemptedRevision: number, currentRevision: number) {
    super('ERR_OWNERSHIP_STALE_REVISION', `Ledger downgrade rejected: attempted ${attemptedRevision}, current is ${currentRevision}`);
    this.name = 'StaleRevisionError';
    this.attemptedRevision = attemptedRevision;
    this.currentRevision = currentRevision;
    Object.setPrototypeOf(this, StaleRevisionError.prototype);
  }
}

export class RateLimitError extends SwISDError {
  public readonly retryAfterMs: number;

  constructor(retryAfterMs: number, message: string = 'Recovery attempt rate limit exceeded') {
    super('ERR_OWNERSHIP_RATE_LIMIT', message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class InvalidCountersignError extends SwISDError {
  constructor(message: string = 'Enrollment countersignature is invalid or from an unwhitelisted device') {
    super('ERR_OWNERSHIP_INVALID_COUNTERSIGN', message);
    this.name = 'InvalidCountersignError';
    Object.setPrototypeOf(this, InvalidCountersignError.prototype);
  }
}

export class BondMissingError extends SwISDError {
  constructor(message: string = 'Worker bond anchor is missing; cannot verify offline whitelist') {
    super('ERR_OWNERSHIP_BOND_MISSING', message);
    this.name = 'BondMissingError';
    Object.setPrototypeOf(this, BondMissingError.prototype);
  }
}

export class BondSealedError extends SwISDError {
  constructor(message: string = 'Node policy is locked; re-bonding refused until an operator unlocks the node') {
    super('ERR_OWNERSHIP_BOND_SEALED', message);
    this.name = 'BondSealedError';
    Object.setPrototypeOf(this, BondSealedError.prototype);
  }
}

export class KeystoneLostError extends SwISDError {
  constructor(message: string = 'Keystone is lost and no recovery path is available; control plane frozen') {
    super('ERR_OWNERSHIP_KEYSTONE_LOST', message);
    this.name = 'KeystoneLostError';
    Object.setPrototypeOf(this, KeystoneLostError.prototype);
  }
}

export class RecoveryFailedError extends SwISDError {
  constructor(message: string = 'Recovery phrase verification failed') {
    super('ERR_OWNERSHIP_RECOVERY_FAILED', message);
    this.name = 'RecoveryFailedError';
    Object.setPrototypeOf(this, RecoveryFailedError.prototype);
  }
}

export class LedgerCorruptError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_OWNERSHIP_LEDGER_CORRUPT', message, cause);
    this.name = 'LedgerCorruptError';
    Object.setPrototypeOf(this, LedgerCorruptError.prototype);
  }
}

export class NotKeystoneError extends SwISDError {
  constructor(message: string = 'This node is not the active keystone') {
    super('ERR_OWNERSHIP_NOT_KEYSTONE', message);
    this.name = 'NotKeystoneError';
    Object.setPrototypeOf(this, NotKeystoneError.prototype);
  }
}

export class AlreadyFoundedError extends SwISDError {
  constructor(message: string = 'Swarm is already founded on this node; re-founding requires a full wipe') {
    super('ERR_OWNERSHIP_ALREADY_FOUNDED', message);
    this.name = 'AlreadyFoundedError';
    Object.setPrototypeOf(this, AlreadyFoundedError.prototype);
  }
}