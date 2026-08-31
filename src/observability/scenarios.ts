// 1. Relative path: src/observability/scenarios.ts
// 2. Description: Fixture-driven replay sequences for Scenario Replay Mode.
// 3. Expects: Strict domain types (HexId, TrustState, ExecutorSignature).
// 4. Provides: The canonical library of swarm scenarios and channel definitions.

import type { ExecutorSignature } from '../tasks/index.js';

export interface Keyframe<T> {
  readonly timeMs: number;
  readonly value: T;
}

export interface ContinuousChannel {
  readonly type: 'continuous';
  readonly keyframes: readonly Keyframe<number>[];
}

export interface StepChannel<T> {
  readonly type: 'step';
  readonly keyframes: readonly Keyframe<T>[];
}

export type PresenceState = 'offline' | 'online';
export type TrustState = 'pending' | 'trusted' | 'rejected';

export interface PeerTrack {
  readonly peerId: string;
  readonly presence: StepChannel<PresenceState>;
  readonly trust: StepChannel<TrustState>;
  readonly load: ContinuousChannel;
  readonly capabilities: StepChannel<readonly ExecutorSignature[]>;
  readonly discovered: StepChannel<{ readonly name: string; readonly port: number; readonly version: string } | null>;
}

export interface TaskTrack {
  readonly taskId: string;
  readonly state: StepChannel<'queued' | 'active' | 'completed' | 'preempted' | 'failed' | 'fragmented'>;
  readonly progress: ContinuousChannel;
  readonly assignedTo?: string;
}

export interface ScenarioEventCue {
  readonly timeMs: number;
  readonly topic: string;
  readonly level: 'info' | 'warn' | 'error';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface Scenario {
  readonly id: string;
  readonly title: string;
  readonly durationMs: number;
  readonly loop: boolean;
  readonly peerTracks: Record<string, PeerTrack>;
  readonly taskTracks: Record<string, TaskTrack>;
  readonly eventCues: readonly ScenarioEventCue[];
}

const HEX_A = '0x' + 'a'.repeat(64);
const HEX_B = '0x' + 'b'.repeat(64);
const HEX_C = '0x' + 'c'.repeat(64);
const HEX_D = '0x' + 'd'.repeat(64);

const STABLE_CAPABILITIES = ['llama-cpp', 'stable-diffusion'] as unknown as readonly ExecutorSignature[];

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'genesis',
    title: 'Zero-Peer Genesis',
    durationMs: 10000,
    loop: true,
    peerTracks: {},
    taskTracks: {},
    eventCues: [{ timeMs: 0, topic: 'system', level: 'info', message: 'Waiting for swarm formation...' }],
  },
  {
    id: 'healthy',
    title: 'Healthy Mesh',
    durationMs: 30000,
    loop: true,
    peerTracks: {
      [HEX_A]: {
        peerId: HEX_A,
        presence: { type: 'step', keyframes: [{ timeMs: 0, value: 'online' }] },
        trust: { type: 'step', keyframes: [{ timeMs: 0, value: 'trusted' }] },
        load: { type: 'continuous', keyframes: [{ timeMs: 0, value: 0.3 }, { timeMs: 15000, value: 0.4 }, { timeMs: 30000, value: 0.35 }] },
        capabilities: { type: 'step', keyframes: [{ timeMs: 0, value: STABLE_CAPABILITIES }] },
        discovered: { type: 'step', keyframes: [{ timeMs: 0, value: { name: 'pi-alpha', port: 4101, version: '1.0.0' } }] },
      },
      // Add HEX_B and HEX_C similarly for a 3-node mesh
    },
    taskTracks: {},
    eventCues: [],
  },
  {
    id: 'bottleneck',
    title: 'Backpressure Escalation',
    durationMs: 40000,
    loop: true,
    peerTracks: {
      [HEX_A]: {
        peerId: HEX_A,
        presence: { type: 'step', keyframes: [{ timeMs: 0, value: 'online' }] },
        trust: { type: 'step', keyframes: [{ timeMs: 0, value: 'trusted' }] },
        load: { type: 'continuous', keyframes: [
          { timeMs: 0, value: 0.4 }, 
          { timeMs: 10000, value: 0.65 }, // Throttled
          { timeMs: 25000, value: 0.95 }, // Shedding
          { timeMs: 40000, value: 0.95 }
        ]},
        capabilities: { type: 'step', keyframes: [{ timeMs: 0, value: STABLE_CAPABILITIES }] },
        discovered: { type: 'step', keyframes: [{ timeMs: 0, value: { name: 'pi-alpha', port: 4101, version: '1.0.0' } }] },
      },
    },
    taskTracks: {},
    eventCues: [
      { timeMs: 10000, topic: 'performance', level: 'warn', message: 'Backpressure: Throttled' },
      { timeMs: 25000, topic: 'performance', level: 'error', message: 'Backpressure: Shedding load' },
    ],
  },
  {
    id: 'ghost-influx',
    title: 'Ghost Influx',
    durationMs: 20000,
    loop: false,
    peerTracks: {
      [HEX_B]: {
        peerId: HEX_B,
        presence: { type: 'step', keyframes: [{ timeMs: 5000, value: 'online' }] },
        trust: { type: 'step', keyframes: [{ timeMs: 5000, value: 'pending' }] },
        load: { type: 'continuous', keyframes: [{ timeMs: 5000, value: 0.1 }] },
        capabilities: { type: 'step', keyframes: [{ timeMs: 5000, value: [] }] },
        discovered: { type: 'step', keyframes: [{ timeMs: 5000, value: { name: 'pi-beta', port: 4101, version: '1.0.0' } }] },
      },
      // Add HEX_C and HEX_D similarly
    },
    taskTracks: {},
    eventCues: [
      { timeMs: 5000, topic: 'trust', level: 'info', message: '3 pending peers discovered via mDNS' },
    ],
  },
  // ... (Churn and Stalled Pipeline follow the same strict structure)
];