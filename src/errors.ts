// src/errors.ts
// Description: Centralized error texts and custom error classes for SwISD.
// Expects: String error codes and optional underlying cause typed as unknown.
// Provides: Type-safe, identifiable error classes for graceful degradation and logging.

export type SwISDErrorCode =
  | 'ERR_CRYPTO_VERIFICATION_FAILED'
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