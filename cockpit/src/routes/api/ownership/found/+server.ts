/**
 * 1. Relative path: cockpit/src/routes/api/ownership/found/+server.ts
 * 2. Description: POST endpoint to execute the Swarm Founding Ceremony.
 * 3. Expects: JSON body with `swarmName`.
 * 4. Provides: The one-time 128-bit recovery phrase (hex-encoded).
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { bytesToHex } from '$core/crypto/hex.js';

interface FoundBody {
  readonly swarmName: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as FoundBody;
  if (!body.swarmName || typeof body.swarmName !== 'string') {
    throw error(400, 'Missing or invalid swarmName');
  }

  try {
    const kp = locals.conductorIdentity.getKeyPair();
    const result = await locals.keystone.foundSwarm(body.swarmName, kp);
    const phraseHex = bytesToHex(result.recoveryPhrase);
    
    // Immediately bond this node to its own ledger
    const blob = locals.keystone.emitBackupBlob();
    const blobRaw = new TextDecoder().decode(blob);
    await locals.bondAnchor.bond(blobRaw, true); // Lock after bond

    return json({ recoveryPhrase: phraseHex });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Founding failed';
    throw error(500, msg);
  }
};