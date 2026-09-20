<!--
1. Relative path: BACKLOG.md
2. Description: The "don't you dare forget" ledger for SwISD, tracking completed and pending architectural milestones.
3. Expects: Continuous updates as phases are conquered and new domains are defined.
4. Provides: A single source of truth for the project's current state, locked decisions, and strategic roadmap.
-->
SwISD BACKLOG
The "don't you dare forget" ledger. Split by where the work lives.
Section 1 = the central app (GitHub). Section 2 = the Raspberry Pi delivery machine. Section 3 = the Marketing Site.

🔒 Locked Decisions (Reference)
- **Repo:** Public, open-source, releases signed.
- **Release channels:** Single track.
- **Supervisor:** Pinned in image; only the App is OTA-updated.
- **Rollback:** Lightweight 60s heartbeat watchdog + revert; swarm heals organically.
- **Fleet:** ≤30 devices, <10 Raspis. Stagger window tuned small.
- **OS patches:** `unattended-upgrades` enabled.
- **Crypto:** Ed25519 control-plane (reuse libp2p peer keys) + HMAC-SHA256 data-plane (noise-handshake keys) + SHA-256/BLAKE3 for Merkle integrity.
- **CRDTs:** Custom, Merkle-DAG structured. Reputation decay computed strictly at read time.
- **Architecture:** Capability-Aware, Polymorphic Render Swarm. Blind ingress, targeted egress, stateless agents, polite ingestion.
- **Domain C Stack:** Svelte 5 (Runes/Snippets) + SvelteKit 2 Node adapter + TailwindCSS. The SvelteKit server is the BFF and the only process allowed to touch the headless SwISD core.
- **Conductor Cockpit Bridge:** The headless core is initialized once as a server-side singleton, injected into `event.locals`, and exposed to the browser only through strict DTO-typed API routes. No core internals leak to the client. No `any`.
- **Genesis Bootstrap Protocol:** Conductor acts as the fallback hotspot (`SwISD-Genesis`). Pis connect if no known network is found, allowing zero-internet, out-of-box swarm formation.
- **Cryptographic Trust Boundary:** Network proximity (mDNS/Genesis WiFi) is purely advisory. Peers must be explicitly accepted via the Cockpit's `TrustRegistry` before participating in the swarm.
- **Data Purity:** Zero `Buffer` bloat in ingestion pipelines (`Uint8Array` strictly enforced). Identity serialization uses Hex strings to prevent JSON `number[]` bloat.
- **Model Download Approval Gate:** No model may be downloaded from an external source (HuggingFace or otherwise) without explicit Conductor operator approval. Metadata (size, file count) MUST be fetched and displayed in a confirmation modal BEFORE download begins. Tier 2 P2P chunk seeding within the swarm is exempt (model was already approved at Tier 1 ingress).
- **Domain C Design System (The Single-Source Doctrine):** Visual language is governed by `layout.css` (theme tokens + regime folder), `components/ui` (primitives), and the typed theme registry (`lib/theme.ts`). Feature components NEVER invent new visual atoms and NEVER apply raw styles. "No UI element stands alone."
- **Topology Layout Doctrine:** Deterministic orbital layout (Conductor center, trust-ring orbits, limbo orbit for ghosts). No force-directed physics/jitter for fleet ≤30.
- **Cross-Swarm Memory:** Worker Pis remain beautifully dumb and stateless across swarms. Only the Conductor (Domain C BFF/LocalStorage) remembers historical peer assignments.
- **Datavis Architecture:** D3 used strictly as a headless math engine (`d3-scale`). Svelte renders SVG. No styled graph frameworks (vis-network, Cytoscape). New `cockpit/src/lib/components/datavis/` folder strictly separated from `components/ui/`.
- **Telemetry Transport:** WebSockets rejected for telemetry. SSE used for high-frequency streams alongside snapshot polling. Client-side interpolation for Pulse smoothness.
- **StatusPill Semantic Vocabulary & Domain Adapters:** Primitives speak semantics (`'live' | 'warn' | 'accent' | 'idle'`), features speak domain. Domain states are mapped to primitive vocabulary via pure adapter functions in `lib/adapters/` (promoted to a shared module on second use). Primitives never learn swarm concepts.
- **Pin Store Doctrine:** Prolonged-control pins live in a shared reactive store (`lib/pins.svelte.ts`) built on module-level `$state`, persisted per-device under `swisd-pins` in localStorage. Max 8 pins with FIFO eviction. The store is the single source of truth consumed by both the map (focus/grey-out) and the sidebar. Worker Pis never learn about pins.
- **Scenario Replay Doctrine:** Replay injects at the core `ObservabilitySource` boundary, never at the BFF DTO layer — the cockpit runs its real DTO pipelines over deterministic scenario state. Fixtures live in the headless core (`src/observability/scenarios.ts`), typed against domain types (hex peer IDs, `ExecutorSignature`, trust states). Zero randomness; deterministic keyframes only.
- **Replay Activation Gate:** Triple-gated — `SWISD_REPLAY=<scenario-id>` env var with dynamic import in the core, cockpit control surfaces (`/api/scenario`, `/dev/replay`) behind `import.meta.env.DEV`, and a mandatory `source: 'live' | 'replay'` snapshot discriminator surfaced as a REPLAY badge in the shell. No runtime toggle in production builds.
- **Replay Time Model:** Keyframe channels over scenario time — linear interpolation for continuous channels (`loadScore`), step semantics for discrete channels (presence, trust, task state). Snapshot polling samples the timeline; scenarios loop with a hard snap at t=0.
- **Replay Trust Mutations:** The scenario harness owns both the observability surface and the trust surface, so `/api/peers` approvals in replay visibly promote ghosts out of the limbo orbit. Ghosts inject at the `TrustRegistry` layer — mDNS is transport, replay skips transport.
- **Peer Telemetry DTO Completion:** `ObservabilityPeerInfo` carries `loadScore: number | null` and `capabilities: readonly ExecutorSignature[] | null`. `buildSwarmTopology()` maps source values instead of hardcoding `null`; the gossiped Control Ledger wires these live when it lands.
- **Marketing Site Filter/Sort Pattern:** Multi-value filters use `MultiSelect` (string array contract, `$bindable`). Single-value sort uses `SegmentedControl` (compact variant). Status line is always mounted with invisible clear-filters placeholder to prevent layout jumps. Sort fallback is alphabetical on year-ties.

