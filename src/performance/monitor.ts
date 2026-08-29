// 1. Relative path: src/performance/monitor.ts
// 2. Description: Stateful load monitor that polls OS metrics and manages the gossip token bucket.
// 3. Expects: Token bucket config, max task capacity, and a task count provider.
// 4. Provides: Real-time LoadScore evaluation and gossip rate limiting for edge backpressure.

import { cpus, freemem, totalmem, loadavg } from 'node:os';
import { 
  calculateLoadScore, 
  refillTokenBucket, 
  consumeToken, 
  type LoadMetrics, 
  type TokenBucketState, 
  type TokenBucketConfig 
} from './load.js';

export class LoadMonitor {
  private currentScore: number = 0;
  private tokenBucket: TokenBucketState;
  private readonly config: TokenBucketConfig;
  private readonly getActiveTaskCount: () => number;
  private readonly maxConcurrentTasks: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    config: TokenBucketConfig,
    maxConcurrentTasks: number,
    getActiveTaskCount: () => number
  ) {
    this.config = config;
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.getActiveTaskCount = getActiveTaskCount;
    this.tokenBucket = { tokens: config.capacity, lastRefillMs: Date.now() };
  }

  public start(intervalMs: number = 1000): void {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), intervalMs);
    this.intervalId.unref(); // Don't block graceful shutdown
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const metrics: LoadMetrics = {
      activeTaskCount: this.getActiveTaskCount(),
      maxConcurrentTasks: this.maxConcurrentTasks,
      freeMemoryBytes: freemem(),
      totalMemoryBytes: totalmem(),
      cpuUsage: this.getCpuUsage(),
    };
    this.currentScore = calculateLoadScore(metrics);
    this.tokenBucket = refillTokenBucket(this.tokenBucket, this.config, Date.now());
  }

  private getCpuUsage(): number {
    const cpuCount = cpus().length || 1;
    const avg = loadavg()[0]; // 1-minute load average
    return Math.min(1, avg / cpuCount);
  }

  public getLoadScore(): number {
    return this.currentScore;
  }

  public tryConsumeGossipToken(): boolean {
    const result = consumeToken(this.tokenBucket, 1);
    this.tokenBucket = result.state;
    return result.allowed;
  }
}