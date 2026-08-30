<!--
1. Relative path: BACKLOG.md
2. Description: The "don't you dare forget" ledger for SwISD, tracking completed and pending architectural milestones.
3. Expects: Continuous updates as phases are conquered and new domains are defined.
4. Provides: A single source of truth for the project's current state, locked decisions, and strategic roadmap.
-->
# SwISD BACKLOG
The "don't you dare forget" ledger. Split by where the work lives.
Section 1 = the central app (GitHub). Section 2 = the Raspberry Pi delivery machine.

## 🔒 Locked Decisions (Reference)
- **Repo:** Public, open-source, releases signed.
- **Release channels:** Single track.
- **Supervisor:** Pinned in image; only the App is OTA-updated.
- **Rollback:** Lightweight 60s heartbeat watchdog + revert; swarm heals organically.
- **Fleet:** ≤30 devices, <10 Raspis. Stagger window tuned small.
- **OS patches:** `unattended-upgrades` enabled.
- **Crypto:** Ed25519 control-plane (reuse libp2p peer keys) + HMAC-SHA256 data-plane (noise-handshake keys) + SHA-256/BLAKE3 for Merkle integrity.
- **CRDTs:** Custom, Merkle-DAG structured. Reputation decay computed strictly at **read time**.
- **Architecture:** Capability-Aware, Polymorphic Render Swarm. Blind ingress, targeted egress, stateless agents, polite ingestion.
- **Domain C Stack:** Svelte 5 (Runes/Snippets) + SvelteKit 2 Node adapter + TailwindCSS. The SvelteKit server is the BFF and the only process allowed to touch the headless SwISD core.
- **Conductor Cockpit Bridge:** The headless core is initialized once as a server-side singleton, injected into `event.locals`, and exposed to the browser only through strict DTO-typed API routes. No core internals leak to the client. No `any`.
- **Genesis Bootstrap Protocol:** Conductor acts as the fallback hotspot (`SwISD-Genesis`). Pis connect if no known network is found, allowing zero-internet, out-of-box swarm formation.
- **Cryptographic Trust Boundary:** Network proximity (mDNS/Genesis WiFi) is purely advisory. Peers must be explicitly accepted via the Cockpit's `TrustRegistry` before participating in the swarm.
- **Data Purity:** Zero `Buffer` bloat in ingestion pipelines (`Uint8Array` strictly enforced). Identity serialization uses Hex strings to prevent JSON `number[]` bloat.
- **Model Download Approval Gate:** No model may be downloaded from an external source (HuggingFace or otherwise) without explicit Conductor operator approval. Metadata (size, file count) MUST be fetched and displayed in a confirmation modal BEFORE any download begins. Tier 2 P2P chunk seeding within the swarm is exempt (model was already approved at Tier 1 ingress).
- **Domain C Design System (The Single-Source Doctrine):** Visual language is governed by exactly two sources of truth: `layout.css` (theme tokens) and `components/ui` (primitives). Feature components NEVER invent new visual atoms and NEVER apply raw styles. "No UI element stands alone."

---

# SECTION 1 — THE APP (GitHub: `swisd`)

## P0 — Foundation (do first, zero behavioral risk)
- [x] **File restructure — barrel-enforced.** One `index.ts` per module; import only via barrels.
- [x] **Max one-step import depth.** Kill every `../../a/b/c`.
- [x] **Centralized files:** `src/utils.ts`, `src/types.ts`, `src/types.d.ts`, `src/errors.ts`.
- [x] **Type safety purge foundation.** Remove all `as any`. Align `@libp2p/*` versions. Enforce `strictNullChecks`, `noImplicitAny`, `eslint-plugin-no-any` (build-failing).
- [x] **Configuration substrate.** Strict USB provision schema validation and loader (`src/config/`).
- [x] **Cryptographic primitives.** Native Node.js Ed25519 (control) and HMAC-SHA256 (data) with zero third-party bloat.
- [x] **De-centralize the architecture.** Remove the elected Gate/coordinator; refactor to the blind model.
- [x] **Critical bug fixes:** `peerIdFromString` mock → real `@libp2p/peer-id` import; `require('os')` → ESM `import { cpus }`; graceful shutdown stubbed in `src/index.ts`.
- [x] **KokoroManager singleton.** Inject one instance; stop re-instantiating per task.

