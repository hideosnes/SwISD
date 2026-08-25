### `BACKLOG.md`
# SwISD BACKLOG
The "don't you dare forget" ledger. Split by where the work lives.
Section 1 = the central app (GitHub). Section 2 = the Raspberry Pi delivery machine.

## 🔒 Locked Decisions (reference)
- Repo: **public**, open-source, releases signed.
- Release channels: **single track**.
- Supervisor: **pinned in image**; only the App is OTA-updated.
- Rollback: lightweight 60s heartbeat watchdog + revert; swarm heals organically.
- Fleet: ≤30 devices, <10 Raspis. Stagger window tuned small.
- OS patches: `unattended-upgrades` on.
- Crypto: Ed25519 control-plane (reuse libp2p peer keys) + HMAC-SHA256 data-plane (noise-handshake keys).
- CRDTs: custom, Merkle-DAG structured. Reputation decay computed at **read time**.

---

# SECTION 1 — THE APP (GitHub: `swisd`)

## P0 — Foundation (do first, zero behavioral risk)
- [x] **File restructure — barrel-enforced.** One `index.ts` per module; import only via barrels.
- [x] **Max one-step import depth.** Kill every `../../a/b/c`.
- [x] **Centralized files:** `src/utils.ts`, `src/types.ts`, `src/types.d.ts`, `src/errors.ts`.
- [ ] **Type safety purge.** Remove all `as any`. Align `@libp2p/*` versions. Enforce `strictNullChecks`, `noImplicitAny`, `eslint-plugin-no-any` (build-failing).
- [ ] **De-centralize the architecture.** Remove the elected Gate/coordinator; refactor to the blind model (peers self-select, no global routing tables).
- [ ] **Critical bug fixes:** `peerIdFromString` mock → real `@libp2p/peer-id` import; `require('os')` → ESM `import { cpus }`; add graceful shutdown (SIGINT/SIGTERM).
- [ ] **KokoroManager singleton.** Inject one instance; stop re-instantiating per task.

## P1 — Core decentralized substrate
- [ ] **Custom CRDTs (Merkle-DAG structured):**
  - Peer membership → **OR-Set**
  - Device capabilities → **LWW-Register** (self-attested)
  - Reputation → **append-only event G-Set** + read-time decay
  - Task history → **G-Set** of immutable events
  - Vector DB metadata index → **OR-Map**
- [ ] **Reputation correctness.** Move decay from write-time to read-time (write-time decay is not CRDT-safe). Store signed `(success, latency, timestamp)` events.
- [ ] **Blind propagation + Probabilistic TTL via Bloom Filters** (loop prevention).
- [ ] **Role emergence.** INPUT / WORKER / DIPLOMAT emerge from capabilities — no assignment.
- [ ] **Cryptographic signing:**
  - Ed25519 control-plane: capability reg, reputation events, task results, diplomat msgs.
  - HMAC-SHA256 data-plane: task chunks, model fragments, streams.
- [ ] **Torrent-style task fragmentation** + reassembly.
- [ ] **Immediate preemption** on peer drop.
- [ ] **Error routing** via gossip + neighbor knowledge (no fixed paths).

## P2 — Performance & data
- [ ] **Edge backpressure.** Token bucket + load shedding + load score (0–1). If load > 0.8: reject new tasks + reduce gossip. Combine `stream.send() === false` with app-level queue drop (shed low-priority first).
- [ ] **Health via `@libp2p/ping` + load score.** Replace the custom "MEOW" healthcheck.
- [ ] **Merkle-DAG anti-entropy sync.** Root-hash exchange; fetch only missing/modified branches.
- [ ] **Vector DB — small-swarm mode.** Fully replicated for max recovery.
- [ ] **Hybrid vector DB sync.** Probability race: gossip embeddings vs. direct push.
- [ ] **P2P model distribution.** Kokoro chunked peer-to-peer; Hugging Face strictly fallback/update.

## P3 — Advanced
- [ ] **Diplomat election + inter-swarm routing** (sole cross-swarm bridge).
- [ ] **Update Gossip Protocol (app-level coordination):**
  - Messages: `update_probe_result`, `update_manifest`, `update_schedule`, `update_status`.
  - Deterministic stagger: `delay = FNV1a(peerId || version) % STAGGER_WINDOW`.
  - Downgrade/replay protection via semver comparison.
  - Manifest signed (Ed25519); peers verify against embedded pubkey.
  - P2P bundle seeding coordination (GitHub as fallback seed).
