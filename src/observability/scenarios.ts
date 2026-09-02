// 1. Relative path: src/observability/scenarios.ts
// 2. Description: Fixture-driven replay sequences for Scenario Replay Mode.
// 3. Expects: Strict domain types (HexId, TrustState, ExecutorSignature) and observability event vocabulary.
// 4. Provides: The canonical library of six deterministic swarm scenarios and channel definitions.

import type { ExecutorSignature } from '../tasks/index.js';
import type {
  ObservabilityEventDetails,
  ObservabilityEventLevel,
  ObservabilityEventTopic,
  DeviceType,
  ModalityCode,
} from './schema.js';

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

export interface DiscoveredInfo {
  readonly name: string;
  readonly port: number;
  readonly version: string;
}

export interface PeerTrack {
  readonly peerId: string;
  readonly presence: StepChannel<PresenceState>;
  readonly trust: StepChannel<TrustState>;
  readonly load: ContinuousChannel;
  readonly capabilities: StepChannel<readonly ExecutorSignature[]>;
  readonly discovered: StepChannel<DiscoveredInfo | null>;
  readonly deviceType: DeviceType;
  readonly modalities: readonly ModalityCode[];
}

export type TaskState = 'queued' | 'active' | 'completed' | 'preempted' | 'failed' | 'fragmented';

export interface TaskTrack {
  readonly taskId: string;
  readonly state: StepChannel<TaskState>;
  readonly progress: ContinuousChannel;
  readonly assignedTo?: string;
}

export interface ScenarioEventCue {
  readonly timeMs: number;
  readonly topic: ObservabilityEventTopic;
  readonly level: ObservabilityEventLevel;
  readonly message: string;
  readonly details?: ObservabilityEventDetails;
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

const HEX_A = `0x${'a'.repeat(64)}`;
const HEX_B = `0x${'b'.repeat(64)}`;
const HEX_C = `0x${'c'.repeat(64)}`;
const HEX_D = `0x${'d'.repeat(64)}`;

const STABLE_CAPABILITIES = ['llama-cpp', 'stable-diffusion'] as unknown as readonly ExecutorSignature[];
const LIGHT_CAPABILITIES = ['llama-cpp'] as unknown as readonly ExecutorSignature[];

function presenceOnlineAt(timeMs: number): StepChannel<PresenceState> {
  return { type: 'step', keyframes: [{ timeMs, value: 'online' }] };
}

function presenceOnlineUntil(onAt: number, offAt: number): StepChannel<PresenceState> {
  return { type: 'step', keyframes: [{ timeMs: onAt, value: 'online' }, { timeMs: offAt, value: 'offline' }] };
}

function trustAt(timeMs: number, state: TrustState): StepChannel<TrustState> {
  return { type: 'step', keyframes: [{ timeMs, value: state }] };
}

function loadFlat(value: number): ContinuousChannel {
  return { type: 'continuous', keyframes: [{ timeMs: 0, value }] };
}

function discoveredAt(timeMs: number, name: string): StepChannel<DiscoveredInfo | null> {
  return { type: 'step', keyframes: [{ timeMs, value: { name, port: 4101, version: '1.0.0' } }] };
}

function peer(
  peerId: string,
  name: string,
  opts: {
    presence: StepChannel<PresenceState>;
    trust: StepChannel<TrustState>;
    load: ContinuousChannel;
    capabilities?: StepChannel<readonly ExecutorSignature[]>;
    discoveredAtMs?: number;
    deviceType?: DeviceType;
    modalities?: readonly ModalityCode[];
  }
): PeerTrack {
  return {
    peerId,
    presence: opts.presence,
    trust: opts.trust,
    load: opts.load,
    capabilities: opts.capabilities ?? { type: 'step', keyframes: [{ timeMs: 0, value: STABLE_CAPABILITIES }] },
    discovered: discoveredAt(opts.discoveredAtMs ?? 0, name),
    deviceType: opts.deviceType ?? 'unknown',
    modalities: opts.modalities ?? [],
  };
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'genesis',
    title: 'Zero-Peer Genesis',
    durationMs: 10000,
    loop: true,
    peerTracks: {},
    taskTracks: {},
    eventCues: [
      { timeMs: 0, topic: 'system', level: 'info', message: 'Waiting for swarm formation...' },
    ],
  },

