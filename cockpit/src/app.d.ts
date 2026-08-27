// 1. Relative path: cockpit/src/app.d.ts
// 2. Description: Global type declarations for SvelteKit, extending the default locals with the SwISD core context.
// 3. Expects: SvelteKit's default App namespace.
// 4. Provides: Strict typing for `event.locals`, ensuring the BFF bridge injects the core observability source safely.

import type { ObservabilitySource, ObservabilityEventBus } from '$core/observability/index.js';

declare global {
  namespace App {
    interface Locals {
      readonly coreSource: ObservabilitySource;
      readonly eventBus: ObservabilityEventBus;
    }
    interface Error {
      readonly code?: string;
    }
    interface PageData {}
    interface Platform {}
  }
}

export {};