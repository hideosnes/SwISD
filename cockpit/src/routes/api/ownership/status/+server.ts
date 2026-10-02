/**
 * 1. Relative path: cockpit/src/routes/api/ownership/status/+server.ts
 * 2. Description: GET endpoint to query the current Sovereignty Layer state.
 * 3. Expects: N/A
 * 4. Provides: Strict DTO for the Keystone status UI.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const isKeystone = locals.keystone.isActiveKeystone();
  const isBonded = locals.bondAnchor.isBonded();
  const policy = locals.bondAnchor.getNodePolicy();
  const conductorKey = locals.conductorIdentity.getPublicKeyHex();
  
  // Determine if this conductor is whitelisted
  const cachedLedger = locals.bondAnchor.getCachedLedger();
  const isWhitelisted = cachedLedger 
    ? cachedLedger.conductors.some(c => c.publicKey === conductorKey) 
    : false;

  return json({
    isKeystone,
    isBonded,
    policy,
    conductorKey,
    isWhitelisted,
    swarmName: cachedLedger?.swarmName ?? null,
    revision: cachedLedger?.revision ?? 0,
  });
};