SECTION 1 — THE APP (GitHub: `swisd`)

P0 — Foundation (do first, zero behavioral risk)
- [x] File restructure — barrel-enforced. One `index.ts` per module; import only via barrels.
- [x] Max one-step import depth. Kill every `../../a/b/c`.
- [x] Centralized files: `src/utils.ts`, `src/types.ts`, `src/types.d.ts`, `src/errors.ts`.
- [x] Type safety purge foundation. Remove all `as any`. Align `@libp2p/*` versions. Enforce `strictNullChecks`, `noImplicitAny`, `eslint-plugin-no-any` (build-failing).
- [x] Configuration substrate. Strict USB provision schema validation and loader (`src/config/`).
- [x] Cryptographic primitives. Native Node.js Ed25519 (control) and HMAC-SHA256 (data) with zero third-party bloat.
- [x] De-centralize the architecture. Remove the elected Gate/coordinator; refactor to the blind model.
- [x] Critical bug fixes: `peerIdFromString` mock → real `@libp2p/peer-id` import; `require('os')` → ESM `import { cpus }`; graceful shutdown stubbed in `src/index.ts`.
- [x] KokoroManager singleton. Inject one instance; stop re-instantiating per task.

P1 — Core decentralized substrate
- [x] Custom CRDTs (Merkle-DAG structured) interfaces: OR-Set, LWW-Register, G-Set, OR-Map mapped to swarm state.
- [x] Reputation correctness. Move decay from write-time to read-time. Store signed `(success, latency, timestamp)` events. (Implemented `ReputationLog`, wired egress emission, gossip validation, and anti-entropy sync)
- [x] Blind propagation + Probabilistic TTL via Bloom Filters (loop prevention).
- [x] Role emergence foundation. INPUT / WORKER / DIPLOMAT emerge from capabilities. Storage sharding is capability-driven, not role-assigned.
- [x] Torrent-style task fragmentation + reassembly. 256KB chunks, HMAC data-plane validation, Merkle control-plane integrity.
- [x] Agnostic Execution Framework. `ExecutorRegistry` and `CapabilityManifest` for software-aware routing.
- [x] Capability-Aware Gossip Router. Filter Bloom filters and route `ExecutionPayload` based on `supportedExecutors`. (Option A implemented: App-layer explicit publish with mutated Bloom filter; libp2p native forwarding tolerated but redundant messages dropped locally).
- [ ] Capability-Aware Gossip Router (Option B - Deferred). Implement custom Gossipsub message validator/router to strictly control the forwarding pipeline at the libp2p layer, eliminating redundant native forwarding bandwidth waste.
- [x] Direct Egress Tunnel. Implement libp2p stream protocol (`/swisd/egress/1.0.0`) for peers to push results directly to the Conductor.
- [x] Immediate preemption & Error routing. Dual-mechanism implementation: (1) Hive Mind: `TaskHistoryEvent` (`preempted` / `failed`) gossiped to swarm for organic reassignment. (2) Ruthless Stopwatch: `TaskLifecycleManager` enforces `deadlineMs` fallback, guaranteeing no orphaned tasks violate reliability directives.

