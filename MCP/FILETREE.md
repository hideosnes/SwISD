<!--
1. Relative path: FILETREE.md
2. Description: The canonical architectural map and module index for the SwISD decentralized swarm.
3. Expects: To be pasted into new context windows to instantly restore the architect's spatial awareness.
4. Provides: A strictly enforced, barrel-governed directory tree with module responsibilities.
-->
SwISD Architectural Filetree
Legend: every folder is a module with an `index.ts` barrel; imports travel through barrels only, max one step deep.
Files marked `⏳ planned` are locked backlog decisions that do not exist on disk yet.

Core Application (`src/`)
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
│   └── structures.ts      # OR-Set, LWW, G-Set, OR-Map interfaces (+ ModelRegistryCRDT)
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
│   ├── verifier.ts        # SHA-256 + Ed256 artifact verification
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
│       ├── gossipRouter.ts# Capability-aware blind propagation
│       └── modelSeeder.ts # ⏳ planned — /swisd/model/1.0.0 chunk seeding handler
├── observability/         # Telemetry & snapshot generation
│   ├── index.ts           # Barrel export
│   ├── devSource.ts       # Dev environment state aggregator (live vs scenario source selection)
│   ├── eventBus.ts        # Bounded in-memory event ring
│   ├── scenarios.ts       # ⏳ planned — keyframed scenario fixtures + channel types (Scenario Replay Mode)
│   ├── scenarioSource.ts  # ⏳ planned — replay engine implementing ObservabilitySource (scenario clock, channel interpolation, event cues)
│   ├── schema.ts          # Observability DTOs (peer loadScore/capabilities + replay source discriminator)
│   └── snapshot.ts        # Immutable snapshot builder
├── peer/                  # Peer trust & membership
│   ├── index.ts           # Barrel export
│   └── trust.ts           # Cryptographic TrustRegistry (Pending/Trusted/Rejected)
├── performance/           # Edge backpressure & load shedding
│   ├── index.ts           # Barrel export
│   ├── load.ts            # LoadScore math & Token Bucket rate limiting
│   └── monitor.ts         # Stateful OS metric polling and gossip throttling
├── provision/             # Hardware & out-of-box provisioning
│   ├── index.ts           # Barrel export
│   ├── apply.ts           # Idempotent USB config application (nmcli)
│   ├── apFallback.ts      # ⏳ planned — SwISD-Setup-XXXX access point fallback
│   └── captivePortal.ts   # ⏳ planned — smartphone WiFi credential injection
├── storage/               # Elastic capacity allocation
│   ├── index.ts           # Barrel export
│   └── capacity.ts        # Swarm storage watermarks & replication math
├── tasks/                 # Task lifecycle & fragmentation
│   ├── index.ts           # Barrel export
│   ├── capabilities.ts    # CapabilityManifest & ExecutorSignature
│   ├── ingestion.ts       # Polymorphic DataStream adapters
│   ├── lifecycle.ts       # Deadline-driven preemption
│   └── locator.ts         # Chunk routing & micro-torrent mapping (ChunkLocationLedger)
├── errors.ts              # Centralized SwISDError classes
├── index.ts               # Main application entrypoint (Headless Node) & future public npm API boundary
├── types.ts               # Global shared types, interfaces, and type guards
└── utils.ts               # Pure, side-effect-free utility functions 

