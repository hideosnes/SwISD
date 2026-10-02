<!--
1. Relative path: cockpit/src/routes/+layout.svelte
2. Description: Global Conductor Cockpit layout shell, stylesheet loader, theme regime controller, and session lock overlay.
3. Expects: SvelteKit child route content; theme persisted per device in localStorage.
4. Provides: Global theme import, [data-theme] propagation, responsive navigation shell, regime quick-flip, and session lock.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import './layout.css';
  import { Icon, ThemeToggle } from '$lib/components/ui';
  import { themeStore } from '$lib';
  import SessionLockOverlay from '$lib/components/SessionLockOverlay.svelte';
  import KeystoneLossBanner from '$lib/components/KeystoneLossBanner.svelte';

  let { children }: { children: Snippet } = $props();

  // TODO: Wire these to a real /api/session/status and /api/ownership/status poller
  let sessionLocked = $state(false); 
  let hasPassword = $state(false);
  let isBonded = $state(false);
  let isWhitelisted = $state(false);
  let isKeystone = $state(false);

  function handleUnlock(): void {
    sessionLocked = false;
  }

  $effect(() => {
    themeStore.adopt();
  });
</script>

<SessionLockOverlay locked={sessionLocked} {hasPassword} onunlock={handleUnlock} />

<div class="flex min-h-screen bg-bg text-text-1">
  <!-- SIDEBAR -->
  <aside class="hidden lg:flex w-64 flex-col border-r border-border bg-surface p-6">
    <h1 class="mb-8 text-2xl font-bold text-accent">SwISD</h1>

    <nav class="flex flex-col gap-2">
      <a href="/" class="flex items-center gap-3 rounded-md px-4 py-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1">
        <Icon name="dashboard" size="sm" aria-hidden={true} />
        Dashboard
      </a>
      <a href="/models" class="flex items-center gap-3 rounded-md px-4 py-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1">
        <Icon name="folder" size="sm" aria-hidden={true} />
        Models
      </a>
      <a href="/design" class="flex items-center gap-3 rounded-md px-4 py-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1">
        <Icon name="palette" size="sm" aria-hidden={true} />
        Design
      </a>
      <a href="/settings" class="flex items-center gap-3 rounded-md px-4 py-2 text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1">
        <Icon name="tune" size="sm" aria-hidden={true} />
        Settings
      </a>
    </nav>

    <div class="mt-auto pt-8">
      <ThemeToggle regime={themeStore.regime} ontoggle={(next) => themeStore.flipRegime(next)} />
    </div>
  </aside>

  <!-- MAIN CONTENT -->
  <main class="flex flex-1 flex-col overflow-hidden">
    <KeystoneLossBanner {isBonded} {isWhitelisted} {isKeystone} />
    <div class="flex-1 overflow-auto p-4 lg:p-8">
      {@render children()}
    </div>
  </main>
</div>