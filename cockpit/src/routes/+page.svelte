<!--
1. Relative path: cockpit/src/routes/+page.svelte
2. Description: The main dashboard view, polling the BFF for live swarm metrics.
3. Expects: Svelte 5 runes for reactive state management.
4. Provides: A real-time, auto-updating display of the swarm's process, load, and delivery status.
-->
<script lang="ts">
  import type { ObservabilitySnapshot } from '$core/observability/index.js';
  import DiscoveryPanel from '$lib/components/DiscoveryPanel.svelte';

  let snapshot = $state<ObservabilitySnapshot | null>(null);
  let error = $state<string | null>(null);

  async function fetchSnapshot() {
    try {
      const res = await fetch('/api/snapshot');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      snapshot = await res.json() as ObservabilitySnapshot;
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  // Poll every 2 seconds
  $effect(() => {
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 2000);
    return () => clearInterval(interval);
  });
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold text-fuchsia-400">Swarm Topology</h1>

  {#if error}
    <div class="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
      Connection Error: {error}
    </div>
  {/if}

  {#if snapshot}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Process Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 class="text-lg font-semibold text-slate-300 mb-4">Process</h3>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">Peer ID</dt><dd class="font-mono text-cyan-400">{snapshot.process.peerId}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Version</dt><dd class="font-mono">{snapshot.process.version}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Role</dt><dd class="uppercase font-bold text-fuchsia-400">{snapshot.process.role}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Uptime</dt><dd>{(snapshot.process.uptimeMs / 1000).toFixed(1)}s</dd></div>
        </dl>
      </div>

      <!-- Load Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 class="text-lg font-semibold text-slate-300 mb-4">Load</h3>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">Score</dt><dd class="font-mono">{(snapshot.load.loadScore * 100).toFixed(1)}%</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">State</dt><dd class="uppercase font-bold" class:text-green-400={snapshot.load.backpressureState === 'idle'} class:text-yellow-400={snapshot.load.backpressureState === 'throttled'} class:text-red-400={snapshot.load.backpressureState === 'shedding'}>{snapshot.load.backpressureState}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Active Tasks</dt><dd>{snapshot.load.activeTaskCount}</dd></div>
        </dl>
      </div>

      <!-- Delivery Card -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 class="text-lg font-semibold text-slate-300 mb-4">Delivery</h3>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">Supervisor</dt><dd class="font-mono" class:text-green-400={snapshot.delivery.supervisorPresent} class:text-red-400={!snapshot.delivery.supervisorPresent}>{snapshot.delivery.supervisorPresent ? 'ONLINE' : 'OFFLINE'}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">App Version</dt><dd class="font-mono">{snapshot.delivery.currentAppVersion ?? 'N/A'}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Heartbeat</dt><dd class="font-mono" class:text-green-400={snapshot.delivery.heartbeatOk} class:text-red-400={!snapshot.delivery.heartbeatOk}>{snapshot.delivery.heartbeatOk ? 'OK' : 'STALE'}</dd></div>
        </dl>
      </div>

      <!-- Discovery Panel -->
      <div class="lg:col-span-1">
        <DiscoveryPanel />
      </div>
    </div>
  {:else if !error}
    <div class="text-slate-500 animate-pulse">Connecting to swarm...</div>
  {/if}
</div>