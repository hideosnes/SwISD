// 1. Relative path: scripts/sign-release.ts
// 2. Description: CI/CD script to cryptographically sign a release tarball using Ed25519.
// 3. Expects: Path to the tarball as the first CLI argument, and SWISD_SIGNING_KEY_DER_BASE64 in the environment.
// 4. Provides: A `.sig` file containing the Ed25519 signature of the tarball, ensuring release authenticity.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { sign } from 'node:crypto';

const tarballPath = process.argv[2];
const privateKeyBase64 = process.env.SWISD_SIGNING_KEY_DER_BASE64;

if (!tarballPath) {
  console.error('Error: Tarball path is required as the first argument.');
  console.error('Usage: npx tsx scripts/sign-release.ts <path-to-tarball>');
  process.exit(1);
}

if (!privateKeyBase64) {
  console.error('Error: SWISD_SIGNING_KEY_DER_BASE64 environment variable is not set.');
  process.exit(1);
}

if (!existsSync(tarballPath)) {
  console.error(`Error: Tarball not found at ${tarballPath}`);
  process.exit(1);
}

try {
  const tarballBuffer = readFileSync(tarballPath);
  const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');

  const signature = sign(null, tarballBuffer, {
    key: privateKeyBuffer,
    format: 'der',
    type: 'pkcs8',
  });

  const sigPath = `${tarballPath}.sig`;
  writeFileSync(sigPath, signature);
  console.log(`[Sign] Successfully signed ${tarballPath} -> ${sigPath}`);
} catch (error) {
  console.error('[Sign] Failed to sign release:', error);
  process.exit(1);
}