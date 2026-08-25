/**
 * 1. Relative path: src/errors.ts
 * 2. Description: Centralized error texts and custom error classes for SwISD.
 * 3. Expects: String error codes and optional underlying cause (typed as `unknown`, never `any`).
 * 4. Provides: Type-safe, identifiable error classes for graceful degradation and logging.
 */

export type SwISDErrorCode = 
  | 'ERR_CRYPTO_VERIFICATION_FAILED'
  | 'ERR_CRDT_INVALID_MERGE'
  | 'ERR_BACKPRESSURE_LIMIT_EXCEEDED'
  | 'ERR_TASK_PREEMPTED'
  | 'ERR_UPDATE_REVERT_REQUIRED'
  | 'ERR_INVALID_PROVISION_SCHEMA'
  | 'ERR_PEER_ID_RESOLUTION_FAILED';

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
  }
}

export class CRDTMergeError extends SwISDError {
  constructor(message: string, cause?: unknown) {
    super('ERR_CRDT_INVALID_MERGE', message, cause);
    this.name = 'CRDTMergeError';
  }
}

export class BackpressureError extends SwISDError {
  public readonly currentLoad: number;
  
  constructor(currentLoad: number, message: string = 'Node load exceeds safe threshold') {
    super('ERR_BACKPRESSURE_LIMIT_EXCEEDED', message);
    this.name = 'BackpressureError';
    this.currentLoad = currentLoad;
  }
}

export class TaskPreemptionError extends SwISDError {
  public readonly taskId: string;
  
  constructor(taskId: string, message: string = 'Task preempted due to peer drop') {
    super('ERR_TASK_PREEMPTED', message);
    this.name = 'TaskPreemptionError';
    this.taskId = taskId;
  }
}

export class UpdateRevertError extends SwISDError {
  public readonly targetVersion: string;
  
  constructor(targetVersion: string, message: string = 'Update failed, triggering watchdog revert') {
    super('ERR_UPDATE_REVERT_REQUIRED', message);
    this.name = 'UpdateRevertError';
    this.targetVersion = targetVersion;
  }
}