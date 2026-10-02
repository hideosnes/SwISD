/**
 * 1. Relative path: cockpit/src/lib/adapters/keystone.ts
 * 2. Description: Maps Sovereignty Layer state to StatusPill vocabulary.
 * 3. Expects: Keystone/BondAnchor state booleans.
 * 4. Provides: Pure adapter function per the Adapter Doctrine.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import type { Status } from '$lib/components/ui/index.js';

export function keystoneToStatus(isKeystone: boolean, isBonded: boolean, isWhitelisted: boolean): Status {
  if (isKeystone) return 'accent'; // You are the crown
  if (isBonded && isWhitelisted) return 'live'; // Healthy worker/conductor
  if (isBonded && !isWhitelisted) return 'warn'; // Bonded but rogue
  return 'idle'; // Unbonded
}