// 1. Relative path: cockpit/src/app.d.ts
// 2. Description: SvelteKit Locals typing for the Core Bridge.
// 3. Expects: SvelteKit App types.
// 4. Provides: Strict typing for event.locals injected by hooks.server.ts.

import type { ObservabilitySource, ObservabilityEventBus, ScenarioEngine } from '$core/observability/index.js';
import type { TrustRegistry } from '$core/peer/index.js';
import type { ModelRegistry, ApprovalGate, ModelDownloader, ModelManager } from '$core/models/index.js';

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
    }
  }
}

export {};