- [ ] **Admin / observability endpoint** (local HTTP, token-guarded).

## Deferred (App)
- [ ] **Vector DB sharding** (large swarms). *Trigger: storage pressure / large swarm.*
- [ ] **Elastic Capacity Allocation** (watermark gossip consensus). *Trigger: replication imbalance.*
- [ ] **Cooperative update scheduling** (negotiated spacing vs. hash-stagger). *Trigger: reboot clustering.*
- [ ] **Multi-channel releases** (beta/stable canary). *Trigger: fleet growth / risky velocity.*
- [ ] **Chaos testing harness.** *Trigger: pre-1.0 hardening.* (GUIDE: deferred to production.)
- [ ] **Refine `TaskHistoryEvent.metadata`** to a strict union of known metadata keys.

---

# SECTION 2 — THE RASPBERRY PIS (image & delivery)

## P0 — The Image (clone-safe)
- [ ] **Base:** Raspberry Pi OS Bookworm (NetworkManager, not legacy wpa_supplicant).
- [ ] **Identity birth (first-boot only):**
  - regenerate `/etc/machine-id`
  - regenerate SSH host keys
  - expand rootfs
  - unique hostname (from CPU serial)
  - **generate fresh libp2p Ed25519 peer identity** → persist to state partition
- [ ] **Filesystem layout:** `/opt/swisd/{releases, current, previous, state, supervisor}`. Keep `state/` **outside** `releases/` so updates never wipe CRDT ledger / identity.
- [ ] **Embed Ed25519 PUBLIC key** for release verification.

## P0 — systemd services
- [ ] `swisd-provision.service` (one-shot): identity birth + USB provisioning.
- [ ] `swisd-supervisor.service`: updater daemon (pinned).
- [ ] `swisd-app.service`: the swarm app (`Restart=always`).
- [ ] Enable `unattended-upgrades` for OS security patches.

## P1 — Supervisor (auto-update mechanics)
- [ ] Periodic GitHub Releases check (`ETag` + jitter; conditional requests).
- [ ] semver compare vs local `VERSION`.
- [ ] Download → SHA-256 verify → **Ed25519 signature verify** (reject on any mismatch).
- [ ] Unpack to `/opt/swisd/releases/<ver>`; **atomic symlink swap** `current -> releases/<ver>`.
- [ ] Restart `swisd-app.service`.
- [ ] **Watchdog:** app must heartbeat within 60s → else revert to `previous` + restart.
- [ ] Supervisor stays pinned; does **not** self-update.
- [ ] Consumes the scheduled update time from the App's Update Gossip Protocol.

## P1 — USB Provisioning (zero-touch, re-provisionable)
- [ ] Scan FAT32/exFAT sticks for `/swisd-provision.json`.
- [ ] Apply: **wifi** (via `nmcli`), **role**, **model source** (e.g. HF link), other config.
- [ ] Versioned schema, idempotent, persist locally; ignore stick once applied.
- [ ] **Re-provisioning** on stick insertion (not just first boot).
- [ ] Proposed schema:
  ```json
  {
    "wifi": { "ssid": "…", "psk": "…", "country": "DE" },
    "role": "auto | input | worker",
    "modelSource": { "type": "hf", "url": "https://huggingface.co/…" },
    "version": 1
  }
  ```

## P2 — Release & Signing Pipeline (GitHub Actions)
- [ ] On tag push: build tarball → SHA-256 → **Ed25519 sign** (private key in CI secrets ONLY).
- [ ] Publish `swisd-<ver>.tar.gz` + `.sha256` + `.sig`.
- [ ] Single track.

## P2 — Swarm-managed update delivery (runs on the App; installs via Supervisor)
- [ ] Soft single-checker (listen for `update_probe_result` before probing GitHub).
- [ ] Manifest gossip via Bloom-filter TTL.
- [ ] P2P bundle seeding (torrent-style; GitHub fallback seed; per-chunk HMAC).
- [ ] Deterministic stagger scheduling + `update_schedule` gossip.
- [ ] `update_status` gossip; organic healing of peers that fail to return.

## Deferred (Pi)
- [ ] **Sign the USB provision file.** *Trigger: any device leaves a trusted network.* (Physical-access attack surface.)
- [ ] **Deep boot-level health gates** (beyond heartbeat). *Trigger: repeated silent bad-deploys.*
- [ ] **Private repo / token releases.** *Trigger: SwISD goes closed-source.*
- [ ] **Fleet > 30 scaling** (stagger window tuning, vector sharding). *Trigger: growth.*