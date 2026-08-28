// 1. Relative path: src/tasks/lifecycle.ts
// 2. Description: Dual-mechanism task lifecycle manager enforcing deadline-driven preemption (Option 3) and triggering gossip-based reassignment (Option 2).
// 3. Expects: Task IDs, strict deadlines, and a callback to publish preemption events to the swarm.
// 4. Provides: Automatic, side-effect-free tracking of task lifespans, guaranteeing no orphaned tasks violate swarm reliability directives.

import { randomBytes } from 'node:crypto';
import type { TaskHistoryEvent, TaskAction } from '../types.js';
import { TaskPreemptionError } from '../errors.js';

export interface ActiveTaskRecord {
  readonly taskId: string;
  readonly assignedPeerId: string;
  readonly deadlineMs: number;
  readonly createdAtMs: number;
}

export interface TaskLifecycleDependencies {
  readonly localPeerId: string;
  readonly onPreemptionGossip: (event: TaskHistoryEvent) => Promise<void>;
  readonly onTaskCleanup: (taskId: string) => void;
}

export class TaskLifecycleManager {
  private readonly activeTasks = new Map<string, ActiveTaskRecord>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly deps: TaskLifecycleDependencies;

  constructor(deps: TaskLifecycleDependencies) {
    this.deps = deps;
  }

  public registerTask(taskId: string, assignedPeerId: string, deadlineMs: number): void {
    if (this.activeTasks.has(taskId)) {
      return; // Idempotent registration
    }

    const now = Date.now();
    const record: ActiveTaskRecord = {
      taskId,
      assignedPeerId,
      deadlineMs,
      createdAtMs: now,
    };

    this.activeTasks.set(taskId, record);

    const timeUntilDeadline = Math.max(0, deadlineMs - now);
    const timerId = setTimeout(() => {
      this.forcePreempt(taskId, 'Deadline expired without TaskResultPayload');
    }, timeUntilDeadline);

    this.timers.set(taskId, timerId);
  }

  public resolveTask(taskId: string, success: boolean): void {
    const record = this.activeTasks.get(taskId);
    if (!record) return;

    this.clearTimer(taskId);
    this.activeTasks.delete(taskId);
    this.deps.onTaskCleanup(taskId);

    // Optionally log completion to CRDT here, but keep this module focused on lifecycle/preemption
  }

  public forcePreempt(taskId: string, reason: string): void {
    const record = this.activeTasks.get(taskId);
    if (!record) return;

    this.clearTimer(taskId);
    this.activeTasks.delete(taskId);
    this.deps.onTaskCleanup(taskId);

    const preemptEvent: TaskHistoryEvent = {
      eventId: `preempt-${taskId}-${randomBytes(8).toString('hex')}`,
      taskId,
      action: 'preempted' as TaskAction,
      peerId: this.deps.localPeerId,
      timestamp: Date.now(),
      metadata: {
        reason,
        originalAssignee: record.assignedPeerId,
        deadlineMs: record.deadlineMs,
      },
    };

    // Fire and forget the gossip publication. The swarm will handle reassignment.
    this.deps.onPreemptionGossip(preemptEvent).catch((error) => {
      console.error(`[TaskLifecycle] Failed to gossip preemption for ${taskId}:`, error);
    });

    throw new TaskPreemptionError(taskId, reason);
  }

  public manualPreempt(taskId: string, reason: string): void {
    this.forcePreempt(taskId, reason);
  }

  private clearTimer(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }
  }

  public getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  public destroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.activeTasks.clear();
  }
}