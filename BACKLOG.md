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
- [ ] **Reputation correctness.** Move decay from write-time to read-time. Store signed `(success, latency, timestamp)` events. *(Foundation laid in `src/crdt/reputation.ts`)*
- [x] **Blind propagation + Probabilistic TTL via Bloom Filters** (loop prevention).
- [x] **Role emergence foundation.** INPUT / WORKER / DIPLOMAT emerge from capabilities. Storage sharding is capability-driven, not role-assigned.
- [x] **Torrent-style task fragmentation + reassembly.** 256KB chunks, HMAC data-plane validation, Merkle control-plane integrity.
- [x] **Agnostic Execution Framework.** `ExecutorRegistry` and `CapabilityManifest` for software-aware routing.
- [ ] **Capability-Aware Gossip Router.** Filter Bloom filters and route `ExecutionPayload` based on `supportedExecutors`.
- [ ] **Direct Egress Tunnel.** Implement libp2p stream protocol (`/swisd/egress/1.0.0`) for peers to push results directly to the Conductor.
- [ ] **Immediate preemption** on peer drop.
- [ ] **Error routing** via gossip + neighbor knowledge (no fixed paths).

## P2 — Performance & data
- [ ] **Edge backpressure.** Token bucket + load shedding + load score (0–1). If load > 0.8: reject new tasks + reduce gossip.
- [ ] **Health via `@libp2p/ping` + load score.** Replace the custom "MEOW" healthcheck.
- [x] **Merkle-DAG anti-entropy sync foundation.** Root-hash exchange; `reconcileDag` fetches only missing/modified branches.
- [x] **Two-Tier Diary Storage.** Control Ledger (fully replicated CRDT metadata) + Sharded Payload Store (capability-driven, indexed by Control Ledger).
- [x] **Polymorphic Ingestion Engine.** `AsyncIterable<Uint8Array>` abstraction for Node/Browser file chunking.
- [ ] **Hybrid vector DB sync.** Probability race: gossip embeddings vs. direct push.
- [x] **P2P model distribution foundation.** `ChunkLocationLedger` and `buildChunkRoutingTable` for parallel micro-torrent downloads.

## P3 — Advanced
- [ ] **Diplomat election + inter-swarm routing** (sole cross-swarm bridge).
- [ ] **Update Gossip Protocol (app-level coordination):** Messages, deterministic stagger, downgrade protection, P2P bundle seeding.
- [x] **Admin / observability endpoint.** Local HTTP/SSE token-guarded endpoint + "Conductor's Podium" Vanilla JS GUI. *(Legacy baseline; Domain C Svelte cockpit is the target.)*
- [x] **Dual-Audience API Boundary.** `SwISDClient` exposed as the public `npm` API, wrapping the headless engine and optional GUI.

## P4 — Model Distribution & Heavy Payloads (The New Frontier)
- [ ] **Model Manifest CRDT:** Define `ModelManifest` (Merkle root, required capability, chunk map) in the Control Ledger.
- [ ] **Local Model Manager:** Build `src/models/manager.ts` for downloading, chunking, Merkle verification, and LRU cache eviction in `/opt/swisd/models/`.
- [ ] **P2P Chunk Seeding:** Implement libp2p stream handler (`/swisd/model/1.0.0`) for serving requested model chunks to neighboring peers (micro-torrent layer).
- [ ] **Storage Watermarks & Eviction:** Implement LRU eviction policy when `/opt/swisd/models/` exceeds configured disk watermark.

## P5 — User Experience & The Conductor Cockpit (Domain C)
- [x] **Domain C Phase 1 — Conductor bridge:** Svelte 5 + SvelteKit 2 Node adapter BFF scaffold, strict TypeScript ESM, TailwindCSS, barrel imports, max one-step import depth, and 4-point file headers.
- [x] **Domain C Phase 1 — Core injection:** Headless SwISD core singleton is initialized server-side and injected into `event.locals` via `src/hooks.server.ts`.
- [x] **Domain C Phase 1 — Snapshot API:** `GET /api/snapshot` returns a strictly typed `SwarmSnapshot` DTO from the core.
- [x] **Domain C Phase 1 — Rune dashboard shell:** `src/routes/+layout.svelte` and `src/routes/+page.svelte` consume the snapshot using Svelte 5 `$state` and `$derived`.
- [ ] **Modern Dashboard UI:** Replace vanilla JS `dashboardHtml.ts` with compiled, auto-discovering SPA visualizing swarm topology and model distribution.
  - [ ] Interactive node-graph color-coded by `CapabilityManifest`.
  - [ ] Real-time model distribution progress and node health.
  - [ ] Live peer churn, load score, and executor capability panels.
  - [ ] Cryptographic verification indicators hidden behind operator-friendly status states.
- [ ] **Out-of-Box Setup Portal:** Build fallback AP mode and captive portal wizard in `src/provision/` for monitor-less, USB-less initial WiFi provisioning.
  - [ ] Temporary `SwISD-Setup-XXXX` access point fallback.
  - [ ] Smartphone-friendly captive portal for WiFi credential injection.
  - [ ] Idempotent handoff from setup portal to normal swarm operation.
- [ ] **Drag-and-Drop Ingestion:** Build Conductor-side CLI/UI wrapper to ingest local `.gguf` files, chunk them, and seed them to the swarm without browser memory limits.
  - [ ] Browser-safe `AsyncIterable<Uint8Array>` upload abstraction.
  - [ ] Streaming chunking into the Polymorphic Ingestion Engine.
  - [ ] Manifest generation and swarm seeding progress visualization.
- [ ] **mDNS Auto-Discovery:** Implement `_swisd._tcp.local` broadcasting and listening for zero-config Conductor-to-Node pairing.
  - [ ] Conductor discovery of local swarm nodes.
  - [ ] Pairing state machine for trusted local links.
  - [ ] UI surface for discovered nodes and setup status.

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