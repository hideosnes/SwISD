<!--
1. Relative path: cockpit/src/lib/components/EngineRoomView.svelte
2. Description: Sysadmin-focused view of the swarm, highlighting bottlenecks, backpressure, technical telemetry, and node management.
3. Expects: SwarmSnapshot and SwarmTopologyDTO from the BFF.
4. Provides: A structured layout of Conductor telemetry, network/CRDT stats, recent events, and a manageable node list with OTA update controls.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->
<script lang="ts">
  import type { SwarmSnapshot } from '$core/observability/index.js';
  import type { SwarmTopologyDTO, TopologyPeerDTO } from '$lib/server/index.js';
  import { Card, Stat, StatusPill, Button, Panel } from '$lib/components/ui/index.js';
  import UpdateApprovalModal from './UpdateApprovalModal.svelte';

  interface Props {
    snapshot: SwarmSnapshot;
    topology: SwarmTopologyDTO;
  }

  let { snapshot, topology }: Props = $props();

  let updateModalOpen = $state(false);
  let updateTarget = $state<{ type: 'all' | 'single'; peerId?: string; description: string } | null>(null);
  let isUpdating = $state(false);
  let updateResults = $state<{ peerId: string; hostname: string; ok: boolean; message: string }[]>([]);

  function openUpdateModal(type: 'all' | 'single', peer?: TopologyPeerDTO): void {
    if (type === 'all') {
      updateTarget = { type: 'all', description: `All ${topology.peers.length} discovered nodes` };
    } else if (peer) {
      updateTarget = { 
        type: 'single', 
        peerId: peer.peerId, 
        description: `${peer.hostname || peer.peerId.slice(0, 12)} (${peer.peerId})` 
      };
    }
    updateModalOpen = true;
    updateResults = [];
  }

  async function confirmUpdate(): Promise<void> {
    if (!updateTarget || isUpdating) return;
    isUpdating = true;
    try {
      const res = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId: updateTarget.peerId }),
      });
      
      if (!res.ok) throw new Error(`Update request failed: ${res.status}`);
      const data = await res.json() as { results: { peerId: string; hostname: string; ok: boolean; message: string }[] };
      updateResults = data.results;
    } catch (err) {
      console.error('[EngineRoomView] Update failed:', err);
      updateResults = [{ peerId: 'unknown', hostname: 'unknown', ok: false, message: String(err) }];
    } finally {
      isUpdating = false;
    }
  }

  function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }
</script>

<div class="space-y-6">
  <!-- Header with Broadcast Update -->
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-text-1">Engine Room</h2>
    <Button 
      variant="secondary" 
      icon="system_update" 
      onclick={() => openUpdateModal('all')}
      disabled={topology.peers.length === 0}
    >
      Update All Nodes
    </Button>
  </div>

  <!-- Telemetry Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card title="Conductor Load">
      <Stat label="Load Score" value={`${(snapshot.load.loadScore * 100).toFixed(1)}%`} />
      <Stat label="State" value={snapshot.load.backpressureState.toUpperCase()} />
    </Card>
    <Card title="CRDT Health">
      <Stat label="Reputation Events" value={snapshot.crdt.reputationEventCount.toString()} />
      <Stat label="Task History" value={snapshot.crdt.taskHistoryEventCount.toString()} />
    </Card>
    <Card title="Delivery">
      <Stat label="Supervisor" value={snapshot.delivery.supervisorPresent ? 'Active' : 'Missing'} />
      <Stat label="App Version" value={snapshot.delivery.currentAppVersion ?? 'Unknown'} />
    </Card>
  </div>

  <!-- Node List with Per-Node Update -->
  <Panel index="01" title="Swarm Nodes">
    {#if topology.peers.length === 0}
      <p class="text-sm text-text-3">No nodes discovered yet.</p>
    {:else}
      <div class="space-y-3">
        {#each topology.peers as peer (peer.peerId)}
          <div class="flex items-center justify-between rounded-sm border border-border bg-bg p-4">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-text-1">{peer.hostname || peer.peerId.slice(0, 12)}</span>
                <StatusPill 
                  status={peer.presence === 'online' ? 'live' : 'idle'} 
                  label={peer.presence.toUpperCase()} 
                />
                <StatusPill 
                  status={peer.trustState === 'trusted' ? 'accent' : 'warn'} 
                  label={peer.trustState.toUpperCase()} 
                />
              </div>
              <span class="mono text-xs text-text-3">{peer.peerId}</span>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="text-xs text-text-3">Load</div>
                <div class="font-mono text-sm text-text-1">{peer.loadScore !== null ? `${(peer.loadScore * 100).toFixed(0)}%` : 'N/A'}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                icon="system_update" 
                onclick={() => openUpdateModal('single', peer)}
                disabled={peer.presence === 'offline'}
                aria-label={`Update ${peer.hostname || peer.peerId}`}
              >
                Update
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Update Results Feedback -->
    {#if updateResults.length > 0}
      <div class="mt-4 rounded-sm border border-border bg-bg p-4">
        <h4 class="text-sm font-semibold text-text-1 mb-2">Update Results</h4>
        <ul class="space-y-2">
          {#each updateResults as result (result.peerId)}
            <li class="flex items-center justify-between text-sm">
              <span class="mono text-text-2">{result.hostname || result.peerId.slice(0, 12)}</span>
              <span class={result.ok ? 'text-live' : 'text-danger'}>
                {result.ok ? 'Success' : 'Failed'}: {result.message}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </Panel>

  <!-- Recent Events Log -->
  <Panel index="02" title="Recent Events">
    <div class="space-y-2 max-h-64 overflow-y-auto">
      {#each snapshot.recentEvents.slice().reverse() as event (event.sequence)}
        <div class="flex gap-3 text-xs font-mono">
          <span class="text-text-3">{new Date(event.timestamp).toLocaleTimeString()}</span>
          <span class={
            event.level === 'error' ? 'text-danger' : 
            event.level === 'warn' ? 'text-warn' : 'text-live'
          }>[{event.level.toUpperCase()}]</span>
          <span class="text-text-1">{event.message}</span>
        </div>
      {/each}
    </div>
  </Panel>

  <!-- Update Approval Modal -->
  {#if updateTarget}
    <UpdateApprovalModal
      open={updateModalOpen}
      targetDescription={updateTarget.description}
      isUpdating={isUpdating}
      onconfirm={confirmUpdate}
      oncancel={() => { updateModalOpen = false; updateTarget = null; }}
    />
  {/if}
</div>