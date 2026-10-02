/**
 * 1. Relative path: cockpit/src/routes/api/ownership/enroll/+server.ts
 * 2. Description: POST endpoint to enroll a new conductor device.
 * 3. Expects: JSON body with new conductor key and countersignature or recovery phrase.
 * 4. Provides: Success boolean and updated ledger revision.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { hexToBytes, type HexString } from '$core/crypto/hex.js';
import type { Ed25519PublicKeyHex, Ed25519SignatureHex } from '$core/ownership/schema.js';

interface EnrollBody {
  readonly newConductorPubKey: Ed25519PublicKeyHex;
  readonly countersignature?: Ed25519SignatureHex;
  readonly countersignerPubKey?: Ed25519PublicKeyHex;
  readonly recoveryPhraseHex?: HexString;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.keystone.isActiveKeystone()) {
    throw error(403, 'This node is not the active Keystone; cannot enroll conductors directly.');
  }

  const body = (await request.json()) as EnrollBody;
  // In the local MVP, the BFF holds the Keystone keypair. 
  // If transferred, this must be replaced with a libp2p RPC to the active Keystone peer.
  const keystoneKp = locals.conductorIdentity.getKeyPair(); 

  try {
    if (body.countersignature && body.countersignerPubKey) {
      await locals.keystone.enrollConductor(
        body.newConductorPubKey,
        body.countersignature,
        body.countersignerPubKey,
        keystoneKp
      );
    } else if (body.recoveryPhraseHex) {
      const phraseBytes = hexToBytes(body.recoveryPhraseHex);
      await locals.keystone.enrollConductorWithPhrase(
        body.newConductorPubKey,
        phraseBytes,
        keystoneKp
      );
    } else {
      throw error(400, 'Must provide either countersignature or recovery phrase.');
    }

    return json({ success: true, revision: locals.keystone.getLedger()?.revision });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Enrollment failed';
    throw error(400, msg);
  }
};