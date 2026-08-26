# SwISD Decentralized AI Swarm Network

## 1. Core Philosophy & Vision
SwISD is a decentralized, agentoid P2P network for distributed AI inference. It operates without central coordinators, relying on neighborhood propagation, dynamic swarm specialization, and torrent-like workload sharing. Resilience and reliability are the absolute highest priorities.

**The Polymorphic Render Swarm:** SwISD is a Capability-Aware, Polymorphic Render Swarm. The ingress is blind, the egress is a targeted tunnel, the agents are beautifully dumb (stateless), and the ingestion is so polite it reads the 'room' (adapting polymorphically to Node.js and Browser inputs).

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