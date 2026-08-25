/**
 * 1. Relative path: src/utils.ts
 * 2. Description: Single large utility file containing pure, type-safe helper functions.
 * 3. Expects: Strictly typed inputs (no `any`, no implicit `any`).
 * 4. Provides: Deterministic, side-effect-free utility functions for the SwISD runtime.
 */

import { LoadScore } from './types.js';

/**
 * Computes FNV-1a 32-bit hash for deterministic stagger delays.
 * @param str - The string to hash (e.g., peerId + version).
 * @returns A 32-bit unsigned integer hash.
 */
export function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // Ensure unsigned 32-bit integer
}

/**
 * Safely parses a JSON string into a strictly typed object.
 * @param jsonStr - The JSON string to parse.
 * @param validator - A type guard function to validate the parsed result.
 * @returns The validated parsed object.
 * @throws Error if parsing fails or validation fails.
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
 * @param score - The number to validate.
 * @returns True if the score is between 0.0 and 1.0 inclusive.
 */
export function isValidLoadScore(score: number): score is LoadScore {
  return typeof score === 'number' && score >= 0.0 && score <= 1.0;
}

/**
 * Deep freezes an object to ensure immutability (useful for CRDT state snapshots).
 * @param obj - The object to freeze.
 * @returns The frozen object.
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  const propNames = Reflect.ownKeys(obj) as (string | symbol)[];
  for (const name of propNames) {
    const value = (obj as Record<string | symbol, unknown>)[name];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  }
  return Object.freeze(obj) as Readonly<T>;
}