P2 — Performance & data
- [x] Edge backpressure. Token bucket + load shedding + load score (0–1). If load > 0.8: reject new tasks + reduce gossip. (Implemented `LoadMonitor` and token bucket throttling in `src/performance/`)
- [x] Health via `@libp2p/ping` + load score. Replace the custom "MEOW" healthcheck. (Implemented `PeerHealthMonitor` in `src/network/health.ts`)
- [x] Merkle-DAG anti-entropy sync foundation. Root-hash exchange; `reconcileDap` fetches only missing/modified branches.
- [ ] Multi-step diffing for reputation anti-entropy. Implement full recursive Merkle-DAG diffing protocol for large reputation logs. (See project KUPF for implementation details and cross-project integration).
- [x] Two-Tier Diary Storage. Control Ledger (fully replicated CRDT metadata) + Sharded Payload Store (capability-driven, indexed by Control Ledger).
- [x] Polymorphic Ingestion Engine. `AsyncIterable<Uint8Array>` abstraction for Node/Browser file chunking. (Refactored to pure `Uint8Array` zero-copy concatenation).
- [ ] Hybrid vector DB sync. Probability race: gossip embeddings vs. direct push.
- [x] P2P model distribution foundation. `ChunkLocationLedger` and `buildChunkRoutingTable` for parallel micro-torrent downloads.

P3 — Advanced
- [ ] Diplomat election + inter-swarm routing (sole cross-swarm bridge).
- [ ] Update Gossip Protocol (app-level coordination): Messages, deterministic stagger, downgrade protection, P2P bundle seeding.
- [x] Admin / observability endpoint. Headless, strict JSON API server. Legacy Vanilla JS GUI incinerated; Domain C Svelte cockpit is the sole operator interface.
- [x] Dual-Audience API Boundary. `SwISDClient` exposed as the public `npm` API, wrapping the headless engine and optional GUI.