## P1 — Core decentralized substrate
- [x] **Custom CRDTs (Merkle-DAG structured) interfaces:** OR-Set, LWW-Register, G-Set, OR-Map mapped to swarm state.
- [x] **Reputation correctness.** Move decay from write-time to read-time. Store signed `(success, latency, timestamp)` events. *(Implemented `ReputationLog`, wired egress emission, gossip validation, and anti-entropy sync)*
- [x] **Blind propagation + Probabilistic TTL via Bloom Filters** (loop prevention).
- [x] **Role emergence foundation.** INPUT / WORKER / DIPLOMAT emerge from capabilities. Storage sharding is capability-driven, not role-assigned.
- [x] **Torrent-style task fragmentation + reassembly.** 256KB chunks, HMAC data-plane validation, Merkle control-plane integrity.
- [x] **Agnostic Execution Framework.** `ExecutorRegistry` and `CapabilityManifest` for software-aware routing.
- [x] **Capability-Aware Gossip Router.** Filter Bloom filters and route `ExecutionPayload` based on `supportedExecutors`. (Option A implemented: App-layer explicit publish with mutated Bloom filter; libp2p native forwarding tolerated but redundant messages dropped locally).
- [ ] **Capability-Aware Gossip Router (Option B - Deferred).** Implement custom Gossipsub message validator/router to strictly control the forwarding pipeline at the libp2p layer, eliminating redundant native forwarding bandwidth waste.
- [x] **Direct Egress Tunnel.** Implement libp2p stream protocol (`/swisd/egress/1.0.0`) for peers to push results directly to the Conductor.
- [x] **Immediate preemption & Error routing.** Dual-mechanism implementation: (1) Hive Mind: `TaskHistoryEvent` (`preempted`/`failed`) gossiped to swarm for organic reassignment. (2) Ruthless Stopwatch: `TaskLifecycleManager` enforces `deadlineMs` fallback, guaranteeing no orphaned tasks violate reliability directives.

## P2 — Performance & data
- [x] **Edge backpressure.** Token bucket + load shedding + load score (0–1). If load > 0.8: reject new tasks + reduce gossip. *(Implemented `LoadMonitor` and token bucket throttling in `src/performance/`)*
- [x] **Health via `@libp2p/ping` + load score.** Replace the custom "MEOW" healthcheck. *(Implemented `PeerHealthMonitor` in `src/network/health.ts`)*
- [x] **Merkle-DAG anti-entropy sync foundation.** Root-hash exchange; `reconcileDap` fetches only missing/modified branches.
- [ ] **Multi-step diffing for reputation anti-entropy.** Implement full recursive Merkle-DAG diffing protocol for large reputation logs. *(See project KUPF for implementation details and cross-project integration).*
- [x] **Two-Tier Diary Storage.** Control Ledger (fully replicated CRDT metadata) + Sharded Payload Store (capability-driven, indexed by Control Ledger).
- [x] **Polymorphic Ingestion Engine.** `AsyncIterable<Uint8Array>` abstraction for Node/Browser file chunking. *(Refactored to pure `Uint8Array` zero-copy concatenation).*
- [ ] **Hybrid vector DB sync.** Probability race: gossip embeddings vs. direct push.
- [x] **P2P model distribution foundation.** `ChunkLocationLedger` and `buildChunkRoutingTable` for parallel micro-torrent downloads.

## P3 — Advanced
- [ ] **Diplomat election + inter-swarm routing** (sole cross-swarm bridge).
- [ ] **Update Gossip Protocol (app-level coordination):** Messages, deterministic stagger, downgrade protection, P2P bundle seeding.
- [x] **Admin / observability endpoint.** Headless, strict JSON API server. Legacy Vanilla JS GUI incinerated; Domain C Svelte cockpit is the sole operator interface.
- [x] **Dual-Audience API Boundary.** `SwISDClient` exposed as the public `npm` API, wrapping the headless engine and optional GUI.

## P4 — Model Distribution & Heavy Payloads (The New Frontier)

- [x] **Model Manifest CRDT:** Define `ModelManifest` (Merkle root, required capability, chunk map) in the Control Ledger. *(Added `ModelRegistryCRDT` to `src/crdt/structures.ts` and expanded `ModelManifest` schema)*

- [x] **Persistent Model Library:** CRDT-backed `ModelRegistry` persisted to `<deliveryRoot>/state/`, growing organically without hardcoded lists.
- [x] **Streaming Download Pipeline & SSE Bridge:** `ModelDownloader` with real-time progress telemetry streamed to the BFF.
- [x] **Approval Gate Backend:** `ApprovalGate` with one-time nonces. Hard-blocks silent background downloads; requires explicit operator confirmation.

