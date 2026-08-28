<!--
1. Relative path: cockpit/src/lib/components/PendingTrustPanel.svelte
2. Description: A Svelte 5 reactive component that displays peers in the "Pending Trust" state and allows the operator to cryptographically accept or reject them.
3. Expects: Svelte 5 runes for local state management.
4. Provides: A visual, interactive list of untrusted peers with Trust/Reject actions.
-->
<script lang="ts">
  import type { ObservabilityPeerInfo } from '$core/observability/index.js';

  let peers = $state<ObservabilityPeerInfo[]>([]);
  let isLoading = $state(true);

  async function fetchPeers() {
    try {
      const res = await fetch('/api/peers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { peers: ObservabilityPeerInfo[] };
      peers = data.peers.filter(p => p.trustState === 'pending');
    } catch (err) {
      console.error('[PendingTrustPanel] Failed to fetch peers:', err);
    } finally {
      isLoading = false;
    }
  }

  async function updateTrust(peerId: string, action: 'trust' | 'reject') {
    try {
      await fetch('/api/peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId, action }),
      });
      await fetchPeers(); // Refresh list
    } catch (err) {
      console.error('[PendingTrustPanel] Failed to update trust:', err);
    }
  }

  $effect(() => {
    fetchPeers();
    const interval = setInterval(fetchPeers, 3000);
    return () => clearInterval(interval);
  });
</script>

<div class="bg-slate-900 border border-yellow-600/50 rounded-xl p-6 shadow-lg">
  <h3 class="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
    <span class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
    Pending Trust
  </h3>

  {#if isLoading && peers.length === 0}
    <p class="text-slate-500 text-sm animate-pulse">Scanning for new peers...</p>
  {:else if peers.length === 0}
    <p class="text-slate-500 text-sm">No untrusted peers detected. All discovered nodes are verified.</p>
  {:else}
    <ul class="space-y-3">
      {#each peers as peer (peer.peerId)}
        <li class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-yellow-600/30">
          <div class="flex flex-col">
            <span class="font-mono text-cyan-400 text-sm">{peer.peerId.slice(0, 16)}...</span>
            <span class="text-xs text-slate-500">Discovered via {peer.source}</span>
          </div>
          <div class="flex gap-2">
            <button 
              onclick={() => updateTrust(peer.peerId, 'trust')}
              class="px-3 py-1 text-xs font-bold bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
            >
              Trust
            </button>
            <button 
              onclick={() => updateTrust(peer.peerId, 'reject')}
              class="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              Reject
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>