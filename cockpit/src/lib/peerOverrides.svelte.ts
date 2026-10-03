/**
 * 1. Relative path: cockpit/src/lib/peerOverrides.svelte.ts
 * 2. Description: Client-side reactive store for operator-assigned peer name and icon overrides.
 * 3. Expects: Browser environment for localStorage persistence.
 * 4. Provides: A typed, reactive map of peerId to { name, icon } overrides, adhering to the Pin Store Doctrine.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import { browser } from '$app/environment';
import type { DeviceType } from '$lib/components/datavis/types.js';

export interface PeerOverride {
  readonly name?: string;
  readonly icon?: DeviceType;
}

class PeerOverrideStore {
  overrides = $state<Record<string, PeerOverride>>({});

  constructor() {
    if (browser) {
      const stored = localStorage.getItem('swisd-peer-overrides');
      if (stored) {
        try {
          this.overrides = JSON.parse(stored);
        } catch {
          this.overrides = {};
        }
      }
    }
  }

  public setOverride(peerId: string, override: Partial<PeerOverride>): void {
    const current = this.overrides[peerId] ?? {};
    this.overrides[peerId] = { ...current, ...override };
    if (browser) {
      localStorage.setItem('swisd-peer-overrides', JSON.stringify(this.overrides));
    }
  }

  public getOverride(peerId: string): PeerOverride | undefined {
    return this.overrides[peerId];
  }

  public clearOverride(peerId: string): void {
    if (this.overrides[peerId]) {
      delete this.overrides[peerId];
      if (browser) {
        localStorage.setItem('swisd-peer-overrides', JSON.stringify(this.overrides));
      }
    }
  }
}

export const peerOverrideStore = new PeerOverrideStore();