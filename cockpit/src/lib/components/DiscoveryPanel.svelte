<!--
1. Relative path: cockpit/src/lib/components/DiscoveryPanel.svelte
2. Description: A Svelte 5 reactive component that polls the BFF for mDNS-discovered swarm nodes.
3. Expects: Svelte 5 runes for local state management and strict theme tokens from layout.css.
4. Provides: A visual, auto-updating list of available Conductor nodes on the local network.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->
<script lang="ts">
  interface DiscoveredNode {
    peerId: string;
    hostname: string;
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

  $effect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 3000);
    return () => clearInterval(interval);
  });
</script>

<div class="bg-surface border border-border rounded-lg p-6 shadow-lg">
  <h3 class="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
    <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
    Discovered Swarm Nodes
  </h3>

  {#if isLoading && nodes.length === 0}
    <p class="text-text-3 text-sm animate-pulse">Scanning local network...</p>
  {:else if nodes.length === 0}
    <p class="text-text-3 text-sm">No swarm nodes discovered yet. Ensure the core engine is running on the same network.</p>
  {:else}
    <ul class="space-y-3">
      {#each nodes as node (node.peerId)}
        <li class="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border hover:border-accent transition-colors">
          <div class="flex flex-col">
            <!-- PRIMARY: Friendly hostname (or peer ID slice if unknown) -->
            <span class="font-bold text-text-1 text-sm">
              {node.hostname !== 'unknown' ? node.hostname : node.peerId.slice(0, 16)}
            </span>
            <!-- SECONDARY: Raw peer ID in small monospace -->
            <span class="mono text-text-3 text-xs">{node.peerId}</span>
            <span class="text-text-3 text-xs">{node.host}:{node.port}</span>
          </div>
          <div class="flex flex-col items-end">
            <span class="uppercase text-xs font-bold text-accent">{node.role}</span>
            <span class="text-xs text-text-2">v{node.version}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>