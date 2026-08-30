<!--
1. Relative path: GUIDE.md
2. Description: The core architectural philosophy, network topology, and strict development standards for the SwISD swarm.
3. Expects: Adherence from all contributors; serves as the north star for design decisions.
4. Provides: Exhaustive documentation of the polymorphic render swarm, crypto tiers, Conductor Cockpit bridge, and UX philosophy.
-->

# SwISD Decentralized AI Swarm Network

## 1. Core Philosophy & Vision
SwISD is a decentralized, agentoid P2P network for distributed AI inference. It operates without central coordinators, relying on neighborhood propagation, dynamic swarm specialization, and torrent-like workload sharing. Resilience and reliability are the absolute highest priorities.

**The Polymorphic Render Swarm:** SwISD is a Capability-Aware, Polymorphic Render Swarm. The ingress is blind, the egress is a targeted tunnel, the agents are beautifully dumb (stateless), and the ingestion is so polite it reads the 'room' (adapting polymorphically to Node.js and Browser inputs).

**Domain C — The Conductor Cockpit:** The operator-facing control surface is a separate architectural domain. It does not become the coordinator. It observes, provisions, and directs through the same strict capability contracts used by the swarm. The cockpit hides complexity without removing cryptographic correctness.

## 2. Network Topology & Swarm Dynamics
- **Swarm Formation:** Peers form swarms via local network proximity (WiFi) or agentoid single-worker bootstrapping. Swarms organically "specialize" based on the aggregated capabilities and knowledge topics of their constituent peers.
- **Blind Propagation & Routing:** Peers operate in a "blind" manner, knowing only their immediate neighbors. Global routing tables do not exist. Routing and ledgers are strictly localized within the swarm.
- **Loop Prevention:** Implement Probabilistic TTL via Bloom Filters. Attach a Bloom filter of visited peer IDs to propagated messages. If a peer sees its ID in the filter, it drops the message. This prevents infinite loops in blind topologies.
- **The "Diplomat" Role:** For inter-swarm communication, specific peers are elected as "Diplomats". Diplomats maintain connections to Diplomats of other swarms, acting as the sole bridge for cross-swarm knowledge and task routing.

## 3. Distributed State & Data (No Central DB)
- **Ledger & State:** Utilize custom, Merkle-DAG structured CRDTs for eventual consistency. The ledger grows organically based on usage scenarios.
- **Two-Tier Diary Architecture:** 
  - *Control Ledger:* Fully replicated across all peers. Contains CRDT metadata (membership, capabilities, reputation logs, task routing). Must remain small.
  - *Data Payloads:* Sharded across the swarm based on capability-driven storage limits. Indexed by the Control Ledger's OR-Map.
- **Sync Mechanism:** Merkle-DAG Sync with Anti-Entropy. Reconnecting peers exchange Merkle root hashes of their local segments. If roots differ, they recursively descend and fetch *only* the missing/modified branches (O(d · log n) bandwidth), like Git/IPFS.

