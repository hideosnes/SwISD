<!--
1. Relative path: cockpit/src/routes/+page.svelte
2. Description: The main Conductor Cockpit dashboard. Polls the BFF for live swarm metrics and topology, renders the orbital map, tabbed telemetry views, the pinned sidebar, and the operator command queue.
3. Expects: Svelte 5 runes, typed BFF API responses, and composable UI primitives.
4. Provides: A real-time, accessible, and strictly themed view of the swarm.
-->
<script lang="ts">
  import type { ObservabilitySnapshot } from '$core/observability/index.js';
  import type { SwarmTopologyDTO } from '$lib/server/index.js';
  import { TopologyCanvas } from '$lib/components/datavis/index.js';
  import { Badge, Button, Card, EmptyState, Modal, PageShell, Stat, Tabs, type TabDefinition } from '$lib/components/ui/index.js';
  import { isPinned, togglePin } from '$lib/pins.svelte.js';

  import DiscoveryPanel from '$lib/components/DiscoveryPanel.svelte';
  import PendingTrustPanel from '$lib/components/PendingTrustPanel.svelte';
  import StageView from '$lib/components/StageView.svelte';
  import EngineRoomView from '$lib/components/EngineRoomView.svelte';
  import SwarmSidebar from '$lib/components/SwarmSidebar.svelte';
  import CommandQueue from '$lib/components/CommandQueue.svelte';

  let snapshot = $state<ObservabilitySnapshot | null>(null);
  let topology = $state<SwarmTopologyDTO | null>(null);
  let selectedPeerId = $state<string | null>(null);
  let telemetryError = $state<string | null>(null);
  let activeTab = $state<'stage' | 'engine'>('stage');

  let queueOpen = $state(false);
  let busyPeerId = $state<string | null>(null);

  const pendingPeers = $derived(
    topology?.peers.filter((peer) => peer.trustState === 'pending') ?? [],
  );

  const tabDefinitions: ReadonlyArray<TabDefinition> = [
    { id: 'stage', label: 'Stage' },
    { id: 'engine', label: 'Engine Room' },
  ];

  async function fetchTelemetry(): Promise<void> {
    try {
      const [snapRes, topoRes] = await Promise.all([
        fetch('/api/snapshot'),
        fetch('/api/topology'),
      ]);

      if (!snapRes.ok || !topoRes.ok) {
        throw new Error(`Telemetry unavailable (${snapRes.status}/${topoRes.status})`);
      }

      snapshot = await snapRes.json() as ObservabilitySnapshot;
      topology = await topoRes.json() as SwarmTopologyDTO;
      telemetryError = null;
    } catch (err) {
      telemetryError = err instanceof Error ? err.message : 'Unknown telemetry error';
    }
  }

  async function decideTrust(peerId: string, action: 'trust' | 'reject'): Promise<void> {
    if (busyPeerId !== null) return;
    busyPeerId = peerId;
    try {
      const res = await fetch('/api/peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId, action }),
      });
      if (!res.ok) throw new Error(`Trust decision failed (${res.status})`);
      await fetchTelemetry();
    } catch (err) {
      telemetryError = err instanceof Error ? err.message : 'Unknown trust decision error';
    } finally {
      busyPeerId = null;
    }
  }

  function handleTogglePin(): void {
    if (selectedPeerId !== null) togglePin(selectedPeerId);
  }

  function closePeerModal(): void {
    selectedPeerId = null;
  }

  $effect(() => {
    void fetchTelemetry();
    const interval = setInterval(() => void fetchTelemetry(), 2000);
    return () => clearInterval(interval);
  });
</script>

<PageShell>
  <header class="mb-8 flex items-center justify-between">
    <h1 class="text-3xl font-bold" style="color: var(--accent);">Conductor Cockpit</h1>
    <Button
      onclick={() => queueOpen = true}
      aria-label="Open command queue, {pendingPeers.length} pending actions"
    >
      Actions
      <Badge count={pendingPeers.length} />
    </Button>
  </header>

  {#if telemetryError}
    <Card title="Connection Error">
      <p style="color: var(--danger, #ef4444);">{telemetryError}</p>
    </Card>
  {/if}

  {#if snapshot && topology}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card title="Swarm Overview">
        <Stat label="Swarm Size" value={topology.swarmSize.toString()} />
        <Stat label="Pending Trust" value={topology.ghostCount.toString()} />
      </Card>
      <Card title="Conductor Load">
        <Stat label="Local Load" value={`${(snapshot.load.loadScore * 100).toFixed(1)}%`} />
        <Stat label="Backpressure" value={snapshot.load.backpressureState.toUpperCase()} />
      </Card>
      <Card title="Delivery Status">
        <Stat label="Supervisor" value={snapshot.delivery.supervisorPresent ? 'ONLINE' : 'OFFLINE'} />
        <Stat label="Heartbeat" value={snapshot.delivery.heartbeatOk ? 'OK' : 'STALE'} />
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div class="lg:col-span-2 aspect-square min-h-[400px]">
        <TopologyCanvas {topology} onPeerClick={(id) => selectedPeerId = id} />
      </div>

      <div class="space-y-6">
        <SwarmSidebar
          peers={topology.peers}
          events={snapshot.recentEvents}
          onSelectPeer={(id) => selectedPeerId = id}
        />
        <DiscoveryPanel />
        <!-- Transitional: PendingTrustPanel stays until CommandQueue proves itself in the field. -->
        <PendingTrustPanel />
      </div>
    </div>

    <Tabs tabs={tabDefinitions} bind:activeTab>
      {#snippet content(tabId: string)}
        {#if tabId === 'stage' && topology}
          <StageView {topology} />
        {:else if tabId === 'engine' && snapshot}
          <EngineRoomView {snapshot} />
        {/if}
      {/snippet}
    </Tabs>

  {:else if !telemetryError}
    <EmptyState title="Connecting to swarm..." icon="swarm" />
  {/if}

  {#if selectedPeerId}
    <Modal open={true} onclose={closePeerModal} title="Peer Telemetry">
      <p>Deep dive for peer: <span class="mono" style="color: var(--accent);">{selectedPeerId.slice(0, 12)}...</span></p>
      <div class="mt-6 flex justify-end gap-2">
        <Button onclick={handleTogglePin}>
          {isPinned(selectedPeerId) ? 'Unpin' : 'Pin'}
        </Button>
        <Button onclick={closePeerModal}>Close</Button>
      </div>
    </Modal>
  {/if}

  <CommandQueue
    open={queueOpen}
    pendingPeers={pendingPeers}
    busyPeerId={busyPeerId}
    onclose={() => queueOpen = false}
    onTrust={(id) => void decideTrust(id, 'trust')}
    onReject={(id) => void decideTrust(id, 'reject')}
  />
</PageShell>