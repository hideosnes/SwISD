<!--
1. Relative path: cockpit/src/routes/settings/+page.svelte
2. Description: Per-device cockpit settings: regime quick-flip and a theme gallery with live token-scoped previews.
3. Expects: The UI barrel and the shared themeStore; theme files scoped via [data-theme] selectors.
4. Provides: A radio-group theme picker persisted to this device's localStorage only.
-->

<script lang="ts">
  import { PageShell, Panel, ThemeToggle } from '$lib/components/ui';
  import { THEMES, themeStore } from '$lib';
</script>

<PageShell>
  <header class="border-b border-border pb-6 pt-2">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-bold tracking-tight text-text-1">Settings</h1>
      <span class="font-fx text-lg text-accent">DEVICE-LOCAL</span>
    </div>
    <p class="mt-2 max-w-prose-bench text-sm text-text-2">
      Regime and theme are stored in this device's localStorage only. The swarm never learns your taste.
    </p>
  </header>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Panel index="01" title="Theme Regime">
      <p class="text-sm text-text-2">
        Quick flip between light and dark. Flipping back to dark restores this device's last dark theme.
      </p>
      <div>
        <ThemeToggle regime={themeStore.regime} ontoggle={(next) => themeStore.flipRegime(next)} />
      </div>
    </Panel>

    <Panel index="02" title="Persistence">
      <p class="text-sm text-text-2">
        Keys: <span class="mono text-accent">swisd-theme</span> and
        <span class="mono text-accent">swisd-theme-dark</span>.
        Clearing site data returns the cockpit to Midnight Violet.
      </p>
    </Panel>
  </div>

  <Panel index="03" title="Theme Gallery">
    <fieldset class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <legend class="sr-only">Cockpit theme</legend>

      {#each THEMES as entry (entry.id)}
        <label class="cursor-pointer">
          <input
            type="radio"
            name="cockpit-theme"
            value={entry.id}
            checked={themeStore.current === entry.id}
            onchange={() => themeStore.set(entry.id)}
            class="peer sr-only"
          />

          <!-- Scoped preview: this subtree drinks the candidate theme's own tokens -->
          <div
            data-theme={entry.id}
            class="flex flex-col gap-3 rounded-md bg-surface p-4 transition-colors peer-checked:bg-surface-2 peer-focus-visible:outline-2 peer-focus-visible:outline-accent"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm font-bold text-text-1">
                {entry.label}
                {#if themeStore.current === entry.id}
                  <span class="mono text-accent">(active)</span>
                {/if}
              </span>
              <span class="mono text-2xs uppercase tracking-widest text-text-3">{entry.regime}</span>
            </div>

            <div class="flex gap-2" aria-hidden="true">
              <span class="h-4 w-8 rounded-sm bg-[var(--bg)]"></span>
              <span class="h-4 w-8 rounded-sm bg-[var(--surface-2)]"></span>
              <span class="h-4 w-8 rounded-sm bg-[var(--accent)]"></span>
              <span class="h-4 w-8 rounded-sm bg-[var(--accent-2)]"></span>
              <span class="h-4 w-8 rounded-sm bg-[var(--live)]"></span>
            </div>
          </div>
        </label>
      {/each}
    </fieldset>
  </Panel>
</PageShell>