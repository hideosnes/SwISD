<!--
1. Relative path: cockpit/src/routes/settings/+page.svelte
2. Description: Per-device cockpit settings: regime quick-flip, theme gallery, and secure HuggingFace credential management.
3. Expects: The UI barrel, the shared themeStore, and the BFF credential API.
4. Provides: A radio-group theme picker persisted to this device's localStorage only, and a secure token validation form.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import { PageShell, Panel, ThemeToggle, Button, TextField, StatusPill } from '$lib/components/ui';
  import { THEMES, themeStore } from '$lib';
  
  let hfToken = $state('');
  let hfStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let hfMessage = $state('');
  let hfUsername = $state('');

  async function saveHfToken(e: Event) {
    e.preventDefault();
    if (!hfToken.trim()) return;
    
    hfStatus = 'loading';
    hfMessage = '';
    
    try {
      const res = await fetch('/api/credentials/huggingface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: hfToken.trim() })
      });
      
      const data = await res.json() as { valid: boolean; error?: string; username?: string; message?: string };
      
      if (!res.ok || !data.valid) {
        hfStatus = 'error';
        hfMessage = data.error ?? 'Failed to validate token.';
      } else {
        hfStatus = 'success';
        hfMessage = data.message ?? 'Token saved.';
        hfUsername = data.username ?? '';
        hfToken = ''; // Clear input on success
      }
    } catch (err: unknown) {
      hfStatus = 'error';
      hfMessage = err instanceof Error ? err.message : 'Network error';
    }
  }
</script>

<PageShell>
  <header class="border-b border-border pb-6 pt-2">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-bold tracking-tight text-text-1">Settings</h1>
      <span class="font-fx text-lg text-accent">DEVICE-LOCAL</span>
    </div>
    <p class="mt-2 max-w-prose-bench text-sm text-text-2">
      Regime, theme, and secure credentials are stored in this device's local state only. The swarm never learns your taste or your keys.
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
    
    <Panel index="03" title="HuggingFace Integration">
      <p class="text-sm text-text-2 mb-4">
        Required for downloading gated or private models. The token is validated against HuggingFace and stored securely on this device (never sent to the swarm).
      </p>
      
      <form onsubmit={saveHfToken} class="flex flex-col gap-4">
        <TextField 
          id="hf-token" 
          label="HuggingFace API Token" 
          type="password" 
          placeholder="hf_..." 
          bind:value={hfToken} 
        />
        
        <div class="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={hfStatus === 'loading' || !hfToken.trim()}>
            {hfStatus === 'loading' ? 'Validating...' : 'Validate & Save'}
          </Button>
          
          {#if hfStatus === 'success'}
            <StatusPill status="live" label={hfUsername ? `Connected as ${hfUsername}` : 'Saved'} />
          {:else if hfStatus === 'error'}
            <StatusPill status="warn" label="Invalid" />
          {/if}
        </div>
        
        {#if hfMessage}
          <p class="text-sm" class:text-live={hfStatus === 'success'} class:text-warn={hfStatus === 'error'}>
            {hfMessage}
          </p>
        {/if}
      </form>
    </Panel>
  </div>

  <Panel index="04" title="Theme Gallery">
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