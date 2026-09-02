<!--
1. Relative path: cockpit/src/lib/components/ReplayControlModal.svelte
2. Description: DEV-only modal for controlling the Scenario Replay tape recorder.
3. Expects: Svelte 5 runes, typed BFF API responses.
4. Provides: A modal control surface to play, pause, and adjust speed of the replay engine.
-->
<script lang="ts">
  import { Button, Modal, Tabs, type TabDefinition } from '$lib/components/ui/index.js';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

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
    if (open) void fetchScenarios();
  });
</script>

<Modal {open} {onclose} title="Scenario Replay Deck">
  {#if error}
    <p class="text-sm" style="color: var(--danger, #ef4444);">{error}</p>
  {:else}
    <div class="flex flex-col gap-6">
      <div>
        <h3 class="text-sm font-bold mb-3" style="color: var(--text);">Transport</h3>
        <div class="flex flex-wrap gap-3">
          <Button onclick={() => sendControl('play')}>Play</Button>
          <Button onclick={() => sendControl('pause')}>Pause</Button>
          <Button onclick={() => sendControl('speed', 0.5)}>0.5x</Button>
          <Button onclick={() => sendControl('speed', 1)}>1x</Button>
          <Button onclick={() => sendControl('speed', 2)}>2x</Button>
          <Button onclick={() => sendControl('speed', 4)}>4x</Button>
        </div>
      </div>

      {#if scenarios.length > 0}
        <div>
          <h3 class="text-sm font-bold mb-3" style="color: var(--text);">Scenario Selection</h3>
          <Tabs tabs={tabDefinitions} bind:activeTab>
            {#snippet content(tabId: string)}
              <p class="text-xs" style="color: var(--text-muted, var(--text));">
                To activate <span class="mono" style="color: var(--accent);">{tabId}</span>, restart the server with:
                <code class="mono block mt-2 p-2 rounded" style="background: var(--surface, #1a1a2e); color: var(--accent);">
                  SWISD_REPLAY={tabId} npm run dev
                </code>
              </p>
            {/snippet}
          </Tabs>
        </div>
      {:else}
        <p class="text-sm" style="color: var(--text-muted, var(--text));">Loading scenarios...</p>
      {/if}
    </div>
  {/if}
</Modal>