P4 — Model Distribution & Heavy Payloads (The New Frontier)
- [x] Model Manifest CRDT: Define `ModelManifest` (Merkle root, required capability, chunk map) in the Control Ledger. (Added `ModelRegistryCRDT` to `src/crdt/structures.ts` and expanded `ModelManifest` schema)
- [x] Persistent Model Library: CRDT-backed `ModelRegistry` persisted to `<deliveryRoot>/state/`, growing organically without hardcoded lists.
- [x] Streaming Download Pipeline & SSE Bridge: `ModelDownloader` with real-time progress telemetry streamed to the BFF.
- [x] Approval Gate Backend: `ApprovalGate` with one-time nonces. Hard-blocks silent background downloads; requires explicit operator confirmation.
- [ ] HuggingFace Model Ingress (Tier 1 UI): Model-agnostic mechanism to register a HuggingFace model URL.
- [x] Metadata pre-fetch: Query HuggingFace API for model size/siblings before download begins. (Implemented in `src/models/huggingface.ts`)
- [ ] Approval modal in Conductor Cockpit: "This model is X GB across Y files. Download and store locally?" with explicit Approve / Cancel actions.
- [ ] Offline degradation: If the HuggingFace API is unreachable, the modal MUST display "Size unknown — metadata unavailable" and require a second, explicit risk acknowledgment before proceeding.
- [x] Local Model Manager Foundation: `src/models/ingest.ts` streams, chunks, and Merkle-verifies heavy payloads. (Identity serialization optimized to Hex strings).
- [ ] Model Lifecycle Manager (QoL): Generic, model-agnostic lifecycle manager in `src/models/manager.ts` encapsulating lazy initialization, local validation, and disposal.
  - [ ] Lazy initialization: Load model pipelines on-demand, not at startup.
  - [ ] `checkModelExistsLocally()`: Validate critical model files exist and are readable before loading.
  - [ ] `dispose()`: Clean teardown of loaded pipelines to free edge-device memory.
- [ ] Local Model Manager (LRU): Build eviction logic for `/opt/swisd/models/`.
- [ ] P2P Chunk Seeding: Implement libp2p stream handler (`/swisd/model/1.0.0`) for serving requested model chunks to neighboring peers (micro-torrent layer).
- [ ] Storage Watermarks & Eviction: Implement LRU eviction policy when `/opt/swisd/models/` exceeds configured disk watermark.

P5 — User Experience & The Conductor Cockpit (Domain C)

Architecture & Bridge
- [x] Domain C Phase 1 — Conductor bridge: Svelte 5 + SvelteKit 2 Node adapter BFF scaffold, strict TypeScript ESM, TailwindCSS, barrel imports, max one-step import depth, and 4-point file headers.
- [x] Domain C Phase 1 — Core injection: Headless SwISD core singleton is initialized server-side and injected into `event.locals` via `src/hooks.server.ts`.
- [x] Domain C Phase 1 — Snapshot API: `GET /api/snapshot` returns a strictly typed `SwarmSnapshot` DTO from the core.
- [x] Domain C Phase 1 — Rune dashboard shell: `src/routes/+layout.svelte` and `src/routes/+page.svelte` consume the snapshot using Svelte 5 `$state` and `$derived`.
- [x] BFF Topology DTO: `SwarmTopologyDTO` in BFF to aggregate remote peer load scores and `CapabilityManifests`. (Implemented `buildSwarmTopology()` in `cockpit/src/lib/server/topology.ts` with `GET /api/topology` route. Currently wires `null` for remote load/capabilities until gossiped Control Ledger is connected.)
- [ ] SSE promotion: Event streams (task lifecycle, trust changes, downloads) alongside snapshot polling; client-side interpolation for Pulse smoothness.

