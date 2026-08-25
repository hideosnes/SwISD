// src/crdt/reputation.ts
// Description: Pure, side-effect-free projection function for read-time reputation decay.
// Expects: An append-only G-Set of immutable ReputationEvents and the current timestamp.
// Provides: A mathematically sound, CRDT-safe reputation score calculation without state mutation.

import type { ReputationEvent } from '../types.js';
import { SwISDError } from '../errors.js';

/**
 * Calculates the reputation score at a specific point in time using an exponentially-weighted projection.
 * This replaces unsafe write-time decay with a pure function evaluated at read time, preserving CRDT monotonicity.
 *
 * Formula: score(now) = [ Σₖ outcomeₖ · γ^(now − tₖ) ] / [ Σₖ γ^(now − tₖ) ]
 *
 * @param events - The append-only G-Set of reputation events.
 * @param nowMs - The current timestamp in milliseconds.
 * @param decayFactor - The retention factor per time unit (e.g., 0.99).
 * @param timeUnitMs - The duration of one time unit in milliseconds (default: 1 hour = 3600000ms).
 * @returns A normalized score between 0.0 and 1.0.
 */
export function calculateReputationScore(
  events: ReadonlyArray<ReputationEvent>,
  nowMs: number,
  decayFactor: number = 0.99,
  timeUnitMs: number = 3600000
): number {
  if (!Number.isFinite(nowMs)) {
    throw new SwISDError('ERR_UNKNOWN', 'Reputation projection requires a finite timestamp.');
  }

  if (!Number.isFinite(decayFactor) || decayFactor <= 0 || decayFactor > 1) {
    throw new SwISDError('ERR_UNKNOWN', 'Reputation decay factor must be in range (0, 1].');
  }

  if (!Number.isFinite(timeUnitMs) || timeUnitMs <= 0) {
    throw new SwISDError('ERR_UNKNOWN', 'Reputation decay time unit must be a positive finite number.');
  }

  if (events.length === 0) return 0.5; // Neutral default for unknown peers

  let weightedSum = 0;
  let weightTotal = 0;

  for (const event of events) {
    if (!Number.isFinite(event.timestamp)) continue;

    const deltaTimeMs = nowMs - event.timestamp;
    if (deltaTimeMs < 0) continue; // Ignore future-dated events (clock skew protection)

    const timeUnitsElapsed = deltaTimeMs / timeUnitMs;
    const weight = Math.pow(decayFactor, timeUnitsElapsed);

    // Map outcome to numerical value: success = 1, failure = 0
    const outcomeValue = event.outcome === 'success' ? 1 : 0;

    weightedSum += outcomeValue * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) return 0.5;

  return weightedSum / weightTotal;
}