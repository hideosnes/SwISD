// 1. Relative path: src/performance/load.ts
// 2. Description: Strictly typed, side-effect-free load evaluation and token bucket rate limiting for edge backpressure.
// 3. Expects: Current system metrics (active tasks, max tasks, free memory, total memory, cpu usage) and token bucket state.
// 4. Provides: Deterministic LoadScore calculation (0.0 to 1.0) and token consumption logic to prevent swarm choking.

import type { LoadScore } from '../types.js';
import { clampLoadScore } from '../utils.js';
import { BackpressureError } from '../errors.js';

export interface LoadMetrics {
  readonly activeTaskCount: number;
  readonly maxConcurrentTasks: number;
  readonly freeMemoryBytes: number;
  readonly totalMemoryBytes: number;
  readonly cpuUsage: number; // Constrained 0.0 to 1.0
}

export function calculateLoadScore(metrics: LoadMetrics): LoadScore {
  const taskDepth = metrics.maxConcurrentTasks > 0 
    ? metrics.activeTaskCount / metrics.maxConcurrentTasks 
    : 0;
  
  const memoryPressure = metrics.totalMemoryBytes > 0
    ? (metrics.totalMemoryBytes - metrics.freeMemoryBytes) / metrics.totalMemoryBytes
    : 0;

  const cpuSaturation = Math.max(0, Math.min(1, metrics.cpuUsage));

  // Weights: Task Depth 40%, Memory Pressure 30%, CPU Saturation 30%
  const rawScore = (taskDepth * 0.4) + (memoryPressure * 0.3) + (cpuSaturation * 0.3);
  
  return clampLoadScore(rawScore);
}

export const LOAD_SHEDDING_THRESHOLD = 0.8;

export function assertLoadShedding(loadScore: number, context: string): void {
  if (loadScore > LOAD_SHEDDING_THRESHOLD) {
    throw new BackpressureError(
      loadScore, 
      `Load shedding triggered in ${context}. Load score: ${loadScore.toFixed(2)} > ${LOAD_SHEDDING_THRESHOLD}`
    );
  }
}

export interface TokenBucketState {
  readonly tokens: number;
  readonly lastRefillMs: number;
}

export interface TokenBucketConfig {
  readonly capacity: number;
  readonly refillRatePerMs: number;
}

export function refillTokenBucket(
  state: TokenBucketState,
  config: TokenBucketConfig,
  nowMs: number
): TokenBucketState {
  const elapsed = Math.max(0, nowMs - state.lastRefillMs);
  const newTokens = Math.min(
    config.capacity,
    state.tokens + elapsed * config.refillRatePerMs
  );
  return {
    tokens: newTokens,
    lastRefillMs: nowMs,
  };
}

export function consumeToken(
  state: TokenBucketState,
  cost: number = 1
): { state: TokenBucketState; allowed: boolean } {
  if (state.tokens >= cost) {
    return {
      state: { ...state, tokens: state.tokens - cost },
      allowed: true,
    };
  }
  return { state, allowed: false };
}