  {
    id: 'healthy',
    title: 'Healthy Mesh',
    durationMs: 30000,
    loop: true,
    peerTracks: {
      [HEX_A]: peer(HEX_A, 'pi-alpha', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: { type: 'continuous', keyframes: [{ timeMs: 0, value: 0.25 }, { timeMs: 15000, value: 0.4 }, { timeMs: 30000, value: 0.28 }] },
        deviceType: 'raspi',
        modalities: ['T2T', 'T2I'],
      }),
      [HEX_B]: peer(HEX_B, 'pi-beta', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: { type: 'continuous', keyframes: [{ timeMs: 0, value: 0.3 }, { timeMs: 20000, value: 0.35 }, { timeMs: 30000, value: 0.3 }] },
        deviceType: 'linux',
        modalities: ['T2T'],
      }),
      [HEX_C]: peer(HEX_C, 'pi-gamma', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: loadFlat(0.2),
        capabilities: { type: 'step', keyframes: [{ timeMs: 0, value: LIGHT_CAPABILITIES }] },
        deviceType: 'windows',
        modalities: ['T2T', 'T2A'],
      }),
    },
    taskTracks: {},
    eventCues: [
      { timeMs: 0, topic: 'network', level: 'info', message: '3 trusted peers online' },
    ],
  },

  {
    id: 'bottleneck',
    title: 'Backpressure Escalation',
    durationMs: 40000,
    loop: true,
    peerTracks: {
      [HEX_A]: peer(HEX_A, 'pi-alpha', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: {
          type: 'continuous',
          keyframes: [
            { timeMs: 0, value: 0.4 },
            { timeMs: 10000, value: 0.65 },
            { timeMs: 25000, value: 0.95 },
            { timeMs: 40000, value: 0.95 },
          ],
        },
        deviceType: 'raspi',
        modalities: ['T2T', 'T2I'],
      }),
      [HEX_B]: peer(HEX_B, 'pi-beta', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: loadFlat(0.3),
        deviceType: 'linux',
        modalities: ['T2T'],
      }),
      [HEX_C]: peer(HEX_C, 'pi-gamma', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: loadFlat(0.25),
        deviceType: 'apple',
        modalities: ['T2T'],
      }),
    },
    taskTracks: {},
    eventCues: [
      { timeMs: 10000, topic: 'load', level: 'warn', message: 'pi-alpha backpressure: throttled' },
      { timeMs: 25000, topic: 'load', level: 'error', message: 'pi-alpha backpressure: shedding load' },
    ],
  },

  {
    id: 'churn',
    title: 'Peer Churn & Reassignment',
    durationMs: 30000,
    loop: true,
    peerTracks: {
      [HEX_A]: peer(HEX_A, 'pi-alpha', {
        presence: presenceOnlineUntil(0, 15000),
        trust: trustAt(0, 'trusted'),
        load: { type: 'continuous', keyframes: [{ timeMs: 0, value: 0.7 }, { timeMs: 15000, value: 0 }] },
        deviceType: 'raspi',
        modalities: ['T2T', 'T2I'],
      }),
      [HEX_B]: peer(HEX_B, 'pi-beta', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: loadFlat(0.3),
        deviceType: 'linux',
        modalities: ['T2T'],
      }),
    },
    taskTracks: {
      'task-churn-001': {
        taskId: 'task-churn-001',
        state: {
          type: 'step',
          keyframes: [
            { timeMs: 0, value: 'active' },
            { timeMs: 15000, value: 'preempted' },
            { timeMs: 16500, value: 'active' },
            { timeMs: 26000, value: 'completed' },
          ],
        },
        progress: {
          type: 'continuous',
          keyframes: [
            { timeMs: 0, value: 0.1 },
            { timeMs: 15000, value: 0.55 },
            { timeMs: 16500, value: 0.55 },
            { timeMs: 26000, value: 1.0 },
          ],
        },
        assignedTo: HEX_A,
      },
    },
    eventCues: [
      { timeMs: 15000, topic: 'peer', level: 'warn', message: 'pi-alpha dropped mid-task' },
      { timeMs: 15000, topic: 'task', level: 'warn', message: 'task-churn-001 preempted' },
      { timeMs: 16500, topic: 'task', level: 'info', message: 'task-churn-001 reassigned to pi-beta' },
    ],
  },

  {
    id: 'ghost-influx',
    title: 'Ghost Influx',
    durationMs: 20000,
    loop: false,
    peerTracks: {
      [HEX_A]: peer(HEX_A, 'pi-alpha', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: loadFlat(0.2),
        deviceType: 'raspi',
        modalities: ['T2T'],
      }),
      [HEX_B]: peer(HEX_B, 'pi-beta', {
        presence: presenceOnlineAt(5000),
        trust: trustAt(5000, 'pending'),
        load: loadFlat(0.1),
        capabilities: { type: 'step', keyframes: [{ timeMs: 5000, value: [] }] },
        discoveredAtMs: 5000,
        deviceType: 'unknown',
        modalities: [],
      }),
      [HEX_C]: peer(HEX_C, 'pi-gamma', {
        presence: presenceOnlineAt(5000),
        trust: trustAt(5000, 'pending'),
        load: loadFlat(0.15),
        capabilities: { type: 'step', keyframes: [{ timeMs: 5000, value: LIGHT_CAPABILITIES }] },
        discoveredAtMs: 5000,
        deviceType: 'unknown',
        modalities: [],
      }),
      [HEX_D]: peer(HEX_D, 'pi-delta', {
        presence: presenceOnlineAt(5000),
        trust: trustAt(5000, 'pending'),
        load: loadFlat(0.1),
        capabilities: { type: 'step', keyframes: [{ timeMs: 5000, value: [] }] },
        discoveredAtMs: 5000,
        deviceType: 'unknown',
        modalities: [],
      }),
    },
    taskTracks: {},
    eventCues: [
      { timeMs: 5000, topic: 'peer', level: 'info', message: '3 pending peers discovered via mDNS' },
    ],
  },

  {
    id: 'stalled-pipeline',
    title: 'Stalled Fragmented Pipeline',
    durationMs: 40000,
    loop: true,
    peerTracks: {
      [HEX_A]: peer(HEX_A, 'pi-alpha', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: loadFlat(0.5),
        deviceType: 'raspi',
        modalities: ['T2T', 'T2I'],
      }),
      [HEX_B]: peer(HEX_B, 'pi-beta', {
        presence: presenceOnlineAt(0),
        trust: trustAt(0, 'trusted'),
        load: loadFlat(0.45),
        deviceType: 'linux',
        modalities: ['T2T'],
      }),
    },
    taskTracks: {
      'task-stalled-001': {
        taskId: 'task-stalled-001',
        state: { type: 'step', keyframes: [{ timeMs: 0, value: 'fragmented' }] },
        progress: {
          type: 'continuous',
          keyframes: [
            { timeMs: 0, value: 0.1 },
            { timeMs: 8000, value: 0.55 },
            { timeMs: 14000, value: 0.8 },
            { timeMs: 40000, value: 0.8 },
          ],
        },
      },
    },
    eventCues: [
      { timeMs: 14000, topic: 'task', level: 'warn', message: 'Fragment reassembly stalled at 80%' },
    ],
  },
];