- [ ] **HuggingFace Model Ingress (Tier 1 UI):** Model-agnostic mechanism to register a HuggingFace model URL.
  - [x] Metadata pre-fetch: Query HuggingFace API for model size/siblings *before* any download begins. *(Implemented in `src/models/huggingface.ts`)*
  - [ ] Approval modal in Conductor Cockpit: *"This model is **X GB** across **Y files**. Download and store locally?"* with explicit Approve / Cancel actions.
  - [ ] Offline degradation: If the HuggingFace API is unreachable, the modal MUST display *"Size unknown — metadata unavailable"* and require a second, explicit risk acknowledgment before proceeding.

- [x] **Local Model Manager Foundation:** `src/models/ingest.ts` streams, chunks, and Merkle-verifies heavy payloads. (Identity serialization optimized to Hex strings).

- [ ] **Model Lifecycle Manager (QoL):** Generic, model-agnostic lifecycle manager in `src/models/manager.ts` encapsulating lazy initialization, local validation, and disposal.
  - [ ] **Lazy initialization:** Load model pipelines on-demand, not at startup.
  - [ ] **`checkModelExistsLocally()`:** Validate critical model files exist and are readable before loading.
  - [ ] **`dispose()`:** Clean teardown of loaded pipelines to free edge-device memory.

- [ ] **Local Model Manager (LRU):** Build eviction logic for `/opt/swisd/models/`.
- [ ] **P2P Chunk Seeding:** Implement libp2p stream handler (`/swisd/model/1.0.0`) for serving requested model chunks to neighboring peers (micro-torrent layer).
- [ ] **Storage Watermarks & Eviction:** Implement LRU eviction policy when `/opt/swisd/models/` exceeds configured disk watermark.

## P5 — User Experience & The Conductor Cockpit (Domain C)
- [x] **Domain C Phase 1 — Conductor bridge:** Svelte 5 + SvelteKit 2 Node adapter BFF scaffold, strict TypeScript ESM, TailwindCSS, barrel imports, max one-step import depth, and 4-point file headers.
- [x] **Domain C Phase 1 — Core injection:** Headless SwISD core singleton is initialized server-side and injected into `event.locals` via `src/hooks.server.ts`.
- [x] **Domain C Phase 1 — Snapshot API:** `GET /api/snapshot` returns a strictly typed `SwarmSnapshot` DTO from the core.
- [x] **Domain C Phase 1 — Rune dashboard shell:** `src/routes/+layout.svelte` and `src/routes/+page.svelte` consume the snapshot using Svelte 5 `$state` and `$derived`.
- [x] **Modern Dashboard UI:** Replaced legacy vanilla JS `dashboardHtml.ts` with compiled Svelte 5 Domain C Cockpit.
  - [ ] Interactive node-graph color-coded by `CapabilityManifest`.
  - [x] Real-time model distribution progress and node health.
  - [x] Live peer churn, load score, and executor capability panels.
  - [ ] Cryptographic verification indicators hidden behind operator-friendly status states.
- [x] **mDNS Auto-Discovery:** Implement `_swisd._tcp.local` broadcasting and listening for zero-config Conductor-to-Node pairing.
  - [x] Conductor discovery of local swarm nodes (Core broadcasts via `bonjour-service`, BFF listens and exposes `GET /api/discovery`).
  - [x] UI surface for discovered nodes and setup status (`DiscoveryPanel.svelte` with Svelte 5 runes).
- [x] **Genesis Bootstrap Protocol & Trust Registry:**
  - [x] Core `TrustRegistry` (`src/peer/trust.ts`) to manage `pending`, `trusted`, `rejected` states.
  - [x] BFF injects `TrustRegistry` into `event.locals` and registers mDNS discoveries as `PENDING`.
  - [x] API route `GET/POST /api/peers` to query and update trust states.
- [ ] **Out-of-Box Setup Portal:** Build fallback AP mode and captive portal wizard in `src/provision/` for monitor-less, USB-less initial WiFi provisioning.
  - [ ] Temporary `SwISD-Setup-XXXX` access point fallback.
  - [ ] Smartphone-friendly captive portal for WiFi credential injection.
  - [ ] Idempotent handoff from setup portal to normal swarm operation.
- [x] **Drag-and-Drop Ingestion:** Build Conductor-side CLI/UI wrapper to ingest local `.gguf` files, chunk them, and seed them to the swarm without browser memory limits.
  - [x] Browser-safe `AsyncIterable<Uint8Array>` upload abstraction.
  - [x] Streaming chunking into the Polymorphic Ingestion Engine.
  - [ ] Manifest generation and swarm seeding progress visualization.