Design System & Datavis
- [x] Domain C Design System (The Single-Source Doctrine): Centralized theme tokens in `layout.css` and composable primitives in `components/ui`. Strict enforcement: no raw styles in feature components.
- [x] CSS Architecture (Cascade Layer Doctrine): All custom CSS lives in `@layer base` or `@layer components`; unlayered styles forbidden. Borders are theme opinions (transparent by default).
- [x] Multi-Theme Regimes (Theme Folder Doctrine): N-theme system via `lib/themes/*.css` with a CSS barrel (`index.css`), a typed registry (`lib/theme.ts`), a shared reactive store (`lib/theme.svelte.ts`), zero-flash bootstrap in `app.html`, and a live-preview gallery at `/settings`. Current regimes: Midnight Violet, Lavender Daylight, Cyberdeck (legacy), Ultraviolet.
- [x] Per-device theme persistence: `swisd-theme` and `swisd-theme-dark` localStorage keys; shell quick-flip restores last dark regime.
- [x] Local Font Embedding: Fonts bundled locally via Vite (`@fontsource/*`) to guarantee UI resilience and offline operation on edge devices.
- [x] `/design` Route (Visual Contract): A living style guide and primitive gallery to ensure coherent visual design across the dashboard.
- [x] `/settings` Route (Per-device configuration): Theme gallery with token-scoped live previews and regime quick-flip.
- [x] `datavis/` module scaffolding: Strict separation from `components/ui/`. D3 math modules (`layout.ts`) + Svelte SVG rendering (`TopologyCanvas`, `SwarmNode`, `GhostNode`, `TrustRing`). No styled graph frameworks. (Full orbital layout engine with deterministic positioning, ResizeObserver-driven responsive sizing, and D3 `scaleLinear` for load-to-radius mapping.)
- [x] Multi-capability encoding: Dominant fill + ring-segment bezel on nodes implemented in `SwarmNode.svelte`. (Striped encoding for expanded cards/modals deferred until modal deep-dive is built.)
- [x] Tabs primitive: WAI-ARIA compliant `Tabs.svelte` with `$bindable()`, `{#snippet}` content, and arrow-key navigation. Promoted to `components/ui/`.
- [x] Badge primitive: Compact numeric counter chip in `components/ui/Badge.svelte`. Token-themed, `aria-hidden`, renders nothing at zero, caps at `99+`. Promoted before first use per "No UI element stands alone."
- [x] Domain adapters module: `lib/adapters/` with barrel + `trust.ts` (`trustToStatus`). Promoted to a shared module on second appearance (StageView + SwarmSidebar). Encodes the Domain Adapter Doctrine.

Topology & Layout
- [x] Topology Canvas: Deterministic orbital layout (Conductor center, trust-ring orbits, limbo orbit for ghosts). SVG rendering fed by D3 `scaleLinear`. (Implemented `computeOrbitalLayout()` with strict config validation, `defaultOrbitalConfig()` proportional radii, and full a11y: `role="button"`, `tabindex`, `aria-label`, keyboard handlers on all nodes.)
- [ ] Zero-Peer State (Genesis Visual): Grey overlay with endless spinner ('searching...') and greyed-out data fields. Cockpit "wakes up" and glows upon first connection. (Ships in the Scenario Replay pass; driven by the `genesis` fixture.)
- [x] Scenario Replay Mode: Fixture-driven snapshot sequences via `observability/devSource.ts` source selection to test cockpit visuals (bottleneck, churn, ghost influx) without a physical fleet. Replay injects at the core `ObservabilitySource` boundary; the BFF runs its real DTO pipeline over scenario state.
- [x] Scenario fixtures (`src/observability/scenarios.ts`): Six keyframed scenarios — healthy mesh, bottleneck, churn, ghost influx, stalled pipeline, genesis. Deterministic, zero randomness, loop with hard snap at t=0.
- [x] Replay engine (`src/observability/scenarioEngine.ts`): Implements `ObservabilitySource`. Scenario clock + speed control; linear interpolation for continuous channels, step semantics for discrete channels; event cues feed the event ring.
- [x] Peer telemetry completion: Extend `ObservabilityPeerInfo` with `loadScore` + `capabilities`; `buildSwarmTopology()` maps source values instead of hardcoding `null`.
- [x] Stateful trust in replay: Scenario harness owns the trust surface so `/api/peers` approvals promote ghosts out of the limbo orbit. Ghosts inject at the `TrustRegistry` layer.
- [x] Activation gate: `SWISD_REPLAY=<scenario-id>` env var + dynamic import; cockpit controls (`/api/scenario`, `/dev/replay`) behind `import.meta.env.DEV`.
- [x] REPLAY badge: Snapshot DTO `source: 'live' | 'replay'` discriminator rendered in the shell via existing primitives (`warn` semantics). Operators never mistake replay for live telemetry.
- [x] Control deck (`/dev/replay`): Composes existing primitives only — `Tabs` for scenario selection, `Button` + `Icon` transport, typed speed cycle. No new visual atoms, no `Select`/`Slider` primitives.
- [x] Load domain adapter: `lib/adapters/load.ts` (`loadToStatus`: loadScore → `idle` / `throttled` / `shedding`) — second adapter, promoted per doctrine.

