/**
 * 1. Relative path: src/provision/schema.ts
 * 2. Description: Strict wire DTOs and state unions for the Out-of-Box Setup Portal.
 * 3. Expects: Untrusted HTTP payloads from captive webviews.
 * 4. Provides: Exhaustively typed portal requests, results, and runtime validation guards.
 */

export type PortalSecurity = 'wpa2-psk' | 'wpa3-sae' | 'open';

export interface PortalJoinRequest {
  readonly ssid: string;
  readonly security: PortalSecurity;
  readonly passphrase: string | null;
  readonly hidden: boolean;
  /** When true the saved NetworkManager profile is deleted after a verified join: credentials survive this session, not a reboot. */
  readonly temporary: boolean;
  readonly country: string;
}

export type PortalFailureReason = 
  | 'invalid-request'
  | 'join-timeout'
  | 'auth-failed'
  | 'ssid-not-found'
  | 'unknown';

export type PortalJoinResult =
  | { status: 'joining' }
  | { status: 'joined'; ssid: string }
  | { status: 'failed'; reason: PortalFailureReason; message?: string };

export type PortalState = 'idle' | 'joining' | 'joined' | 'failed';

export function isPortalJoinRequest(data: unknown): data is PortalJoinRequest {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.ssid === 'string' && obj.ssid.length > 0 &&
    (obj.security === 'wpa2-psk' || obj.security === 'wpa3-sae' || obj.security === 'open') &&
    (obj.passphrase === null || typeof obj.passphrase === 'string') &&
    typeof obj.hidden === 'boolean' &&
    typeof obj.temporary === 'boolean' &&
    typeof obj.country === 'string' && obj.country.length === 2
  );
}