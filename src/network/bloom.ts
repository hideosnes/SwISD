// 1. Relative path: src/network/bloom.ts
// 2. Description: Probabilistic TTL implementation using Bloom Filters for loop prevention in blind propagation.
// 3. Expects: Peer IDs (strings) and a configured filter size/hash count.
// 4. Provides: Strict, side-effect-free Bloom filter creation, insertion, and membership testing without unsafe assertions.

import type { BloomFilterState } from '../types.js';
import { fnv1aHash } from '../utils.js';

export function createBloomFilter(sizeBytes: number, hashCount: number): BloomFilterState {
  if (sizeBytes <= 0 || hashCount <= 0) {
    throw new Error('Bloom filter dimensions must be strictly positive');
  }
  return { filter: new Uint8Array(sizeBytes), hashFunctionsCount: hashCount };
}

function getBitIndices(value: string, hashCount: number, maxBitIndex: number): number[] {
  const h1 = fnv1aHash(value);
  const h2 = fnv1aHash(value + '_swisd_salt');
  const indices: number[] = [];
  for (let i = 0; i < hashCount; i++) {
    const combined = (h1 + i * h2) >>> 0; 
    indices.push(combined % maxBitIndex);
  }
  return indices;
}

export function addToBloomFilter(filter: BloomFilterState, value: string): BloomFilterState {
  const maxBitIndex = filter.filter.length * 8;
  const indices = getBitIndices(value, filter.hashFunctionsCount, maxBitIndex);
  
  const newBits = new Uint8Array(filter.filter);
  for (const idx of indices) {
    const byteIndex = idx >>> 3;
    const bitIndex = idx & 7;
    
    const currentByte = newBits[byteIndex] ?? 0;
    newBits[byteIndex] = currentByte | (1 << bitIndex);
  }
  
  return { filter: newBits, hashFunctionsCount: filter.hashFunctionsCount };
}

export function mightContain(filter: BloomFilterState, value: string): boolean {
  const maxBitIndex = filter.filter.length * 8;
  const indices = getBitIndices(value, filter.hashFunctionsCount, maxBitIndex);
  
  for (const idx of indices) {
    const byteIndex = idx >>> 3;
    const bitIndex = idx & 7;
    
    const byte = filter.filter[byteIndex] ?? 0;
    if ((byte & (1 << bitIndex)) === 0) {
      return false;
    }
  }
  return true;
}