/**
 * 1. Relative path: src/crdt/merkle.ts
 * 2. Description: Merkle-DAG primitives with domain-separated hashing for structural integrity and anti-entropy sync.
 * 3. Expects: Uint8Array payloads and child links.
 * 4. Provides: Content-addressed node generation, inclusion proofs, and root hash computation using SHA-256.
 */

import { createHash } from 'node:crypto';

export interface MerkleNode {
  readonly cid: string;
  readonly links: ReadonlyArray<string>;
  readonly data?: Uint8Array;
}

const LEAF_PREFIX = new Uint8Array([0x00]);
const INTERNAL_PREFIX = new Uint8Array([0x01]);

function hashBytes(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export function createLeafNode(data: Uint8Array): MerkleNode {
  const prefixed = new Uint8Array(LEAF_PREFIX.length + data.length);
  prefixed.set(LEAF_PREFIX, 0);
  prefixed.set(data, LEAF_PREFIX.length);
  const cid = hashBytes(prefixed);
  return { cid, links: [], data };
}

export function createInternalNode(links: ReadonlyArray<string>): MerkleNode {
  // Sort links to ensure deterministic hashing regardless of child order
  const sortedLinks = [...links].sort();
  const concatenated = sortedLinks.join('');
  const encoder = new TextEncoder();
  const encoded = encoder.encode(concatenated);
  const prefixed = new Uint8Array(INTERNAL_PREFIX.length + encoded.length);
  prefixed.set(INTERNAL_PREFIX, 0);
  prefixed.set(encoded, INTERNAL_PREFIX.length);
  const cid = hashBytes(prefixed);
  return { cid, links: sortedLinks };
}

export function verifyInclusionProof(
  leafData: Uint8Array,
  proof: ReadonlyArray<{ sibling: string; isLeft: boolean }>,
  expectedRoot: string
): boolean {
  let currentHash = hashBytes(new Uint8Array([...LEAF_PREFIX, ...leafData]));
  
  for (const step of proof) {
    const left = step.isLeft ? step.sibling : currentHash;
    const right = step.isLeft ? currentHash : step.sibling;
    const combined = new TextEncoder().encode(left + right);
    const prefixed = new Uint8Array(INTERNAL_PREFIX.length + combined.length);
    prefixed.set(INTERNAL_PREFIX, 0);
    prefixed.set(combined, INTERNAL_PREFIX.length);
    currentHash = hashBytes(prefixed);
  }
  
  return currentHash === expectedRoot;
}