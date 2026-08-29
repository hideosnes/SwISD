// 1. Relative path: src/errors.ts
// 2. Description: Centralized error texts and custom error classes for SwISD.
// 3. Expects: String error codes and optional underlying cause typed as unknown.
// 4. Provides: Type-safe, identifiable error classes for graceful degradation and logging.

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