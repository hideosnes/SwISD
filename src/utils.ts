// src/utils.ts
// Description: Single large utility file containing pure, type-safe helper functions.
// Expects: Strictly typed inputs.
// Provides: Deterministic, side-effect-free utility functions for the SwISD runtime.

import { randomBytes } from 'node:crypto';
import { LoadScore, PeerRole } from './types.js';

/**
 * Computes FNV-1a 32-bit hash for deterministic stagger delays.
 */
export function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Safely parses a JSON string into a strictly typed object.
 */
export function safeJsonParse<T>(jsonStr: string, validator: (data: unknown) => data is T): T {
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (validator(parsed)) {
      return parsed;
    }
    throw new Error('JSON validation failed');
  } catch (error) {
    throw new Error(`Failed to parse or validate JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validates if a given number is a legitimate LoadScore.
 */
export function isValidLoadScore(score: number): score is LoadScore {
  return typeof score === 'number' && Number.isFinite(score) && score >= 0.0 && score <= 1.0;
}

/**
 * Clamps an arbitrary number into the valid load score range.
 */
export function clampLoadScore(score: number): LoadScore {
  if (!Number.isFinite(score)) return 0;
  return Math.min(1, Math.max(0, score));
}

/**
 * Parses a positive integer from an environment string.
 */
export function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value.length === 0) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;

  return parsed;
}

/**
 * Parses a TCP port from an environment string.
 */
export function parsePort(value: string | undefined, fallback: number): number {
  const parsed = parsePositiveInteger(value, fallback);
  if (parsed > 65535) return fallback;
  return parsed;
}

/**
 * Parses a boolean-ish environment value.
 */
export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

/**
 * Parses a peer role from an environment value.
 */
export function parsePeerRole(value: string | undefined): PeerRole {
  if (value === 'input' || value === 'worker' || value === 'diplomat' || value === 'auto') {
    return value;
  }
  return 'auto';
}

/**
 * Creates a secure bearer token for the local admin endpoint.
 */
export function createAdminToken(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Deep freezes an object to ensure immutability.
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  const propNames = Reflect.ownKeys(obj) as ReadonlyArray<string | symbol>;

  for (const name of propNames) {
    const value = (obj as Record<string | symbol, unknown>)[name];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }

  return Object.freeze(obj);
}