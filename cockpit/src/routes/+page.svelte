<!--
1. Relative path: cockpit/src/routes/+page.svelte
2. Description: The main Conductor Cockpit dashboard. Polls the BFF for live swarm metrics, topology, and sovereignty state.
3. Expects: Svelte 5 runes, typed BFF API responses, and composable UI primitives.
4. Provides: A real-time, accessible, and strictly themed view of the swarm.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->
<script lang="ts">
  import type { SwarmSnapshot } from '$core/observability/index.js';
  import type { SwarmTopologyDTO } from '$lib/server/index.js';
  import { TopologyCanvas } from '$lib/components/datavis/index.js';
  import { Badge, Button, Card, EmptyState, Modal, PageShell, Stat, StatusPill, Tabs, type TabDefinition } from '$lib/components/ui/index.js';
  import { isPinned, togglePin } from '$lib/pins.svelte.js';

  import DiscoveryPanel from '$lib/components/DiscoveryPanel.svelte';
  import StageView from '$lib/components/StageView.svelte';
  import EngineRoomView from '$lib/components/EngineRoomView.svelte';
  import SwarmSidebar from '$lib/components/SwarmSidebar.svelte';
  import CommandQueue from '$lib/components/CommandQueue.svelte';
  import ReplayControlModal from '$lib/components/ReplayControlModal.svelte';
  import FoundingModal from '$lib/components/FoundingModal.svelte';
  import RecoveryPhraseDisplay from '$lib/components/RecoveryPhraseDisplay.svelte';
  import NodeDetailModal from '$lib/components/NodeDetailModal.svelte';
  
  let snapshot = $state<SwarmSnapshot | null>(null);
  let topology = $state<SwarmTopologyDTO | null>(null);
  let selectedPeerId = $state<string | null>(null);
  let telemetryError = $state<string | null>(null);
  let activeTab = $state<'stage' | 'engine'>('stage');

  let queueOpen = $state(false);
  let busyPeerId = $state<string | null>(null);
  let replayModalOpen = $state(false);
  
  // Sovereignty State
  let isBonded = $state(false);
  let setupOpen = $state(false);
  let recoveryPhrase = $state<string | null>(null);

  const pendingPeers = $derived(
    topology?.peers.filter((peer) => peer.trustState === 'pending') ?? [],
  );

  const isGenesis = $derived(
    topology !== null && topology.peers.length === 0 && !telemetryError
  );

  const tabDefinitions: ReadonlyArray<TabDefinition> = [
    { id: 'stage', label: 'Stage' },
    { id: 'engine', label: 'Engine Room' },
  ];

  async function fetchTelemetry(): Promise<void> {
    try {
      const [snapRes, topoRes, ownRes] = await Promise.all([
        fetch('/api/snapshot'),
        fetch('/api/topology'),
        fetch('/api/ownership/status')
      ]);

      if (!snapRes.ok || !topoRes.ok) {
        throw new Error(`Telemetry unavailable (${snapRes.status}/${topoRes.status})`);
      }

      snapshot = await snapRes.json() as SwarmSnapshot;
      topology = await topoRes.json() as SwarmTopologyDTO;
      
      if (ownRes.ok) {
        const ownData = await ownRes.json() as { isBonded: boolean };
        isBonded = ownData.isBonded;
      }
      
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

  $effect(() => {
    void fetchTelemetry();
    const interval = setInterval(() => void fetchTelemetry(), 2000);
    return () => clearInterval(interval);
  });
</script>

<PageShell>
  <header class="mb-8 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-3xl font-bold" style="color: var(--accent);">Conductor Cockpit</h1>
      {#if snapshot?.source === 'replay'}
        <StatusPill status="warn" label="REPLAY" />
      {/if}
      {#if import.meta.env.DEV}
        <Button variant="ghost" size="sm" onclick={() => replayModalOpen = true}>
          Replay Deck
        </Button>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if !isBonded}
        <Button variant="primary" onclick={() => setupOpen = true}>
          Found Swarm
        </Button>
      {/if}
      <Button
        onclick={() => queueOpen = true}
        aria-label="Open command queue, {pendingPeers.length} pending actions"
      >
        Actions
        <Badge count={pendingPeers.length} />
      </Button>
    </div>
  </header>

  {#if telemetryError}
    <Card title="Connection Error">
      <p style="color: var(--danger);">{telemetryError}</p>
    </Card>
  {:else if snapshot && topology}
    <div class="dashboard-grid" class:genesis-inactive={isGenesis}>
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
    </div>

    {#if isGenesis}
      <div class="genesis-overlay" role="alert" aria-live="polite">
        <div class="genesis-content">
          <div class="genesis-spinner" aria-label="Searching for swarm"></div>
          <h2 class="text-2xl font-bold mt-6" style="color: var(--text-2);">Searching for swarm...</h2>
          <p class="mt-2 text-center" style="color: var(--text-3);">The cockpit will wake up when the first peer connects.</p>
        </div>
      </div>
    {/if}
  {:else}
    <EmptyState title="Connecting to swarm..." icon="swarm" />
  {/if}

  <NodeDetailModal 
    open={selectedPeerId !== null} 
    peer={topology?.peers.find(p => p.peerId === selectedPeerId) ?? null} 
    onclose={() => selectedPeerId = null} 
  />

  <CommandQueue
    open={queueOpen}
    pendingPeers={pendingPeers}
    busyPeerId={busyPeerId}
    onclose={() => queueOpen = false}
    onTrust={(id) => void decideTrust(id, 'trust')}
    onReject={(id) => void decideTrust(id, 'reject')}
  />

  {#if import.meta.env.DEV}
    <ReplayControlModal open={replayModalOpen} onclose={() => replayModalOpen = false} />
  {/if}

  <FoundingModal 
    open={setupOpen && !recoveryPhrase} 
    onclose={() => setupOpen = false} 
    onfound={(phrase) => { recoveryPhrase = phrase; }} 
  />

  <RecoveryPhraseDisplay 
    open={recoveryPhrase !== null} 
    phrase={recoveryPhrase ?? ''} 
    onclose={() => { recoveryPhrase = null; setupOpen = false; void fetchTelemetry(); }} 
  />
</PageShell>

<style>
  @layer components {
    .dashboard-grid {
      transition: filter 0.5s ease, opacity 0.5s ease;
    }
    .genesis-inactive {
      filter: grayscale(100%) blur(2px);
      opacity: 0.3;
      pointer-events: none;
      user-select: none;
    }
    .genesis-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      pointer-events: auto;
    }
    .genesis-content {
      text-align: center;
      padding: 2rem;
    }
    .genesis-spinner {
      width: 64px;
      height: 64px;
      border: 4px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 1.5s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }
</style>