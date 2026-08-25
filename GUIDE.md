# SwISD Decentralized AI Swarm Network

## 1. Core Philosophy & Vision
SwISD is a decentralized, agentoid P2P network for distributed AI inference. It operates without central coordinators, relying on neighborhood propagation, dynamic swarm specialization, and torrent-like workload sharing. Resilience and reliability are the absolute highest priorities.

## 2. Network Topology & Swarm Dynamics
- **Swarm Formation:** Peers form swarms via local network proximity (WiFi) or agentoid single-worker bootstrapping. Swarms organically "specialize" based on the aggregated capabilities and knowledge topics of their constituent peers.
- **Blind Propagation & Routing:** Peers operate in a "blind" manner, knowing only their immediate neighbors. Global routing tables do not exist. Routing and ledgers are strictly localized within the swarm.
- **Loop Prevention (Recommendation):** Implement Probabilistic TTL via Bloom Filters. Instead of rigid hop-counts, attach a Bloom filter of visited peer IDs to propagated messages. If a peer sees its ID in the filter, it drops the message. This is highly reliable, novel, and prevents infinite loops in blind topologies.
- **The "Diplomat" Role:** For inter-swarm communication, specific peers are elected as "Diplomats". Diplomats maintain connections to Diplomats of other swarms, acting as the sole bridge for cross-swarm knowledge and task routing.

## 3. Distributed State & Data (No Central DB)
- **Ledger & State:** Utilize CRDTs (Conflict-free Replicated Data Types) for eventual consistency. The ledger grows organically based on usage scenarios.
- **Hybrid Vector Database:**
  - *Small Swarms:* Fully replicated across all peers for maximum recovery probability.
  - *Large Swarms:* Sharded across peers.
- **Sync Mechanism:** A dynamic probability race between gossiping embeddings to the swarm vs. pushing directly to available peers, optimizing for reconstruction probability.
- **Dynamic Storage Limits (Recommendation):** Implement Elastic Capacity Allocation. Peers broadcast available storage. The swarm calculates a target replication factor via gossip consensus on "watermarks," dynamically adjusting individual peer storage limits based on total swarm topology.
- **State Recovery (Recommendation):** Use Merkle-DAG Sync with Anti-Entropy. Reconnecting peers exchange Merkle root hashes of their local CRDT/Vector DB segments with neighbors, downloading only missing/modified branches (like Git/IPFS) to minimize bandwidth.

## 4. Task Execution & AI Workloads
- **Torrent-Style Fragmentation:** Large AI tasks are dynamically split into chunks and distributed across multiple peers for parallel execution, then reassembled. Workload sharing adapts dynamically, driving swarm specialization over time.
- **P2P Model Distribution:** AI models (e.g., Kokoro) are distributed peer-to-peer in chunks. Hugging Face is used strictly as a fallback and for model updates.
- **Immediate Preemption:** If a peer executing a critical task drops, the task is immediately preempted and reassigned to the next available peer. Swarms adapt instantly to churn.
- **Error Routing:** Errors are routed back via gossip and direct neighbor knowledge, relying on emerging network topologies rather than fixed paths.

## 5. Performance, Crypto & Edge Constraints
- **Blazing Fast Cryptography:**
  - *Handshake/Metadata:* Asymmetric keys (Ed25519).
  - *High-Throughput Streams:* Symmetric keys (HMAC-SHA256) for per-chunk validation to ensure blazing-fast throughput.
- **Edge-Native Backpressure (Raspi 4/5 Focus):** (Recommendation) Implement Token Bucket Rate Limiting + Load Shedding. Peers maintain a "load score" (0-1). If load > 0.8, they reject new tasks and reduce gossip frequency. Combine libp2p's native stream backpressure (`stream.send() === false`) with application-level task queue dropping (shedding low-priority tasks first).

## 6. Strict Development Standards
- **Type Safety (Crystal Clear):**
  - **NO `any`. Ever.**
  - Enforce `strictNullChecks`, `noImplicitAny`, and `eslint-plugin-no-any` with build-failing severity.
  - Use TypeScript to its absolute limits. Types must be explicit, exhaustive, and strictly enforced.
- **File Structure & Barrel Files:**
  - *Barrel Enforcement:* Every script/feature must be registered via an `index.ts` and imported only via `index.ts`.
  - *Import Depth:* Maximum one step deep for imports. Deep imports (e.g., `../../a/b/c`) are strictly forbidden.
  - *Centralized Files:* Maintain strict centralization for shared resources:
    - `src/utils.ts` (Single large utility file)
    - `src/types.ts` (Shared runtime types/interfaces)
    - `src/types.d.ts` (Global ambient type declarations)
    - `src/errors.ts` (Centralized error texts and custom error classes)
  - *File Header Requirement:* Every file must begin with a 4-point comment block: (1) relative path, (2) description, (3) expected data, (4) provided data.
- **Resilience Mindset:**
  - Assume peers will disconnect at any moment. Code must handle immediate preemption and reassignment gracefully.
  - Chaos testing is deferred to production, but the architecture must be inherently fault-tolerant by design.