Cockpit Views & Interaction
- [x] Modern Dashboard UI: Replaced legacy vanilla JS `dashboardHtml.ts` with compiled Svelte 5 Domain C Cockpit.
- [x] Real-time model distribution progress and node health.
- [x] Live peer churn, load score, and executor capability panels.
- [ ] Cryptographic verification indicators hidden behind operator-friendly status states.
- [x] STAGE Tab (Artist focus): Peer-centric view ("which Pi does what?") with masonry grid of peer cards. (Implemented `StageView.svelte` with `Card`, `Stat`, `StatusPill` composition and domain-to-primitive adapter. Task-centric toggle deferred.)
- [x] ENGINE ROOM Tab (Sysadmin focus): Task-centric view focusing on bottlenecks, backpressure, and technical telemetry. (Implemented `EngineRoomView.svelte` with Conductor Telemetry, Network & CRDT cards, and Recent Events panel.)
- [ ] Fragment Reassembly Visual: Per-chunk reassembly progress for task fragments in ENGINE ROOM (composes `ProgressBar`). Makes the stalled pipeline scenario observable. (Ships in the Scenario Replay pass.)
- [x] Sidebar (Pins & Log): Prolonged control via pinned peers, scrollable informational log at the bottom. (Implemented `SwarmSidebar.svelte` composing `Badge`, `StatusPill`, `EmptyState`. Pins sourced from the shared `lib/pins.svelte.ts` store; log consumes `snapshot.recentEvents` under `role="log"`. Real buttons everywhere — no clickable divs, no mouse-only sins.)
- [ ] Contextual Modals: Deep info and decisions (e.g., Trust approval for ghosts, bottleneck investigation) triggered from Map, Sidebar, or Tabs. (Basic peer-click modal exists in `+page.svelte` with a Pin toggle; full contextual modals deferred.)
- [x] Command Queue Drawer: Right-edge notification drawer for pending operator actions. (Implemented `CommandQueue.svelte` composing `ui/Drawer`. Derives pending ghosts from `topology.peers` — no second polling loop. Presentational: decisions bubble to the route via `onTrust` / `onReject` callbacks posting to `/api/peers`. Trust approvals live; WiFi-setup and model-approval command types deferred to their respective features.)
- [ ] Consolidate trust UI: Incinerate transitional `PendingTrustPanel.svelte` once `CommandQueue` proves itself in the field. Single trust surface.
- [ ] Swarm Pulse & Masonry Grid: Global state indicator and expandable peer cards for deep telemetry visualization.
- [ ] Model Library UI: Compact download states with micro-progress rings and live SSE telemetry.

Discovery & Provisioning
- [x] mDNS Auto-Discovery: Implement `_swisd._tcp.local` broadcasting and listening for zero-config Conductor-to-Node pairing.
- [x] Conductor discovery of local swarm nodes (Core broadcasts via `bonjour-service`, BFF listens and exposes `GET /api/discovery`).
- [x] UI surface for discovered nodes and setup status (`DiscoveryPanel.svelte` with Svelte 5 runes).
- [x] Genesis Bootstrap Protocol & Trust Registry:
  - [x] Core `TrustRegistry` (`src/peer/trust.ts`) to manage `pending`, `trusted`, `rejected` states.
  - [x] BFF injects `TrustRegistry` into `event.locals` and registers mDNS discoveries as `PENDING`.
  - [x] API route `GET/POST /api/peers` to query and update trust states.
