/**
 * 1. Relative path: cockpit/src/app.d.ts
 * 2. Description: Global type declarations for SvelteKit app locals.
 * 3. Expects: Core service types from $core barrels.
 * 4. Provides: Type-safe access to backend services via locals.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import type { ObservabilitySource, ObservabilityEventBus, ScenarioEngine } from '$core/observability/index.js';
import type { TrustRegistry } from '$core/peer/index.js';
import type { ModelRegistry, ApprovalGate, ModelDownloader, ModelManager } from '$core/models/index.js';

declare global {
  namespace App {
    interface Locals {
      // Core swarm observability
      coreSource: ObservabilitySource;
      eventBus: ObservabilityEventBus;

      // Cryptographic trust
      trustRegistry: TrustRegistry;

      // Model distribution pipeline
      modelRegistry: ModelRegistry;
      approvalGate: ApprovalGate;
      modelDownloader: ModelDownloader;
      modelManager: ModelManager;

      // Replay scenario system (dev-only)
      isReplay: boolean;
      replayEngine: ScenarioEngine | null;
    }
  }
}

export {};