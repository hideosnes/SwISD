/**
 * 1. Relative path: cockpit/src/app.d.ts
 * 2. Description: Global type declarations for SvelteKit app locals.
 * 3. Expects: Core service types from $core barrels and BFF server singletons.
 * 4. Provides: Type-safe access to backend services via locals.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import type { ObservabilitySource, ObservabilityEventBus, ScenarioEngine } from '$core/observability/index.js';
import type { TrustRegistry } from '$core/peer/index.js';
import type { ModelRegistry, ApprovalGate, ModelDownloader, ModelManager } from '$core/models/index.js';
import type { Keystone, BondAnchor } from '$core/ownership/index.js';
import type { ConductorIdentity } from '$lib/server/conductorIdentity.js';
import type { SessionLock } from '$lib/server/sessionLock.js';

declare global {
  namespace App {
    interface Locals {
      coreSource: ObservabilitySource;
      eventBus: ObservabilityEventBus;
      trustRegistry: TrustRegistry;
      modelRegistry: ModelRegistry;
      approvalGate: ApprovalGate;
      modelDownloader: ModelDownloader;
      modelManager: ModelManager;
      isReplay: boolean;
      replayEngine: ScenarioEngine | null;
      
      // Sovereignty Layer
      keystone: Keystone;
      bondAnchor: BondAnchor;
      conductorIdentity: ConductorIdentity;
      sessionLock: SessionLock;
    }
  }
}

export {};