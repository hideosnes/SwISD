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
    id: 'genesis-spark',
    status: 'done',
    type: 'milestone',
    time: 'Spring 2023',
    title: 'The Hackathon Spark',
    image: swisdLogo,
    description:
      'During a hackathon hosted by The Ventury, at the end of a long night, the initial concept for the project is sketched out. The vision involves artificial intelligence running on the devices people already own, cooperating as a swarm with no central server. The sketch carries informal working names built around the word swarm. None of those names survive the years ahead, but the hypothesis does. From this weekend onward the idea is treated as a research programme and the slow work of making it defensible begins.',
    link: { href: 'https://theventury.com', label: 'The Ventury' }
  },
  {
    id: 'proof-years',
    status: 'done',
    type: 'step',
    time: 'Winter 2023',
    title: 'The Mathematical Years',
    image: webgpuLogo,
    description:
      'The years 2023 and 2024 are spent turning the hackathon hypothesis into mathematics. The focus is on modeling how unreliable, constrained devices can agree on a shared state, and proving convergence properties for the data structures that will later carry the shared state across unreliable links. These proofs become the quiet foundation of everything that follows, because every later engineering decision can be checked against them. The prototype of this era still answers to its informal names and runs on borrowed hardware.'
  },
  {
    id: 'lab-prototype',
    status: 'done',
    type: 'milestone',
    time: 'Fall 2024',
    title: 'The First Lab Swarm',
    image: nodejsLogo,
    description:
      'The research leaves the paper when the first laboratory prototype connects multiple devices into a working swarm. For the first time, inference tasks are split into fragments and reassembled across machines that share no central coordinator. The convergence proofs hold up outside a simulator. The prototype is rough and held together by discipline alone, but it converts the project from a theoretical argument into an engineering endeavour. The practical implementation phase that begins here carries through late 2024 and early 2025.'
  },
  {
    id: 'federated-poc',
    status: 'done',
    type: 'step',
    time: 'Winter 2024',
    title: 'The Federated Field Trial',
    image: huggingfaceLogo,
    description:
      'The proof of concept escapes the laboratory and enters the field, where a test network of nineteen devices attempts something ambitious. A Llama 3.2 model of roughly twenty-four billion parameters is served and refined. About thirteen diverse mobile devices contribute actively to the workload, while the rest provide hard lessons about churn and battery limits that no simulator would have surfaced. The trial stretches into 2025 and validates federated learning on consumer hardware. This capability is deliberately banked for a later chapter instead of building the foundation on it.'
  },
  {
    id: 'name-sworn',
    status: 'done',
    type: 'milestone',
    time: 'Winter 2024',
    title: 'A Name Is Sworn',
    image: swisdLogo,
    description:
      'In January 2025 the decision is made to pursue the swarm professionally, and the decision arrives with a name. The informal nicknames are retired in a single stroke and replaced by SwISD, which stands for Swarm Inference on Small Devices. The name states the research programme in five words. From this moment every experiment is conducted with one eye on reproducibility and the other on the grant application. The field trial measurements become the evidence base for that submission.'
  },
  {
    id: 'alpha-verdict',
    status: 'done',
    type: 'step',
    time: 'Spring 2025',
    title: 'The Alpha Verdict',
    image: webgpuLogo,
    description:
      'The alpha phase closes with the hypotheses validated on physical hardware in real hands. The field trial measurements are compiled into the evidence package that convinces the funding agency. During this evaluation a consequential architectural decision is made. Federated aggregation is set aside as a future feature while capability-aware inference becomes the core of the system. This narrowing turns an ambitious research wish into a question that can actually be answered within a grant year. The submission travels with nineteen devices worth of hard-won telemetry attached.'
  },
  {
    id: 'kickoff-pivot',
    status: 'done',
    type: 'milestone',
    time: 'Summer 2025',
    title: 'Homahuki Founded, FFG Grant Paid',
    image: swisdLogo,
    description:
      'August 2025 brings two signatures in one busy month. Homahuki GmbH is founded and the FFG grant is paid, marking the official start of the funded project. Experts partnered through the funding programme begin taking the concept apart piece by piece. The year that follows becomes a sequence of small, deliberate pivots toward a deployable product. The written grant plan still speaks of federated learning and mobile applications while the laboratory quietly moves toward something more disciplined. That gap between the plan on paper and the research as lived is the true story of the grant year.',
    link: { href: 'https://ffg.at', label: 'FFG' }
  },
  {
    id: 'p0-foundation',
    status: 'done',
    type: 'step',
    time: 'Fall 2025',
    title: 'A Reproducible Foundation',
    image: nodejsLogo,
    description:
      'The first act of the funded research is unglamorous and essential. The codebase is rebuilt so that every result can be reproduced and every interface trusted. Strict type discipline removes whole classes of failure before they can hide. A modular architecture keeps each subsystem inspectable. Native cryptographic primitives for identity and message integrity are implemented without third-party shortcuts. The elected coordinator inherited from the alpha era is removed during this phase, committing the network to a fully blind topology. Every claim the later phases make rests on this substrate being boring and correct.'
  },
  {
    id: 'p1-substrate',
    status: 'done',
    type: 'milestone',
    time: 'Fall 2025',
    title: 'Coordinator-Free State and Routing',
    image: swisdLogo,
    description:
      'This phase answers the question the hackathon never could. The challenge is figuring out how a network with no central authority keeps a consistent view of its own state while peers join and leave at will. Membership, capabilities, reputation, and model metadata are modeled as conflict-free replicated data types. It is verified that replicas converge regardless of message order or duplication. Reputation is kept as an append-only log of signed observations projected into a score at read time. Tasks route toward advertised software capabilities rather than hardware addresses. A probabilistic time-to-live mechanism closes the last loophole by preventing message loops in the blind topology.'
  },
  {
    id: 'domain-c-cockpit',
    status: 'done',
    type: 'step',
    time: 'Winter 2025',
    title: 'The Operator Arrives',
    image: swisdLogo,
    description:
      'A swarm nobody can observe is a swarm nobody can trust. The Conductor Cockpit is built as a dedicated interface through which human operators watch and steer the network. A server-side bridge exposes the headless core through strictly typed snapshots. A deterministic orbital visualization places trusted peers and pending ghosts in a layout that never lies about uncertainty. The design system behind the interface is governed by a single source of truth so that every visual statement stays consistent across four theme regimes. Operators finally see the swarm that had been described in equations.'
  },
  {
    id: 'p2-performance',
    status: 'done',
    type: 'milestone',
    time: 'Winter 2025',
    title: 'Resource-Aware Operation',
    image: webgpuLogo,
    description:
      'The second grant milestone confronts the physics of small devices. A Raspberry Pi that accepts every task dies under its own willingness. Load-aware admission control is introduced, in which each peer maintains a normalized load score and sheds work before it drowns. Peer health measurement and a synchronization protocol transfer only the Merkle branches that differ. Communication cost is attacked here with real engineering. The swarm learns to decline work, which turns out to be a reliability feature.'
  },
  {
    id: 'p4-models',
    status: 'done',
    type: 'step',
    time: 'Spring 2026',
    title: 'Heavy Payloads and the Consent Gate',
    image: huggingfaceLogo,
    description:
      'Models of multiple gigabytes cannot be gossiped like metadata. A distribution path for heavy payloads is designed in which files are split into verified chunks and seeded across peers in parallel micro-torrents. The swarm learns to digest complex, multi-stage artificial intelligence pipelines. A real-world validation chains a live camera feed into Moondream2 for vision, passes the semantic understanding to an Apertus 8B language model, and voices the final result through Kokoro TTS. No external download begins without explicit operator consent, ensuring that the swarm remains large and its manners impeccable.',
    link: { href: '/research', label: 'Read the Whitepapers' }
  },
  {
    id: 'tech-demo',
    status: 'done',
    type: 'milestone',
    time: 'Spring 2026',
    title: 'Trust Boundaries Proven',
    image: nodejsLogo,
    description:
      'The security milestone leaves simulation when a physical swarm is assembled for the spring technology demonstration. Devices discover each other through local broadcast. Every newly discovered peer docks in a pending state until an operator explicitly trusts its cryptographic identity. The demonstration proves that these pipelines run reliably on a diverse fleet of eight modern mobile devices and edge hardware. The trials also reveal a hard physical ceiling, showing that swarms larger than roughly thirty devices offer diminishing returns under current constraints. This establishes SwISD as a privacy-preserving alternative for edge-native use cases rather than a direct competitor to centralized cloud intelligence.'
  },
  {
    id: 'pi-delivery',
    status: 'done',
    type: 'step',
    time: 'Summer 2026',
    title: 'The Delivery Machine',
    image: swisdLogo,
    description:
      'Research that cannot be deployed is folklore. The final grant months build the machinery that carries the software onto fleets of edge devices and keeps it alive there. An atomic installer promotes new releases by symlink swap while a watchdog reverts to the previous release whenever the heartbeat stops. The ultimate proof arrives in August, when the fleet runs uninterrupted for three weeks. Through intentional performance spikes and simulated network churn, the sixty-second heartbeat watchdog proves its worth, rolling back failed updates and healing the swarm organically. The grant project closes with hardware in the field rather than a report on a desk.'
  },
  {
    id: 'hardware-optimization',
    status: 'done',
    type: 'milestone',
    time: 'Summer 2026',
    title: 'Hardware Optimization',
    image: nodejsLogo,
    description:
      'The hardware milestone is earned on the devices that actually exist, which are Raspberry Pis with unforgiving memory and thermal budgets. On-machine performance is benchmarked across the fleet and the runtime is refined for low-latency, low-power operation. Every limitation the hardware imposes is documented together with the engineering answer to it. These measurements feed directly back into the admission control and synchronization work of the winter phase, closing the loop between theory and silicon. By the end of the summer the swarm knows what it can promise on a five-watt budget.'
  },
  {
    id: 'replay-runway',
    status: 'done',
    type: 'step',
    time: 'Fall 2026',
    title: 'Rehearsing Failure',
    image: webgpuLogo,
    description:
      'The development effort builds a rehearsal room for failure. Waiting for a physical fleet to misbehave is a poor testing strategy. A fixture-driven replay engine injects deterministic scenario state at the core observability boundary. This tool is used exclusively to stress-test the Conductor Cockpit, allowing the interface to rehearse handling bottlenecks, node churn, and unauthorized connection attempts without a single physical device being powered on. The same infrastructure rehearses the genesis moment when the very first peer connects and the interface wakes up.'
  },
  {
    id: 'open-source-release',
    status: 'done',
    type: 'milestone',
    time: 'Fall 2026',
    title: 'The Open-Source Release',
    image: swisdLogo,
    description:
      'The open-source release is the milestone toward which the entire timeline converges. The research only becomes infrastructure once strangers can build on it. The framework ships at version 0.9.3, a deliberate choice reflecting the architectural pivots of the grant year rather than an arbitrary numerical label. Thanks to the foundational support of the FFG, the roadmap for the coming years is already drawn. The mathematical foundations described throughout this timeline are now public. Every locked decision becomes reviewable, and the swarm stops being a private research project and starts being a public tool.'
  }
] as const;

export const currentEntry = roadmapEntries.find(e => e.status === 'current') ?? null;