// src/tasks/locator.ts
// Description: The "Flock of Fish" chunk locator. Maps a Merkle Root to the specific peers holding its shards, enabling parallel micro-torrent downloads.
// Expects: A target Merkle Root (Task ID or Model ID) and the fully-replicated Control Ledger.
// Provides: A strictly typed routing table of Chunk CID -> Set of Peer IDs, optimized for parallel fetching, with zero undefined leakage.

import { SwISDError } from '../errors.js';

export type ChunkLocationLedger = ReadonlyMap<string, ReadonlySet<string>>;

export interface ChunkRoutingTable {
  readonly rootCid: string;
  readonly totalChunks: number;
  readonly chunkMap: ReadonlyMap<number, ChunkLocation>;
}

export interface ChunkLocation {
  readonly chunkIndex: number;
  readonly cid: string;
  readonly availablePeers: ReadonlySet<string>;
}

export function buildChunkRoutingTable(
  rootCid: string,
  totalChunks: number,
  chunkCids: ReadonlyArray<string>,
  ledger: ChunkLocationLedger
): ChunkRoutingTable {
  if (typeof rootCid !== 'string' || rootCid.length === 0) {
    throw new SwISDError('ERR_UNKNOWN', 'Root CID must be a non-empty string.');
  }

  if (!Number.isInteger(totalChunks) || totalChunks < 0) {
    throw new SwISDError('ERR_UNKNOWN', 'Total chunk count must be a non-negative integer.');
  }

  if (chunkCids.length !== totalChunks) {
    throw new SwISDError(
      'ERR_CRDT_INVALID_MERGE',
      `Chunk CID array length (${chunkCids.length}) does not match totalChunks (${totalChunks})`
    );
  }

  const chunkMap = new Map<number, ChunkLocation>();

  for (let i = 0; i < totalChunks; i++) {
    const cid = chunkCids[i];

    // STRICT TS FIX: Explicitly handle potential undefined from array indexing
    if (cid === undefined) {
      throw new SwISDError('ERR_CRDT_INVALID_MERGE', `Chunk CID at index ${i} is undefined`);
    }

    const peers = ledger.get(cid) ?? new Set<string>();

    chunkMap.set(i, {
      chunkIndex: i,
      cid,
      availablePeers: peers,
    });
  }

  return { rootCid, totalChunks, chunkMap };
}

export function findOrphanedChunks(
  routingTable: ChunkRoutingTable,
  targetReplicationFactor: number
): ReadonlyArray<ChunkLocation> {
  if (!Number.isInteger(targetReplicationFactor) || targetReplicationFactor < 1) {
    throw new SwISDError('ERR_UNKNOWN', 'Target replication factor must be a positive integer.');
  }

  const orphans: ChunkLocation[] = [];

  for (const location of routingTable.chunkMap.values()) {
    if (location.availablePeers.size < targetReplicationFactor) {
      orphans.push(location);
    }
  }

  return orphans;
}