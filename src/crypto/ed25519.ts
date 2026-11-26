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
    key: Buffer.from(asPkcs8(privateKeyDer)),
    format: 'der',
    type: 'pkcs8',
  });

  return new Uint8Array(sign(null, data, key));
}

export function verifyEd25519(publicKeyDer: Uint8Array, data: Uint8Array, signature: Uint8Array): boolean {
  const key = createPublicKey({
    key: Buffer.from(asSpki(publicKeyDer)),
    format: 'der',
    type: 'spki',
  });

  return verify(null, data, key, Buffer.from(signature));
}

function asPkcs8(key: Uint8Array): Uint8Array {
  if (key.length === 48) return key;
  if (key.length === 32) {
    // Ed25519 PKCS8 header: 0x302e020100300506032b657004220420 | <32 raw bytes>
    const prefix = new Uint8Array([0x30, 0x2e, 0x02, 0x01, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20]);
    const out = new Uint8Array(prefix.length + 32);
    out.set(prefix, 0);
    out.set(key, prefix.length);
    return out;
  }
  throw new Error('Ed25519 private key must be 48-byte PKCS8 DER or 32-byte raw');
}

function asSpki(key: Uint8Array): Uint8Array {
  if (key.length === 44) return key;
  if (key.length === 32) {
    // Ed25519 SPKI header: 0x302a300506032b6570032100 | <32 raw bytes>
    const prefix = new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);
    const out = new Uint8Array(prefix.length + 32);
    out.set(prefix, 0);
    out.set(key, prefix.length);
    return out;
  }
  throw new Error('Ed25519 public key must be 44-byte SPKI DER or 32-byte raw');
}

export function rawPublicKeyFromSpki(spk: Uint8Array): Uint8Array {
  if (spk.length !== 44) {
    throw new Error('Ed25519 SPKI DER must be exactly 44 bytes');
  }
  return spk.slice(-32);
}