- [x] **Domain C Design System (The Single-Source Doctrine):** Centralized theme tokens in `layout.css` and composable primitives in `components/ui`. Strict enforcement: no raw styles in feature components.
- [x] **Local Font Embedding:** Fonts bundled locally via Vite (`@fontsource/*`) to guarantee UI resilience and offline operation on edge devices.
- [x] **`/design` Route (Visual Contract):** A living style guide and primitive gallery to ensure coherent visual design across the dashboard.
- [ ] **Command Queue Drawer:** Right-edge notification drawer for pending operator actions (Trust approvals, WiFi setup).
- [ ] **Swarm Pulse & Masonry Grid:** Global state indicator and expandable peer cards for deep telemetry visualization.
- [ ] **Model Library UI:** Compact download states with micro-progress rings and live SSE telemetry.

## Deferred (App)
- [ ] **Vector DB sharding** (large swarms). *Trigger: storage pressure / large swarm.*
- [ ] **Elastic Capacity Allocation** (watermark gossip consensus). *Trigger: replication imbalance.* (Foundation built in `src/storage/capacity.ts`).
- [ ] **Stateful Performance Orchestration.** Conductor-side buffering, beat-keeping, and glitch-recovery for continuous live streams. *Trigger: postmodern classical music performance requirements.*
- [ ] **Cooperative update scheduling** (negotiated spacing vs. hash-stagger). *Trigger: reboot clustering.*
- [ ] **Multi-channel releases** (beta/stable canary). *Trigger: fleet growth / risky velocity.*
- [ ] **Chaos testing harness.** *Trigger: pre-1.0 hardening.*
- [ ] **Refine `TaskHistoryEvent.metadata`** to a strict union of known metadata keys.
- [ ] **Conductor live telemetry transport.** SSE/WebSocket bridge from core events to the cockpit. *Trigger: after Phase 1 snapshot bridge proves stable.*

---

# SECTION 2 — THE RASPBERRY PIS (image & delivery)

## P0 — The Image (clone-safe)
- [ ] **Base:** Raspberry Pi OS Bookworm (NetworkManager, not legacy wpa_supplicant).
- [x] **Identity birth contract:** `IdentityManager` implemented to generate and persist fresh Ed25519 peer identity to state partition, surviving all updates. *(OS-level machine-id/SSH deferred to actual image build).*
- [x] **Filesystem layout contract:** `/opt/swisd/{releases, current, previous, state, supervisor, models}` defined and strictly enforced in local MVP. `state/` and `models/` strictly isolated from `releases/`.
- [x] **Embed Ed25519 PUBLIC key** for release verification *(Implemented in local supervisor key management)*.

## P0 — systemd services
- [x] **Service templates defined:** `swisd-provision.service`, `swisd-supervisor.service`, `swisd-app.service` with strict isolation (`ProtectSystem=strict`, `Restart=always`, pinned supervisor).

## P1 — Supervisor (auto-update mechanics)
- [x] **Local Delivery MVP:** Full local dry-run/live testing of artifact verification and atomic symlink swaps.
- [x] **Cryptographic Verification:** SHA-256 + Ed25519 signature verification pipeline implemented (`verifier.ts`, `mockReleaseGenerator.ts`).
- [x] **Atomic Installer:** `installer.ts` handles safe, atomic symlink promotion and rollback.
- [x] **Watchdog:** App must heartbeat within configurable grace period → else revert to `previous` + restart. Decoupled from HTTP.
- [ ] Periodic GitHub Releases check (`ETag` + jitter).
- [ ] semver compare vs local `VERSION`.

## P1 — USB Provisioning (zero-touch, re-provisionable)
- [x] **Provisioning Contract:** Strict `ProvisionConfig` schema validated. Idempotent application logic defined (`src/provision/apply.ts`).
- [x] **Idempotent Application:** Checksum-verified application of `/swisd-provision.json` via `nmcli`.
- [ ] Scan FAT32/exFAT sticks for `/swisd-provision.json`. *(Pi-specific `udev` implementation)*.
- [ ] **Re-provisioning** on stick insertion.

## P2 — Release & Signing Pipeline (GitHub Actions)
- [x] **CI/CD Workflow:** `.github/workflows/release.yml` triggers on `v*` tags or manual dispatch.
- [x] **Cryptographic Signing:** `scripts/sign-release.ts` signs the tarball using `SWISD_SIGNING_KEY_DER_BASE64` from GitHub Secrets.
- [x] **Artifact Publishing:** Automatically attaches `.tar.gz`, `.sha256`, and `.sig` to the GitHub Release.

## P2 — Swarm-managed update delivery
- [ ] Soft single-checker, manifest gossip via Bloom-filter TTL, P2P bundle seeding, deterministic stagger scheduling.

## Deferred (Pi)
- [ ] Sign the USB provision file. Deep boot-level health gates. Private repo / token releases. Fleet > 30 scaling.