Conductor Cockpit (`cockpit/`)
cockpit/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                       # Primitive Source of Truth (Button, Card, StatusPill, SwarmPulse, ProgressRing, ProgressBar, Modal, Drawer, TextField, Icon, Stat, EmptyState, PageShell, Panel, ThemeToggle, Tabs, Badge)
│   │   │   │   └── index.ts              # Barrel export for UI primitives
│   │   │   ├── datavis/                  # Data visualisation Source of Truth (expanded below)
│   │   │   │   └── index.ts              # Barrel export for datavis primitives
│   │   │   ├── CommandQueue.svelte       # Operator action queue (composes ui/Drawer, trust approvals)
│   │   │   ├── DiscoveryPanel.svelte     # mDNS node visualization
│   │   │   ├── EngineRoomView.svelte     # Sysadmin-focused, task-centric telemetry view
│   │   │   ├── FragmentReassembly.svelte # ⏳ planned — per-chunk reassembly progress (ENGINE ROOM)
│   │   │   ├── ModelDropZone.svelte      # Streaming drag-and-drop ingestion
│   │   │   ├── PendingTrustPanel.svelte  # ⚠ transitional — superseded by CommandQueue, pending removal
│   │   │   ├── StageView.svelte          # Artist-focused, peer-centric masonry grid
│   │   │   └── SwarmSidebar.svelte       # Pinned peers + scrollable event log (prolonged control)
│   │   ├── adapters/                     # Client-side domain adapters (domain → primitive vocabulary)
│   │   │   ├── index.ts                  # Barrel export for adapters
│   │   │   ├── load.ts                   # ⏳ planned — loadToStatus: loadScore → StatusPill vocabulary (idle/throttled/shedding)
│   │   │   └── trust.ts                  # trustToStatus: TopologyTrustState → StatusPill Status
│   │   ├── themes/                       # Theme Folder Doctrine (N regimes, bundled at build time)
│   │   │   ├── index.css                 # CSS barrel (single import surface for layout.css)
│   │   │   ├── midnight.css              # Default regime (owns bare :root)
│   │   │   ├── daylight.css              # Light regime (cold lavender daylight)
│   │   │   ├── cyberdeck.css             # Legacy regime (hairlines + CRT lines on)
│   │   │   └── ultraviolet.css           # Violet regime
│   │   ├── theme.ts                      # Typed theme registry (ThemeId, THEMES, regimeOf)
│   │   ├── theme.svelte.ts               # Shared reactive theme store (device-local persistence)
│   │   ├── pins.svelte.ts                # Shared reactive pin store (prolonged control, localStorage)
│   │   ├── server/
│   │   │   ├── index.ts                  # Barrel export for BFF server modules
│   │   │   ├── discovery.ts              # BFF mDNS listener & TrustRegistry injector
│   │   │   └── topology.ts               # SwarmTopologyDTO aggregator & builder
│   │   └── index.ts                      # Barrel export
│   ├── routes/
│   │   ├── api/
│   │   │   ├── discovery/+server.ts      # GET /api/discovery
│   │   │   ├── events/+server.ts         # ⏳ planned — GET SSE bridge (task lifecycle, trust changes)
│   │   │   ├── models/
│   │   │   │   ├── approve/+server.ts    # POST consume nonce & start download
│   │   │   │   ├── ingest/+server.ts     # POST streaming local ingestion
│   │   │   │   ├── library/+server.ts    # GET persistent model registry
│   │   │   │   ├── request/+server.ts    # POST HF metadata fetch & nonce gen
│   │   │   │   └── status/+server.ts     # GET SSE bridge for download progress
│   │   │   ├── peers/+server.ts          # GET/POST /api/peers
│   │   │   ├── scenario/+server.ts       # ⏳ planned — GET/POST scenario control (DEV-only: play/pause/speed/select)
│   │   │   ├── snapshot/+server.ts       # GET /api/snapshot
│   │   │   └── topology/+server.ts       # GET /api/topology (Aggregates SwarmTopologyDTO)
│   │   ├── design/+page.svelte           # Living style guide & primitive gallery
│   │   ├── dev/replay/+page.svelte       # ⏳ planned — DEV-only scenario control deck
│   │   ├── models/+page.svelte           # Model distribution view
│   │   ├── settings/+page.svelte         # Per-device theme gallery & regime controls
│   │   ├── layout.css                    # Theme Conductor (imports themes barrel + shared tokens)
│   │   ├── +layout.svelte                # Global UI shell (imports ./layout.css)
│   │   └── +page.svelte                  # Main dashboard view (Pulse + Topology + tabs live here)
│   ├── app.d.ts                          # SvelteKit Locals typing (Core Bridge)
│   ├── app.html                          # Pre-hydration theme bootstrap (zero flash)
│   └── hooks.server.ts                   # BFF Bridge (Core injection & singleton init)
└── vite.config.ts                        # SvelteKit 2 + Tailwind + Runes enforcement

