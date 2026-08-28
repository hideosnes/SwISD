<!--
1. Relative path: CRDT.md
2. Description: The mathematical foundation for SwISD's custom Merkle-DAG structured CRDTs and content-addressed skeleton.
3. Expects: Strict adherence to join-semilattice properties and domain-separated hashing.
4. Provides: Formal proofs of convergence, concrete type mappings, and anti-entropy sync mechanics.
-->
# CRDT & Merkle-DAG Mathematical Foundation

## CRDT: The Join-Semilattice
A CRDT is, at its core, a data type whose replicas are guaranteed to converge without coordination because its merge operation is *mathematically incapable of producing a conflict*. The formal bedrock is the **join-semilattice**: a partially ordered set (S, ⊑) in which every pair of elements a, b ∈ S possesses a unique **least upper bound** (LUB), written a ⊔ b and called the *join*. Three laws fall out of this definition and define everything that follows: **commutativity** (a ⊔ b = b ⊔ a), **associativity** ((a ⊔ b) ⊔ c = a ⊔ (b ⊔ c)), and **idempotence** (a ⊔ a = a). These laws mean the result of merging is independent of message order, duplication, and grouping — which is precisely the chaos of a blind, churn-prone swarm.

A state-based CRDT (CvCRDT) is formally a tuple (S, s⁰, q, u, m). The state space S is a join-semilattice with a bottom element ⊥; the initial state is s⁰ = ⊥; q is a set of query functions reading the payload; u is a set of update functions that must be **inflationary** (monotonic), meaning ∀s: s ⊑ u(s); and the merge function is simply m(a, b) = a ⊔ b. The **convergence theorem** states that once every update has been applied somewhere and every merge has propagated, all replicas agree. *Proof:* because updates are inflationary, each replica's state only ascends; because merge is the LUB, absorbing a neighbor's state can only move a replica upward to include all information it carries; therefore every replica monotonically approaches the join of the entire update history. Since ⊔ is commutative, associative, and idempotent, that final join is a unique fixed point independent of delivery order. When the network eventually delivers all messages (the only assumption CRDTs make), all replicas land on it. ∎

### Concrete Types in SwISD
- **G-Counter:** Holds a vector v ∈ ℕⁿ. Merge is pointwise max.
- **G-Set:** Merged by union (a ⊔ b = a ∪ b). Grows monotonically. Ideal for immutable task history.
- **OR-Set:** Stores pairs (e, u) where u is a fresh unique tag. Yields deterministic **add-wins** semantics. Used for peer membership.
- **LWW-Register:** Stores (v, t). Merge returns the pair with the larger t. Correct only for **single-writer** data. Used for self-attested `CapabilityManifests`.

### The Reputation Refactor (Read-Time Decay)
Applying decay at write time (score′ = score · γ) violates the inflationary requirement and is non-idempotent. The repair is to stop mutating and start projecting. Store reputation as an **append-only G-Set of signed events** L = {(outcomeₖ, latencyₖ, tₖ)}. Define the score as a pure function evaluated at read time:
`score(now) = [ Σₖ outcomeₖ · γ^(now − tₖ) ] / [ Σₖ γ^(now − tₖ) ]`
The log only grows, the merge is union, and decay becomes a deterministic function of (log, now). Convergence is preserved.

---

## Merkle-DAG: The Content-Addressed Skeleton
A Merkle-DAG lets SwISD peers prove, sync, and reassemble data without trusting each other. The primitive is a **cryptographic hash function** H with preimage resistance, second-preimage resistance, and collision resistance. 

### Integrity Amplification & Inclusion Proofs
Modifying any single bit changes the root. Same root ⟹ same content. 
The **Merkle inclusion proof** lets you prove a single chunk belongs to a root by transmitting only the O(log n) audit path of siblings, not the dataset. This is the mechanism behind torrent-style fragment validation.

### Anti-Entropy Sync
When peers reconnect, they exchange **root hashes**. If they differ, they **recursively descend** and transfer *only* missing or modified branches. Bandwidth drops from O(n) to O(d · log n).

### Crucial Crypto Distinction (Integrity vs. Authenticity)
- **Merkle Integrity (Control-Plane):** Requires a plain collision-resistant hash (SHA-256 or BLAKE3). Proves the content hasn't been altered. Uses domain separation: `H(0x00 ∥ block)` for leaves, `H(0x01 ∥ left ∥ right)` for internal nodes.
- **HMAC Authenticity (Data-Plane):** Requires a keyed MAC (HMAC-SHA256). Proves the chunk came from someone holding the shared noise-handshake key. 
*Do not conflate them.* Hash the chunk into the DAG for integrity; HMAC it for source authentication on the wire.

### Pitfalls to Avoid
1. **Domain Separation:** Always prefix leaves and internal nodes differently to prevent second-preimage attacks.
2. **Real Hashes:** SHA-256 or BLAKE3 only. Never MD5/SHA-1.
3. **Acyclic Construction:** Content-addressing enforces this naturally.
4. **Garbage Collection:** Unreachable nodes accumulate. Implement a pruning policy to prevent edge-device storage exhaustion.

> **Takeaway:** A Merkle-DAG turns content into self-verifying, shareable, diffable fingerprints — so blind peers can prove membership, sync only differences, and reassemble tasks without ever trusting a coordinator.