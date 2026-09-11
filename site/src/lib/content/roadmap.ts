/**
 * 1. Relative path: site/src/lib/content/roadmap.ts
 * 2. Description: Roadmap data source for the SwISD marketing site.
 * 3. Expects: Strictly typed roadmap entries with mandatory image, description, time, and title.
 * 4. Provides: The single source of truth for the project timeline.
 */
import { swisdLogo, huggingfaceLogo, nodejsLogo, webgpuLogo } from '$lib/assets';

export type RoadmapStatus = 'done' | 'current' | 'open';
export type RoadmapType = 'milestone' | 'step';

export type RoadmapEntry = {
  readonly id: string;
  readonly status: RoadmapStatus;
  readonly type: RoadmapType;
  readonly time: string;
  readonly title: string;
  readonly image: string;
  readonly description: string;
  readonly link?: { readonly href: string; readonly label: string };
};

export const roadmapEntries: readonly RoadmapEntry[] = [
  {
    id: 'phase-0',
    status: 'done',
    type: 'milestone',
    time: 'Q1 2024',
    title: 'Foundation & Cryptographic Primitives',
    image: swisdLogo,
    description: 'Barrel-enforced file restructure, strict type safety purge, and native Node.js Ed25519/HMAC-SHA256 primitives. The bedrock is poured.'
  },
  {
    id: 'phase-1',
    status: 'done',
    type: 'milestone',
    time: 'Q2 2024',
    title: 'Core Decentralized Substrate',
    image: nodejsLogo,
    description: 'Custom Merkle-DAG structured CRDTs, blind propagation via Bloom filters, and torrent-style task fragmentation. The swarm learns to gossip.'
  },
  {
    id: 'phase-2',
    status: 'done',
    type: 'step',
    time: 'Q3 2024',
    title: 'Performance & Data Purity',
    image: webgpuLogo,
    description: 'Edge backpressure, token bucket rate limiting, and polymorphic ingestion. Zero Buffer bloat, pure Uint8Array pipelines.'
  },
  {
    id: 'phase-3',
    status: 'done',
    type: 'milestone',
    time: 'Q4 2024',
    title: 'Domain C: The Conductor Cockpit',
    image: swisdLogo,
    description: 'Svelte 5 BFF bridge, strict DTO boundaries, and the orbital topology datavis engine. The operator gets a windshield.'
  },
  {
    id: 'phase-4',
    status: 'current',
    type: 'step',
    time: 'Q1 2025',
    title: 'Model Distribution & Heavy Payloads',
    image: huggingfaceLogo,
    description: 'Tier 1 HuggingFace ingress, approval gates, and Tier 2 P2P chunk seeding. The swarm learned to digest and share multi-gigabyte models.',
    link: { href: '/research', label: 'Read the Whitepapers' }
  },
  {
    id: 'phase-5',
    status: 'open',
    type: 'step',
    time: 'Q2 2025',
    title: 'Scenario Replay & Chaos Testing',
    image: swisdLogo,
    description: 'Fixture-driven snapshot sequences to test cockpit visuals against bottlenecks, churn, and ghost influx without a physical fleet.'
  },
  {
    id: 'phase-6',
    status: 'open',
    type: 'milestone',
    time: 'Q3 2025',
    title: 'Diplomat Election & Inter-Swarm Routing',
    image: nodejsLogo,
    description: 'Elected ambassadors bridge isolated swarms, carrying knowledge and routing tasks across boundaries without exposing raw data.'
  },
  {
    id: 'phase-7',
    status: 'open',
    type: 'step',
    time: 'Q4 2025',
    title: 'Out-of-Box Setup Portal',
    image: swisdLogo,
    description: 'Fallback AP mode and captive portal wizard for monitor-less, USB-less initial WiFi provisioning via smartphone.'
  },
  {
    id: 'phase-8',
    status: 'open',
    type: 'step',
    time: 'Autumn 2026',
    title: 'Cooperative Update Scheduling',
    image: webgpuLogo,
    description: 'Negotiated spacing and hash-staggered rollouts to prevent reboot clustering across the fleet.'
  },
  {
    id: 'phase-9',
    status: 'open',
    type: 'step',
    time: 'Winter 2026',
    title: 'Elastic Capacity Allocation',
    image: swisdLogo,
    description: 'Watermark gossip consensus for dynamic storage sharding and replication balancing.'
  },
  {
    id: 'phase-10',
    status: 'open',
    type: 'milestone',
    time: 'Spring 2027',
    title: 'Stateful Performance Orchestration',
    image: nodejsLogo,
    description: 'Conductor-side buffering, beat-keeping, and glitch-recovery for continuous live audio streams.'
  },
  {
    id: 'phase-11',
    status: 'open',
    type: 'step',
    time: 'Summer 2027',
    title: 'Multi-Channel Release Seeding',
    image: huggingfaceLogo,
    description: 'Beta and stable canary deployments with P2P bundle seeding for risky velocity fleets.'
  }
] as const;

export const currentEntry = roadmapEntries.find(e => e.status === 'current') ?? null;