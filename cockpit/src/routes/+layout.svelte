<!--
1. Relative path: cockpit/src/routes/+layout.svelte
2. Description: Global Conductor Cockpit layout shell and stylesheet loader.
3. Expects: SvelteKit child route content.
4. Provides: Global theme import, token-driven root layout structure, and navigation shell.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import './layout.css';
  import { Icon } from '$lib/components/ui';

  let { children }: { children: Snippet } = $props();
</script>

<div class="flex min-h-screen bg-bg text-text-1">
  <!-- SIDEBAR -->
  <aside class="flex w-64 flex-col border-r border-border bg-surface p-6">
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
    </nav>
  </aside>

  <!-- MAIN CONTENT -->
  <main class="flex flex-1 flex-col overflow-hidden">
    <header class="flex h-16 items-center border-b border-border bg-surface px-8">
      <h2 class="text-lg font-semibold text-text-1">Conductor Cockpit</h2>
    </header>
    
    <!-- The layout handles the viewport padding. No double-wrapping. -->
    <div class="flex-1 overflow-auto p-8">
      {@render children()}
    </div>
  </main>
</div>