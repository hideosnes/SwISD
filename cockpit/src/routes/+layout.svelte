<!--
1. Relative path: cockpit/src/routes/+layout.svelte
2. Description: Global Conductor Cockpit layout shell, stylesheet loader, and theme regime controller.
3. Expects: SvelteKit child route content; theme persisted as 'swisd-theme' in localStorage.
4. Provides: Global theme import, [data-theme] propagation, responsive navigation shell, and the ThemeToggle.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import './layout.css';
  import { Icon, ThemeToggle } from '$lib/components/ui';
  import type { Theme } from '$lib/components/ui/ThemeToggle.svelte';

  let { children }: { children: Snippet } = $props();

  let theme = $state<Theme>('dark');

  // Adopt the regime applied pre-paint by app.html (client-only, runs once).
  $effect(() => {
    const initial = document.documentElement.dataset.theme;
    if (initial === 'light' || initial === 'dark') {
      theme = initial;
    }
  });

  function setTheme(next: Theme): void {
    theme = next;
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('swisd-theme', next);
    } catch {
      /* Storage unavailable (private mode) — regime stays session-only. */
    }
  }
</script>

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
    </nav>

    <!-- THEME CONTROL -->
    <div class="mt-auto pt-8">
      <ThemeToggle theme={theme} ontoggle={setTheme} />
    </div>
  </aside>

  <!-- MAIN CONTENT -->
  <main class="flex flex-1 flex-col overflow-hidden">
    <div class="flex-1 overflow-auto p-4 lg:p-8">
      {@render children()}
    </div>
  </main>
</div>