Datavisualisation & Maps (nested under `cockpit/src/lib/components/datavis/`)
D3 serves as a headless math engine only (`d3-scale`); Svelte owns every rendered SVG atom.
No styled graph frameworks. Strict separation from `components/ui/`.
cockpit/src/lib/components/datavis/
├── index.ts                    # Barrel export (sole import surface for feature code)
├── types.ts                    # Strict DTOs for datavis props (TopologyNode, TopologyEdge, ...)
├── topology/                   # Orbital swarm map
│   ├── index.ts                # Barrel export
│   ├── TopologyCanvas.svelte   # Main SVG container; zoom/pan, responsive sizing
│   ├── SwarmNode.svelte        # Peer node (dominant capability fill + ring-segment bezel)
│   ├── GhostNode.svelte        # PENDING peer docked in the limbo orbit
│   ├── TrustRing.svelte        # Orbital ring for trusted clusters
│   └── layout.ts               # Pure math: deterministic orbital positioning, D3 scale mappings
└── charts/                     # Drill-down telemetry
    ├── index.ts                # Barrel export
    ├── Sparkline.svelte        # STAGE / ENGINE ROOM drill-downs
    └── Gauge.svelte            # Load score visualization

Marketing Site (`site/`)
Isolated static marketing surface. Strict Svelte 5 Runes, a11y, and Tailwind v4 enforcement.
Barrel rules apply: imports travel through barrels only, max one step deep.
site/
├── vite.config.ts              # Vite config with inline SvelteKit static adapter & Tailwind v4
├── src/
│   ├── lib/
│   │   ├── assets/
│   │   │   └── index.ts                 # Barrel export for static image assets (logos, SDGs)
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── index.ts             # Barrel export for UI primitives
│   │   │   │   ├── Arrow.svelte         # Directional SVG arrow primitive
│   │   │   │   ├── Footer.svelte        # Global site footer (utility nav, cross-route anchor resolution)
│   │   │   │   ├── LogoGallery.svelte   # Single-row flex logo grid (configurable alignment)
│   │   │   │   ├── ManifestoList.svelte # Star-prefixed list primitive
│   │   │   │   ├── Modal.svelte         # Accessible modal dialog (default + flush variants, lime-circle close)
│   │   │   │   ├── RoadmapModal.svelte  # Editorial 1/3:2/3 modal for roadmap entries
│   │   │   │   ├── RoadmapTimeline.svelte # Vertical timeline with continuous spine and alternating leaves
│   │   │   │   ├── SegmentedControl.svelte # Audience toggle primitive
│   │   │   │   ├── SwarmCanvas.svelte   # Hero background topology canvas
│   │   │   │   ├── Toast.svelte         # Auto-dismissing notification with accessible status role
│   │   │   │   ├── ToastContainer.svelte# Global container rendering active toasts via uiStore
│   │   │   │   └── TopNav.svelte        # Global sticky navigation bar (glassmorphic, SSR-safe)
│   │   │   ├── datavis/
│   │   │   │   ├── index.ts             # Barrel export for datavis primitives
│   │   │   │   └── OrbitExplainer.svelte # Interactive architecture orbit explainer
│   │   ├── content/
│   │   │   └── roadmap.ts               # Typed roadmap data source (status, time, title, image, description)
│   │   ├── stores/
│   │   │   └── ui.svelte.ts             # Global reactive state for UI engines (Toasts/Modals) via module-level $state
│   │   └── index.ts                     # Root barrel export for the site library
│   ├── routes/
│   │   ├── layout.css                   # Theme Conductor (tokens, cascade layers, primitive styles)
│   │   ├── +layout.ts                   # Root layout config: prerender directive
│   │   ├── +layout.svelte               # Global shell: TopNav, Footer, ToastContainer
│   │   ├── roadmap/
│   │   │   └── +page.svelte             # Interactive roadmap route
│   │   └── +page.svelte                 # Main landing page (hero, problem, solution, etc.)

Tooling, CI & Delivery Assets (Root Level)
.github/
└── workflows/
    └── release.yml             # CI/CD: triggers on v* tags or manual dispatch
scripts/
└── sign-release.ts             # Ed25519 tarball signing (SWISD_SIGNING_KEY_DER_BASE64 secret)
systemd/                        # Service templates for the Pi delivery image
├── swisd-app.service           # Strict isolation, Restart=always
├── swisd-provision.service     # One-shot USB provision application
└── swisd-supervisor.service    # Pinned supervisor, decoupled watchdog

Context & Standards (Root)
root/
├── BACKLOG.md             # Strategic roadmap & locked decisions
├── CRDT.md                # Mathematical foundation (Join-semilattices)
├── FILETREE.md            # Maps the whole project as reference
├── GUIDE.md               # Core philosophy & strict dev standards
├── SVELTE.md              # Domain C Svelte 5, a11y, and CSS architecture standards
└── package.json           # Dependencies (Node 22+, libp2p v3)