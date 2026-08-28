<!--
1. Relative path: cockpit/src/lib/components/DiscoveryPanel.svelte
2. Description: A Svelte 5 reactive component that polls the BFF for mDNS-discovered swarm nodes.
3. Expects: Svelte 5 runes for local state management.
4. Provides: A visual, auto-updating list of available Conductor nodes on the local network.
-->
<script lang="ts">
  interface DiscoveredNode {
    peerId: string;
    role: string;
    version: string;
    host: string;
    port: number;
    lastSeen: number;
  }

  let nodes = $state<DiscoveredNode[]>([]);
  let isLoading = $state(true);

  async function fetchNodes() {
    try {
      const res = await fetch('/api/discovery');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { nodes: DiscoveredNode[] };
      nodes = data.nodes;
    } catch (err) {
      console.error('[DiscoveryPanel] Failed to fetch nodes:', err);
    } finally {
      isLoading = false;
    }
  }

  // Poll every 3 seconds
  $effect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 3000);
    return () => clearInterval(interval);
  });
</script>

<div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
  <h3 class="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
    <span class="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
    Discovered Swarm Nodes
  </h3>

  {#if isLoading && nodes.length === 0}
    <p class="text-slate-500 text-sm animate-pulse">Scanning local network...</p>
  {:else if nodes.length === 0}
    <p class="text-slate-500 text-sm">No swarm nodes discovered yet. Ensure the core engine is running on the same network.</p>
  {:else}
    <ul class="space-y-3">
      {#each nodes as node (node.peerId)}
        <li class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-fuchsia-500/50 transition-colors">
          <div class="flex flex-col">
            <span class="font-mono text-cyan-400 text-sm">{node.peerId.slice(0, 16)}...</span>
            <span class="text-xs text-slate-500">{node.host}:{node.port}</span>
          </div>
          <div class="flex flex-col items-end">
            <span class="uppercase text-xs font-bold text-fuchsia-400">{node.role}</span>
            <span class="text-xs text-slate-400">v{node.version}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>