- [ ] Out-of-Box Setup Portal: Build fallback AP mode and captive portal wizard in `src/provision/` for monitor-less, USB-less initial WiFi provisioning.
  - [ ] Temporary `SwISD-Setup-XXXX` access point fallback.
  - [ ] Smartphone-friendly captive portal for WiFi credential injection.
  - [ ] Idempotent handoff from setup portal to normal swarm operation.
- [x] Drag-and-Drop Ingestion: Build Conductor-side CLI/UI wrapper to ingest local `.gguf` files, chunk them, and seed them to the swarm without browser memory limits.
  - [x] Browser-safe `AsyncIterable<Uint8Array>` upload abstraction.
  - [x] Streaming chunking into the Polymorphic Ingestion Engine.
- [ ] Manifest generation and swarm seeding progress visualization.

Deferred Logic
- [ ] Return-visit presentation logic: Badge count vs. dismiss-blocking modal priority rules for operator return. Needs urgency taxonomy.

Deferred (App)
- [ ] Vector DB sharding (large swarms). Trigger: storage pressure / large swarm.
- [ ] Elastic Capacity Allocation (watermark gossip consensus). Trigger: replication imbalance. (Foundation built in `src/storage/capacity.ts`).
- [ ] Stateful Performance Orchestration. Conductor-side buffering, beat-keeping, and glitch-recovery for continuous live streams. Trigger: postmodern classical music performance requirements.
- [ ] Cooperative update scheduling (negotiated spacing vs. hash-stagger). Trigger: reboot clustering.
- [ ] Multi-channel releases (beta/stable canary). Trigger: fleet growth / risky velocity.
- [ ] Chaos testing harness. Trigger: pre-1.0 hardening.
- [ ] Refine `TaskHistoryEvent.metadata` to a strict union of known metadata keys.
- [ ] Advanced Conductor live telemetry transport. Complex bidirectional streams. Trigger: after Phase 1 SSE snapshot bridge proves stable.

Marketing Site (`site/`)
- [x] Global Shell & Primitives: Promoted TopNav and Footer to global primitives in `+layout.svelte`. Cross-route anchor resolution implemented for in-page jumps from sub-routes.
- [x] Roadmap Timeline & Modal: Built a vertical timeline with a continuous central spine, lime-filled progress propagation, and alternating leaves. Rich editorial modal (1/3:2/3 layout) with `flush` variant for edge-to-edge media.
- [x] Asset & Content Barrels: Centralized image imports via `site/src/lib/assets/index.ts` and roadmap data via `site/src/lib/content/roadmap.ts`.
- [x] Logo Gallery: Built a single-row flex gallery supporting arbitrary square and 2:1 wide tile sequences with configurable alignment.
- [x] Modal Primitive Enhancement: Added `variant="flush"` for edge-to-edge media and a semantic lime-circle close button.
- [x] Science CTA: Added thin CTA band linking to the future `/research` Whitepapers hub.
- [x] Landing Page Sections: Built Problem, Solution, Showcase, Architecture (OrbitExplainer), Implementation (Code Block + Runtime Logos), Business (SDGs), Roadmap Preview, Traction, and Final CTA.
- [x] `/design` Route (Visual Contract): Living style guide and primitive gallery for the marketing site design system. Showcases all primitives with contextual mock data and layout regimes.
- [x] FilterChip Primitive: Accessible toggle chip for filtering lists in `components/ui/FilterChip.svelte`. Strict `aria-pressed` button with theme token styling.
- [x] CaseCard Primitive: Polymorphic case study card in `components/ui/CaseCard.svelte` supporting 6 layout regimes (gallery, plate, stack, ledger, split, marquee) with optional linked titles and partners. Exports `CaseCardLayout` union type. Structural `aria-hidden` bullet separator prevents Svelte whitespace-collapse bug.
- [x] MultiSelect Primitive: Accessible multi-option dropdown in `components/ui/MultiSelect.svelte`. Full keyboard navigation via `aria-activedescendant`, static `w-72` footprint with CSS truncation, separated `+X` count badge, and `$bindable` string array contract. Showcased on `/design`.
- [x] SegmentedControl Compact Variant: Added `variant="compact"` matching `MultiSelect` footprint (`h-10`, `w-72`, `rounded-xl`, `border-(--border)`). Backwards-compatible with default `h-12` pill variant. Showcased on `/design`.
- [x] Case Studies Archive (`/case-studies`): Filterable and sortable grid composing `MultiSelect` (Industry, Modalities), `FilterChip` (Year), and `SegmentedControl` (Sort: A–Z default, Newest, Oldest). Always-mounted status line with invisible clear-filters placeholder prevents layout jumps. Stable sort with alphabetical fallback on year-ties.
- [ ] Whitepapers Hub (`/research`): Build the scientific knowledge hub for CRDT proofs, Merkle-DAG integrity, and cryptographic primitives.

