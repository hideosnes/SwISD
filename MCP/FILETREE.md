<!--
1. Relative path: FILETREE.md
2. Description: The canonical architectural map and module index for the SwISD decentralized swarm.
3. Expects: To be pasted into new context windows to instantly restore the architect's spatial awareness.
4. Provides: A strictly enforced, barrel-governed directory tree with module responsibilities.
-->

# SwISD Architectural Filetree

## Core Application (`src/`)

src/
├── admin/                 # Local HTTP JSON API for observability (Headless)
│   ├── index.ts           # Barrel export
│   └── server.ts          # Token-guarded HTTP API server
├── config/                # USB provisioning & environment config
│   ├── index.ts           # Barrel export
│   ├── loader.ts          # Config loading & validation
│   └── schema.ts          # Strict ProvisionConfig types & Genesis constants
├── crdt/                  # Merkle-DAG & State-based CRDTs
│   ├── index.ts           # Barrel export
│   ├── merkle.ts          # Domain-separated hashing & inclusion proofs
│   ├── reputation.ts      # Read-time decay projection math
│   ├── reputationLog.ts   # Append-only G-Set CRDT for reputation events
│   └── structures.ts      # OR-Set, LWW, G-Set, OR-Map interfaces
├── crypto/                # Two-tier cryptographic primitives
│   ├── index.ts           # Barrel export
│   ├── ed25519.ts         # Control-plane asymmetric keys
│   └── hmac.ts            # Data-plane symmetric MACs
├── delivery/              # Atomic OTA updates & persistent identity
│   ├── index.ts           # Barrel export
│   ├── heartbeat.ts       # App heartbeat writer
│   ├── identity.ts        # Persistent Ed25519 peer identity (Hex serialized)
│   ├── installer.ts       # Atomic symlink swaps
│   ├── localSupervisor.ts # CLI entrypoint for supervisor
│   ├── mockReleaseGenerator.ts # Dev tool for mock releases
│   ├── schema.ts          # Delivery state types
│   ├── verifier.ts        # SHA-256 + Ed25519 artifact verification
│   └── watchdog.ts        # Heartbeat monitor & rollback trigger
├── executor/              # Capability-aware execution routing
│   ├── index.ts           # Barrel export
│   └── registry.ts        # In-memory supported executor registry
├── models/                # AI Model distribution & caching
│   ├── index.ts           # Barrel export
│   ├── approval.ts        # Hard-block approval gate (one-time nonces)
│   ├── downloader.ts      # Streaming HF download + SSE progress
│   ├── huggingface.ts     # HuggingFace metadata pre-fetcher
│   ├── ingest.ts          # Polymorphic stream chunking (Pure Uint8Array)
│   ├── manager.ts         # Generic model lifecycle (lazy init, dispose)
│   ├── registry.ts        # Persistent, CRDT-backed model library
│   └── schema.ts          # ModelManifest types
├── network/               # libp2p, mDNS, and swarm routing
│   ├── index.ts           # Barrel export
│   ├── bloom.ts           # Probabilistic TTL & loop prevention
│   ├── discovery.ts       # mDNS Bonjour broadcasting
│   ├── health.ts          # @libp2p/ping based peer health monitor
│   ├── libp2p.ts          # libp2p node factory & service wiring
│   └── router/            # Gossip & Egress routing
│       ├── index.ts       # Barrel export
│       ├── egressTunnel.ts# Direct result push to Conductor
│       └── gossipRouter.ts# Capability-aware blind propagation
├── observability/         # Telemetry & snapshot generation
│   ├── index.ts           # Barrel export
│   ├── devSource.ts       # Dev environment state aggregator
│   ├── eventBus.ts        # Bounded in-memory event ring
│   ├── schema.ts          # Observability DTOs
│   └── snapshot.ts        # Immutable snapshot builder
├── peer/                  # Peer trust & membership
│   ├── index.ts           # Barrel export
│   └── trust.ts           # Cryptographic TrustRegistry (Pending/Trusted/Rejected)
├── performance/           # Edge backpressure & load shedding
│   ├── index.ts           # Barrel export
│   ├── load.ts            # LoadScore math & Token Bucket rate limiting
│   └── monitor.ts         # Stateful OS metric polling and gossip throttling
├── provision/             # Hardware provisioning
│   └── apply.ts           # Idempotent USB config application (nmcli)
├── storage/               # Elastic capacity allocation
│   ├── index.ts           # Barrel export
│   └── capacity.ts        # Swarm storage watermarks & replication math
├── tasks/                 # Task lifecycle & fragmentation
│   ├── index.ts           # Barrel export
│   ├── capabilities.ts    # CapabilityManifest & ExecutorSignature
│   ├── ingestion.ts       # Polymorphic DataStream adapters
│   ├── lifecycle.ts       # Deadline-driven preemption
│   └── locator.ts         # Chunk routing & micro-torrent mapping
├── errors.ts              # Centralized SwISDError classes
├── index.ts               # Main application entrypoint (Headless Node)
├── types.ts               # Global shared types & type guards
└── utils.ts               # Pure, side-effect-free utility functions


## Conductor Cockpit (cockpit/)

cockpit/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                # Primitive Source of Truth (Button, Card, StatusPill, SwarmPulse,
│   │   │   │                      #   ProgressRing, ProgressBar, Modal, Drawer, TextField, Icon, Stat,
│   │   │   │                      #   EmptyState, PageShell, Panel)
│   │   │   │   └── index.ts       # Barrel export for UI primitives
│   │   │   ├── DiscoveryPanel.svelte    # mDNS node visualization
│   │   │   ├── ModelDropZone.svelte     # Streaming drag-and-drop ingestion
│   │   │   └── PendingTrustPanel.svelte # Cryptographic trust management
│   │   ├── server/
│   │   │   └── discovery.ts             # BFF mDNS listener & TrustRegistry injector
│   │   └── index.ts                     # Barrel export
│   ├── routes/
│   │   ├── api/
│   │   │   ├── discovery/+server.ts     # GET /api/discovery
│   │   │   ├── models/
│   │   │   │   ├── approve/+server.ts   # POST consume nonce & start download
│   │   │   │   ├── ingest/+server.ts    # POST streaming local ingestion
│   │   │   │   ├── library/+server.ts   # GET persistent model registry
│   │   │   │   ├── request/+server.ts   # POST HF metadata fetch & nonce gen
│   │   │   │   └── status/+server.ts    # GET SSE bridge for download progress
│   │   │   ├── peers/+server.ts         # GET/POST /api/peers
│   │   │   └── snapshot/+server.ts      # GET /api/snapshot
│   │   ├── design/+page.svelte          # Living style guide & primitive gallery
│   │   ├── models/+page.svelte          # Model distribution view
│   │   ├── layout.css                   # Theme Source of Truth (imported as ./layout.css by +layout.svelte)
│   │   ├── +layout.svelte               # Global UI shell
│   │   └── +page.svelte                 # Main dashboard view
│   ├── app.d.ts                         # SvelteKit Locals typing (Core Bridge)
│   └── hooks.server.ts                  # BFF Bridge (Core injection & singleton init)
└── vite.config.ts                       # SvelteKit 2 + Tailwind + Runes enforcement


## Context & Standards (Root)

root/
├── BACKLOG.md             # Strategic roadmap & locked decisions
├── CRDT.md                # Mathematical foundation (Join-semilattices)
├── FILETREE.md            # Maps the whole project as reference!
├── GUIDE.md               # Core philosophy & strict dev standards
├── SVELTE.md              # Domain C Svelte 5 & a11y standards
└── package.json           # Dependencies (Node 22+, libp2p v3)