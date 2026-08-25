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
- [ ] **Reputation correctness.** Move decay from write-time to read-time. Store signed `(success, latency, timestamp)` events.
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
- [x] **Admin / observability endpoint.** Local HTTP/SSE token-guarded endpoint + "Conductor's Podium" Vanilla JS GUI.
- [x] **Dual-Audience API Boundary.** `SwISDClient` exposed as the public `npm` API, wrapping the headless engine and optional GUI.

## Deferred (App)
- [ ] **Vector DB sharding** (large swarms). *Trigger: storage pressure / large swarm.*
- [ ] **Elastic Capacity Allocation** (watermark gossip consensus). *Trigger: replication imbalance.* (Foundation built in `src/storage/capacity.ts`).
- [ ] **Stateful Performance Orchestration.** Conductor-side buffering, beat-keeping, and glitch-recovery for continuous live streams. *Trigger: postmodern classical music performance requirements.*
- [ ] **Cooperative update scheduling** (negotiated spacing vs. hash-stagger). *Trigger: reboot clustering.*
- [ ] **Multi-channel releases** (beta/stable canary). *Trigger: fleet growth / risky velocity.*
- [ ] **Chaos testing harness.** *Trigger: pre-1.0 hardening.*
- [ ] **Refine `TaskHistoryEvent.metadata`** to a strict union of known metadata keys.

---

# SECTION 2 — THE RASPBERRY PIS (image & delivery)

## P0 — The Image (clone-safe)
- [ ] **Base:** Raspberry Pi OS Bookworm (NetworkManager, not legacy wpa_supplicant).
- [ ] **Identity birth (first-boot only):** regenerate `/etc/machine-id`, SSH host keys, expand rootfs, unique hostname, generate fresh libp2p Ed25519 peer identity → persist to state partition.
- [ ] **Filesystem layout:** `/opt/swisd/{releases, current, previous, state, supervisor}`. Keep `state/` outside `releases/`.
- [ ] **Embed Ed25519 PUBLIC key** for release verification.

## P0 — systemd services
- [ ] `swisd-provision.service` (one-shot): identity birth + USB provisioning.
- [ ] `swisd-supervisor.service`: updater daemon (pinned).
- [ ] `swisd-app.service`: the swarm app (`Restart=always`).
- [ ] Enable `unattended-upgrades` for OS security patches.

## P1 — Supervisor (auto-update mechanics)
- [ ] Periodic GitHub Releases check (`ETag` + jitter).
- [ ] semver compare vs local `VERSION`.
- [ ] Download → SHA-256 verify → Ed25519 signature verify.
- [ ] Unpack to `/opt/swisd/releases/<ver>`; atomic symlink swap.
- [ ] Restart `swisd-app.service`.
- [ ] **Watchdog:** app must heartbeat within 60s → else revert to `previous` + restart.
- [ ] Supervisor stays pinned; does not self-update.

## P1 — USB Provisioning (zero-touch, re-provisionable)
- [ ] Scan FAT32/exFAT sticks for `/swisd-provision.json`.
- [ ] Apply: wifi (via `nmcli`), role, model source, other config.
- [ ] Versioned schema, idempotent, persist locally; ignore stick once applied.
- [ ] **Re-provisioning** on stick insertion.

## P2 — Release & Signing Pipeline (GitHub Actions)
- [ ] On tag push: build tarball → SHA-256 → Ed25519 sign (private key in CI secrets ONLY).
- [ ] Publish `swisd-<ver>.tar.gz` + `.sha256` + `.sig`.

## P2 — Swarm-managed update delivery
- [ ] Soft single-checker, manifest gossip via Bloom-filter TTL, P2P bundle seeding, deterministic stagger scheduling.

## Deferred (Pi)
- [ ] Sign the USB provision file. Deep boot-level health gates. Private repo / token releases. Fleet > 30 scaling.