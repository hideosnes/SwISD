// 1. Relative path: src/delivery/schema.ts
// 2. Description: Strict type definitions and runtime validation guards for the delivery mechanism.
// 3. Expects: Raw, untrusted JSON data from filesystem state files.
// 4. Provides: Exhaustively typed Delivery schemas and strict type guards to ensure zero unsafe leakage.

import type { AppHeartbeat, SupervisorStatus, UpdateStatus } from '../types.js';

export function isAppHeartbeat(data: unknown): data is AppHeartbeat {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.timestamp === 'number' &&
    typeof obj.version === 'string' &&
    typeof obj.peerId === 'string' &&
    typeof obj.pid === 'number'
  );
}

export function isSupervisorStatus(data: unknown): data is SupervisorStatus {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  
  const isValidStatus = (s: unknown): s is UpdateStatus =>
    s === 'idle' || s === 'probing' || s === 'downloading' || s === 'applying' || s === 'reverting' || s === 'updated';

  return (
    typeof obj.supervisorVersion === 'string' &&
    typeof obj.isRunning === 'boolean' &&
    (typeof obj.currentAppVersion === 'string' || obj.currentAppVersion === null) &&
    (typeof obj.previousAppVersion === 'string' || obj.previousAppVersion === null) &&
    (typeof obj.targetUpdateVersion === 'string' || obj.targetUpdateVersion === null) &&
    isValidStatus(obj.updateStatus) &&
    (typeof obj.lastHeartbeatCheck === 'number' || obj.lastHeartbeatCheck === null) &&
    (typeof obj.lastError === 'string' || obj.lastError === null) &&
    (typeof obj.rollbackReason === 'string' || obj.rollbackReason === null)
  );
}