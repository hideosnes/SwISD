/**
 * 1. Relative path: src/crypto/ed25519.ts
 * 2. Description: Ed25519 control-plane cryptographic primitives for identity, capability registration, and CRDT event signing.
 * 3. Expects: Uint8Array for keys, data, and signatures.
 * 4. Provides: Key generation, signing, and verification using Node's native crypto module with zero type ambiguity.
 */

import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

export interface Ed25519KeyPair {
  readonly publicKey: Uint8Array;
  readonly privateKey: Uint8Array;
}

export function generateEd25519KeyPair(): Ed25519KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  
  const pubExport = publicKey.export({ format: 'der', type: 'spki' });
  const privExport = privateKey.export({ format: 'der', type: 'pkcs8' });

  return {
    publicKey: pubExport instanceof Buffer ? new Uint8Array(pubExport) : new Uint8Array(Buffer.from(pubExport)),
    privateKey: privExport instanceof Buffer ? new Uint8Array(privExport) : new Uint8Array(Buffer.from(privExport)),
  };
}

export function signEd25519(privateKeyDer: Uint8Array, data: Uint8Array): Uint8Array {
  const key = createPrivateKey({
    key: Buffer.from(privateKeyDer),
    format: 'der',
    type: 'pkcs8',
  });

  return new Uint8Array(sign(null, data, key));
}

export function verifyEd25519(publicKeyDer: Uint8Array, data: Uint8Array, signature: Uint8Array): boolean {
  const key = createPublicKey({
    key: Buffer.from(publicKeyDer),
    format: 'der',
    type: 'spki',
  });

  return verify(null, data, key, Buffer.from(signature));
}