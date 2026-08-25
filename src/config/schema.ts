// src/config/schema.ts
// Description: Strict type definitions and runtime validation guards for the USB provisioning schema.
// Expects: Raw, untrusted JSON data from the USB stick or environment.
// Provides: Exhaustively typed `ProvisionConfig` and strict type guards to ensure zero unsafe leakage.

export type ProvisionRole = 'auto' | 'input' | 'worker';

export interface HuggingFaceModelSource {
  readonly type: 'hf';
  readonly url: string;
}

export interface WifiConfig {
  readonly ssid: string;
  readonly psk: string;
  readonly country: string; // ISO 3166-1 alpha-2
}

export interface ProvisionConfig {
  readonly wifi: WifiConfig;
  readonly role: ProvisionRole;
  readonly modelSource: HuggingFaceModelSource;
  readonly version: number;
}

// --- Strict Runtime Type Guards ---

export function isHuggingFaceModelSource(data: unknown): data is HuggingFaceModelSource {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (obj.type !== 'hf' || typeof obj.url !== 'string' || obj.url.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(obj.url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isWifiConfig(data: unknown): data is WifiConfig {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  return (
    typeof obj.ssid === 'string' &&
    typeof obj.psk === 'string' &&
    typeof obj.country === 'string' &&
    obj.country.length === 2 // Strict ISO alpha-2 length check
  );
}

export function isProvisionConfig(data: unknown): data is ProvisionConfig {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  const isValidRole = (r: unknown): r is ProvisionRole =>
    r === 'auto' || r === 'input' || r === 'worker';

  return (
    isWifiConfig(obj.wifi) &&
    isValidRole(obj.role) &&
    isHuggingFaceModelSource(obj.modelSource) &&
    typeof obj.version === 'number' &&
    Number.isInteger(obj.version) &&
    obj.version >= 1
  );
}