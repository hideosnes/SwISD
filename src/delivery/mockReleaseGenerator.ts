// 1. Relative path: src/delivery/mockReleaseGenerator.ts
// 2. Description: Local development tool to generate a cryptographically valid release bundle for testing.
// 3. Expects: A target version string and the delivery root path.
// 4. Provides: A generated release directory containing a payload, its SHA-256 checksum, and an Ed25519 signature.

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';

export interface GeneratorConfig {
  readonly deliveryRoot: string;
  readonly version: string;
}

async function getOrCreateDevKeyPair(supervisorDir: string): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
  const pubPath = join(supervisorDir, 'dev-public-key.der');
  const privPath = join(supervisorDir, 'dev-private-key.der');

  try {
    await access(pubPath);
    await access(privPath);
    const pub = await readFile(pubPath);
    const priv = await readFile(privPath);
    return { publicKey: new Uint8Array(pub), privateKey: new Uint8Array(priv) };
  } catch {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { format: 'der', type: 'spki' },
      privateKeyEncoding: { format: 'der', type: 'pkcs8' },
    });
    
    const pubBuffer = publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey);
    const privBuffer = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey);

    await writeFile(pubPath, pubBuffer);
    await writeFile(privPath, privBuffer);
    console.log('[Generator] Created new local dev Ed25519 keypair.');
    
    return { publicKey: new Uint8Array(pubBuffer), privateKey: new Uint8Array(privBuffer) };
  }
}

export async function generateMockRelease(config: GeneratorConfig): Promise<void> {
  const releaseDir = join(config.deliveryRoot, 'releases', config.version);
  const supervisorDir = join(config.deliveryRoot, 'supervisor');
  
  await mkdir(releaseDir, { recursive: true });
  await mkdir(supervisorDir, { recursive: true });

  // Aligned to use app.bin to match the MVP contract
  const payloadPath = join(releaseDir, 'swisd.bin');
  const sha256Path = join(releaseDir, 'swisd.bin.sha256');
  const sigPath = join(releaseDir, 'swisd.bin.sig');

  const payloadContent = `SwISD Release Payload v${config.version}\nMock data for atomic swap testing.`;
  const payloadBuffer = Buffer.from(payloadContent, 'utf-8');

  const sha256Hash = createHash('sha256').update(payloadBuffer).digest('hex');
  
  const { privateKey } = await getOrCreateDevKeyPair(supervisorDir);
  
  const sigBuffer = sign(null, payloadBuffer, {
    key: Buffer.from(privateKey),
    format: 'der',
    type: 'pkcs8',
  });

  await writeFile(payloadPath, payloadBuffer);
  await writeFile(sha256Path, sha256Hash);
  await writeFile(sigPath, sigBuffer);

  console.log(`[Generator] Successfully generated release ${config.version} at ${releaseDir}`);
}