## 4. Task Execution & AI Workloads
- **Capability-Aware Routing:** The swarm does not route blindly to hardware; it routes to *software capabilities*. Peers advertise their `supportedExecutors` in the Control Ledger (LWW-Register). The swarm only routes an `ExecutionPayload` to peers that explicitly advertise the required executor module.
- **Torrent-Style Fragmentation:** Large AI tasks/models are dynamically split into 256KB chunks. Each chunk is hashed into a Merkle tree (control-plane integrity) and HMAC-SHA256 signed (data-plane authenticity). Chunks are distributed for parallel execution/reassembly.
- **Polymorphic Ingestion:** The API abstracts data sources into a strict `AsyncIterable<Uint8Array>`. Whether the data comes from a Node.js filesystem (Coder) or an HTTP multipart stream (Artist GUI), the engine politely chunks it into the Merkle-DAG without memory bloat.
- **Direct Egress Tunnel:** While ingress and state are blind, egress is targeted. The `ExecutionPayload` includes a `returnAddress`. Executing peers open a direct, encrypted libp2p stream back to the Conductor to push results, preventing blind-gossip bandwidth choking.
- **Stateless Agents & The Conductor:** The swarm agents are beautifully dumb and stateless. The Conductor (the operator's laptop/GUI) handles stateful orchestration, buffering, and glitch-recovery for continuous streams (like live audio).
- **Immediate Preemption:** If a peer executing a critical task drops, the task is immediately preempted and reassigned to the next available peer. Swarms adapt instantly to churn.

## 5. Performance, Crypto & Edge Constraints
- **Blazing Fast Cryptography (Two-Tier):**
  - *Control-Plane (Integrity & Identity):* Asymmetric keys (Ed25519) via native Node.js `crypto` for handshakes and CRDT signing. Plain collision-resistant hashes (SHA-256 / BLAKE3) for Merkle-DAG structural integrity.
  - *Data-Plane (Authenticity):* Symmetric keys (HMAC-SHA256) derived from the libp2p noise handshake for per-chunk source authentication on high-throughput streams. *Note: Merkle hashes prove content integrity; HMAC proves the chunk came from a trusted source.*
- **Edge-Native Backpressure (Raspi 4/5 Focus):** Implement Token Bucket Rate Limiting + Load Shedding. Peers maintain a "load score" (0-1). If load > 0.8, they reject new tasks and reduce gossip frequency. Combine libp2p's native stream backpressure (`stream.send() === false`) with application-level task queue dropping.

## 6. Strict Development Standards
- **Type Safety (Crystal Clear):**
  - **NO `any`. Ever.**
  - Enforce `strictNullChecks`, `noImplicitAny`, and `eslint-plugin-no-any` with build-failing severity.
  - Use TypeScript to its absolute limits. Types must be explicit, exhaustive, and strictly enforced.
- **File Structure & Barrel Files:**
  - *Barrel Enforcement:* Every script/feature must be registered via an `index.ts` and imported *only* via `index.ts`.
  - *Import Depth:* Maximum one step deep for imports. Deep imports (e.g., `../../a/b/c`) are strictly forbidden.
  - *Centralized Files:* Maintain strict centralization for shared resources (`src/utils.ts`, `src/types.ts`, `src/types.d.ts`, `src/errors.ts`).
  - **File Header Requirement:** Every single file must begin with a 4-point comment block on line 1: (1) relative path, (2) description, (3) expected data, (4) provided data.
- **Domain C Frontend Stack:**
  - Svelte 5 (Runes/Snippets) + SvelteKit 2 Node adapter + TailwindCSS.
  - The SvelteKit server is the BFF and the only process allowed to touch the headless SwISD core.
  - Browser code must consume typed HTTP APIs and DTOs only. Server-only core modules must never be imported into client components.
  - **Offline Resilience:** All typography (`@fontsource/*`) is bundled locally via Vite. The cockpit must render perfectly even if the edge device has no outbound internet access.
- **Dual-Audience API Design:**
  - SwISD exposes a headless, strictly typed `SwISDClient` for developers (the `npm` interface).
  - It bundles an optional local Observability GUI (The Conductor's Podium) for non-technical operators. Both compile down to the exact same `ExecutionPayload`.
- **Resilience Mindset:**
  - Assume peers will disconnect at any moment. Code must handle immediate preemption and reassignment gracefully.
  - Chaos testing is deferred to production, but the architecture must be inherently fault-tolerant by design.

## 7. Delivery & Update Mechanism (Boring, Atomic, Observable)
- **Stateless Releases, Persistent State:** The application binary lives in disposable `<deliveryRoot>/releases/<version>`, while identity, CRDTs, and configuration live strictly in `<deliveryRoot>/state`, surviving all updates and rollbacks.
- **Cryptographic Verification:** Every release artifact is verified via SHA-256 (integrity) and Ed25519 (authenticity) before installation.
- **Atomic Swaps & Watchdog:** Updates are applied via atomic symlink swaps (`current` / `previous`). A decoupled, non-HTTP watchdog monitors a filesystem heartbeat; if the app stalls, it automatically reverts to `previous` and restarts.

## 8. AI Model Distribution (The Heavy Payloads)
- **Filesystem Separation:** The application binary lives in `<deliveryRoot>/releases/`, while heavy AI model weights live strictly in `<deliveryRoot>/models/<model-id>/`. Models are cacheable data, not disposable code.
- **Capability-Driven Pull (The Lazy Swarm):** Models are pulled *only* when a node's `ExecutorRegistry` advertises the required capability and the swarm has tasks demanding it. Nodes do not blindly download every model.
- **Two-Tier Distribution:** 
  - *Tier 1 (Ingress):* The Conductor or a designated "Seed" Pi downloads the model from HuggingFace, chunks it into 256KB blocks, computes the Merkle root, and signs the `ModelManifest`.
  - *Tier 2 (Swarm):* Worker Pis request chunks via the `ChunkLocationLedger`, opening parallel libp2p streams to pull directly from neighbors (micro-torrent style).
- **Storage Watermarks & Eviction:** When the models directory exceeds a configured disk watermark, the `ModelManager` triggers an LRU (Least Recently Used) eviction, deleting chunks of the least recently executed models.

## 9. User Experience & The Conductor Cockpit (Domain C)
- **Complexity Hidden, Not Removed:** The user never sees a Merkle root or Bloom filter, but every UI action is cryptographically verified and atomically swapped under the hood.
- **Domain C Boundary:** The Conductor Cockpit is a SvelteKit 2 BFF. The server process hosts the headless SwISD core; the browser is a strictly typed reactive client. This keeps the swarm core isolated from UI churn and prevents accidental leakage of server-only state.
- **Server-Side Core Bridge:**
  - The SwISD core is initialized exactly once as a Node-side singleton.
  - `src/hooks.server.ts` injects the core into SvelteKit `event.locals`.
  - API routes access the core only through the typed `locals.swisd` boundary.
  - Core responses are mapped to explicit DTOs before being serialized to the client.
- **Client Contract:**
  - The frontend uses Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) for local reactive state.
  - The frontend fetches typed endpoints such as `GET /api/snapshot`.
  - The client never imports server modules, core engines, Node builtins, or libp2p internals.
  - All unknown network failures are narrowed from `unknown`, never typed as `any`.
- **Phase 1 Reference Implementation:**
  - `src/routes/api/snapshot/+server.ts` serves a strict swarm snapshot DTO.
  - `src/routes/+layout.svelte` provides the cockpit shell.
  - `src/routes/+page.svelte` renders live snapshot state using Svelte 5 runes.
- **Genesis Bootstrap Protocol:** When a Pi boots without a known network, it falls back to a hardcoded `SwISD-Genesis` Access Point. The Conductor (laptop) acts as the hotspot, providing a local link for discovery and provisioning without requiring internet or a router.
- **Cryptographic Trust Boundary:** Discovery (via mDNS or Genesis WiFi) is purely advisory. A newly discovered peer is placed in a `PENDING` state within the core's `TrustRegistry`. The operator must explicitly "Trust" the peer's Ed25519 identity via the Cockpit before it is allowed to participate in CRDT gossip or receive tasks/models.
- **mDNS Auto-Discovery:** The core engine broadcasts its Admin API via `_swisd._tcp.local` using `bonjour-service`, exposing `peerId`, `role`, and `version` in TXT records. The SvelteKit BFF listens for these broadcasts, maintains a garbage-collected map of `DiscoveredNode` DTOs, and exposes them via `GET /api/discovery`. The cockpit renders these in a reactive `DiscoveryPanel`.
- **Out-of-Box Setup Portal:** If a Pi boots without a network or USB provision, it falls back to broadcasting a temporary `SwISD-Setup-XXXX` Access Point. A captive portal allows users to inject WiFi credentials via smartphone.
- **Drag-and-Drop Ingestion:** The Conductor UI allows users to drag local `.gguf` model files directly into the browser. The Polymorphic Ingestion Engine chunks and seeds them to the swarm without choking browser memory.
- **Visual Swarm Topology:** The dashboard renders an interactive node-graph of the swarm, color-coded by `CapabilityManifest`, showing real-time model distribution progress and node health.

### Domain C Design System (The Single-Source Doctrine)

The Conductor Cockpit's visual language is governed by exactly three coordinated sources of truth. Nothing else.

1. **`layout.css` — the Theme Conductor.**
   The single CSS entry point, imported by `+layout.svelte` as `./layout.css`. It imports the themes
   barrel, declares shared (regime-independent) tokens, projects tokens into Tailwind via `@theme inline`,
   and owns the layered base/component styles. Every design token resolves through this file.

2. **`lib/themes/` — the Theme Folder Doctrine.**
   One file per regime (`midnight.css`, `daylight.css`, `cyberdeck.css`, `ultraviolet.css`), registered
   in the folder's CSS barrel (`index.css`), which `layout.css` imports in a single step. Theme files are
   bundled at build time — runtime fetching of theme CSS is forbidden (offline resilience). Each theme
   file declares ONLY custom properties and `color-scheme` on `:root` (default) or `[data-theme='<id>']`
   selectors. Never element styles — the Cascade Layer Doctrine travels with the folder.
   - The default regime (`midnight`) owns the bare `:root` selector so the cockpit renders correctly
     with no JavaScript.
   - Other regimes use bare `[data-theme='<id>']` selectors so they apply globally when set on `<html>`
     and *locally* when set on a preview subtree (used by `/settings` for live token-scoped previews).
   - Adding a new regime costs: one CSS file, one barrel line, one registry entry in `lib/theme.ts`,
     one whitelist entry in `app.html`.

3. **`components/ui` — the Primitive Source of Truth.**
   All visual atoms (buttons, cards, pills, inputs, modals, drawers, progress rings, status indicators,
   typography blocks, theme toggle) are composed primitives exported from `components/ui`.

**The Law: "No UI element stands alone."**
Feature components NEVER invent new visual atoms and NEVER apply raw styles. They only
compose primitives from `components/ui`, styled exclusively via tokens from `layout.css`.
If a visual pattern appears more than once, it MUST be promoted to a primitive. This makes
drift impossible and theming trivial. Violating this is a build-level sin.

**Supporting Doctrine (enforced in `SVELTE.md`):**
- **Cascade Layer Doctrine:** All custom CSS lives in `@layer base` or `@layer components`. Unlayered styles are forbidden — they murder `@layer utilities` silently.
- **Borders as Theme Opinions:** `--border` is `transparent` by default. Separation is surface mass, not hairlines. Regimes that prefer hairlines (e.g. Cyberdeck) turn them on via token.
- **Primitive Ignorance:** Primitives never check the active regime. They drink tokens; the regime supplies the values.
- **No `tailwind-merge`/`cn()`:** Variance is exposed via typed `$props()`, never raw `class` overrides.

### Multi-Theme Regimes & Persistence

- **Active regime** is persisted per-device in `localStorage` under `swisd-theme`.
- **Last dark regime** is persisted under `swisd-theme-dark` so the shell's quick-flip toggle can restore the operator's preferred dark theme when flipping back from light.
- **Zero-flash bootstrap:** A pre-hydration script in `app.html` applies the whitelisted `data-theme` attribute before first paint, migrating legacy `dark`/`light` values.
- **Shared reactive store:** `lib/theme.svelte.ts` exports `themeStore`, the single client-side source of truth consumed by both the shell's `ThemeToggle` and the `/settings` gallery. Primitives remain regime-ignorant.