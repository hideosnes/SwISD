<!--
1. Relative path: cockpit/src/routes/dev/replay/+page.svelte
2. Description: DEV-only scenario control deck for Scenario Replay Mode.
3. Expects: Svelte 5 runes, typed BFF API responses.
4. Provides: A control surface to play, pause, and adjust speed of the replay tape recorder.
-->
<script lang="ts">
  import { Button, Card, PageShell, Tabs, type TabDefinition } from '$lib/components/ui/index.js';

  let scenarios = $state<{ id: string; title: string }[]>([]);
  let activeTab = $state<string>('');
  let error = $state<string | null>(null);

  const tabDefinitions: ReadonlyArray<TabDefinition> = $derived(
    scenarios.map(s => ({ id: s.id, label: s.title }))
  );

  async function fetchScenarios(): Promise<void> {
    try {
      const res = await fetch('/api/scenario');
      if (!res.ok) throw new Error('Scenario API unavailable');
      const data = await res.json() as { active: boolean; scenarios: { id: string; title: string }[] };
      scenarios = data.scenarios;

      // FIXED: Capture-then-narrow. Array index reads are T | undefined under
      // noUncheckedIndexedAccess; length checks don't narrow them.
      const first = scenarios[0];
      if (first !== undefined && activeTab === '') {
        activeTab = first.id;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  async function sendControl(action: 'play' | 'pause' | 'speed', value?: number): Promise<void> {
    try {
      const res = await fetch('/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      if (!res.ok) throw new Error('Control failed');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  $effect(() => {
    void fetchScenarios();
  });
</script>

<PageShell>
  <header class="mb-8">
    <h1 class="text-3xl font-bold" style="color: var(--accent);">Scenario Replay Deck</h1>
    <p class="text-sm mt-2" style="color: var(--text-muted, var(--text));">
      DEV-ONLY: Control the deterministic tape recorder.
    </p>
  </header>

  {#if error}
    <Card title="Error">
      <p style="color: var(--danger, #ef4444);">{error}</p>
    </Card>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card title="Transport Controls">
      <div class="flex gap-4 mb-4">
        <Button onclick={() => sendControl('play')}>Play</Button>
        <Button onclick={() => sendControl('pause')}>Pause</Button>
      </div>
      <div class="flex gap-4">
        <Button onclick={() => sendControl('speed', 0.5)}>0.5x</Button>
        <Button onclick={() => sendControl('speed', 1)}>1x</Button>
        <Button onclick={() => sendControl('speed', 2)}>2x</Button>
        <Button onclick={() => sendControl('speed', 4)}>4x</Button>
      </div>
    </Card>

    <Card title="Scenario Selection">
      {#if scenarios.length > 0}
        <Tabs tabs={tabDefinitions} bind:activeTab>
          {#snippet content(tabId: string)}
            <div class="p-4">
              <p class="text-sm" style="color: var(--text);">
                Selected: <span class="mono" style="color: var(--accent);">{tabId}</span>
              </p>
              <p class="text-xs mt-3" style="color: var(--text-muted, var(--text));">
                To activate this scenario, restart the server with:
              </p>
              <code class="mono text-xs block mt-2 p-2 rounded" style="background: var(--surface, #1a1a2e); color: var(--accent);">
                SWISD_REPLAY={tabId} npm run dev
              </code>
            </div>
          {/snippet}
        </Tabs>
      {:else}
        <p>Loading scenarios...</p>
      {/if}
    </Card>
  </div>
</PageShell>