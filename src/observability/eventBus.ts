// src/observability/eventBus.ts
// Description: In-memory typed event bus and bounded event ring for observability.
// Expects: Typed observability event inputs.
// Provides: Deterministic event sequence generation and bounded read access.

import { SwISDError } from '../errors.js';
import type { ObservabilityEvent, ObservabilityEventInput } from './schema.js';

export class ObservabilityEventBus {
  private readonly capacity: number;
  private readonly events: ObservabilityEvent[] = [];
  private sequence = 0;

  constructor(capacity: number = 200) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new SwISDError(
        'ERR_OBSERVABILITY_EVENT_CAPACITY_INVALID',
        'Observability event bus capacity must be a positive integer.'
      );
    }

    this.capacity = capacity;
  }

  public publish(input: ObservabilityEventInput): ObservabilityEvent {
    this.sequence += 1;

    const event: ObservabilityEvent = {
      sequence: this.sequence,
      timestamp: Date.now(),
      topic: input.topic,
      level: input.level,
      message: input.message,
      details: input.details ?? {},
    };

    this.events.push(event);

    if (this.events.length > this.capacity) {
      this.events.shift();
    }

    return event;
  }

  public recent(limit: number = 50): ReadonlyArray<ObservabilityEvent> {
    const safeLimit = this.clampLimit(limit, 50);
    return this.events.slice(-safeLimit);
  }

  public since(afterSequence: number, limit: number = 100): ReadonlyArray<ObservabilityEvent> {
    const safeAfter = Number.isFinite(afterSequence)
      ? Math.max(0, Math.trunc(afterSequence))
      : 0;

    const safeLimit = this.clampLimit(limit, 100);

    const startIndex = this.events.findIndex(event => event.sequence > safeAfter);
    if (startIndex === -1) return [];

    return this.events.slice(startIndex, startIndex + safeLimit);
  }

  private clampLimit(limit: number, fallback: number): number {
    if (!Number.isInteger(limit) || limit <= 0) return fallback;
    return Math.min(limit, 500);
  }
}