SECTION 2 — THE RASPBERRY PIS (image & delivery)

P0 — The Image (clone-safe)
- [ ] Base: Raspberry Pi OS Bookworm (NetworkManager, not legacy wpa_supplicant).
- [x] Identity birth contract: `IdentityManager` implemented to generate and persist fresh Ed25519 peer identity to state partition, surviving all updates. (OS-level machine-id/SSH deferred to actual image build).
- [x] Filesystem layout contract: `/opt/swisd/{releases, current, previous, state, supervisor, models}` defined and strictly enforced in local MVP. `state/` and `models/` strictly isolated from `releases/`.
- [x] Embed Ed25519 PUBLIC key for release verification (Implemented in local supervisor key management).

P0 — systemd services
- [x] Service templates defined: `swisd-provision.service`, `swisd-supervisor.service`, `swisd-app.service` with strict isolation (`ProtectSystem=strict`, `Restart=always`, pinned supervisor).

P1 — Supervisor (auto-update mechanics)
- [x] Local Delivery MVP: Full local dry-run/live testing of artifact verification and atomic symlink swaps.
- [x] Cryptographic Verification: SHA-256 + Ed25519 signature verification pipeline implemented (`verifier.ts`, `mockReleaseGenerator.ts`).
- [x] Atomic Installer: `installer.ts` handles safe, atomic symlink promotion and rollback.
- [x] Watchdog: App must heartbeat within configurable grace period → else revert to `previous` + restart. Decoupled from HTTP.
- [ ] Periodic GitHub Releases check (`ETag` + jitter).
- [ ] semver compare vs local `VERSION`.

P1 — USB Provisioning (zero-touch, re-provisionable)
- [x] Provisioning Contract: Strict `ProvisionConfig` schema validated. Idempotent application logic defined (`src/provision/apply.ts`).
- [x] Idempotent Application: Checksum-verified application of `/swisd-provision.json` via `nmcli`.
- [ ] Scan FAT32/exFAT sticks for `/swisd-provision.json`. (Pi-specific `udev` implementation).
- [ ] Re-provisioning on stick insertion.

P2 — Release & Signing Pipeline (GitHub Actions)
- [x] CI/CD Workflow: `.github/workflows/release.yml` triggers on `v*` tags or manual dispatch.
- [x] Cryptographic Signing: `scripts/sign-release.ts` signs the tarball using `SWISD_SIGNING_KEY_DER_BASE64` from GitHub Secrets.
- [x] Artifact Publishing: Automatically attaches `.tar.gz`, `.sha256`, and `.sig` to the GitHub Release.

P2 — Swarm-managed update delivery
- [ ] Soft single-checker, manifest gossip via Bloom-filter TTL, P2P bundle seeding, deterministic stagger scheduling.

Deferred (Pi)
- [ ] Sign the USB provision file. Deep boot-level health gates. Private repo / token releases. Fleet > 30 scaling.