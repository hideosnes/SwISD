// 1. Relative path: cockpit/src/app.d.ts
// 2. Description: Global type declarations for SvelteKit, extending the default locals with the SwISD core context and trust registry.
// 3. Expects: SvelteKit's default App namespace.
// 4. Provides: Strict typing for `event.locals`, ensuring the BFF bridge injects the core observability source and trust registry safely.

import type { ObservabilitySource, ObservabilityEventBus } from '$core/observability/index.js';
import type { TrustRegistry } from '$core/peer/index.js';

declare global {
  namespace App {
    interface Locals {
      readonly coreSource: ObservabilitySource;
      readonly eventBus: ObservabilityEventBus;
      readonly trustRegistry: TrustRegistry;
    }
    interface Error {
      readonly code?: string;
    }
    interface PageData {}
    interface Platform {}
  }
}

export {};