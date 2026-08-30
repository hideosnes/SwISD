<!--
1. Relative path: cockpit/src/lib/components/StageView.svelte
2. Description: The Artist-focused, peer-centric view of the swarm.
3. Expects: The SwarmTopologyDTO to render peer cards.
4. Provides: A masonry-style grid of PeerCards showing what each Pi is doing.
-->
<script lang="ts">
  import type { SwarmTopologyDTO } from '$lib/server/index.js';
  import { Card, Stat, StatusPill } from '$lib/components/ui/index.js';
  import { trustToStatus } from '$lib/adapters/index.js';

  let { topology }: { topology: SwarmTopologyDTO } = $props();
</script>

<div class="stage-grid">
  {#each topology.peers as peer (peer.peerId)}
    <div class="stage-card-wrapper">
      <Card title={peer.peerId.slice(0, 8)}>
        <header class="stage-card__header">
          <StatusPill status={trustToStatus(peer.trustState)} label={peer.trustState} />
        </header>
        
        <div class="stage-card__body">
          <Stat label="Active Tasks" value={peer.activeTaskCount?.toString() ?? '—'} />
          <Stat label="Capabilities" value={peer.capabilities.length > 0 ? peer.capabilities.join(', ') : 'None'} />
        </div>
      </Card>
    </div>
  {:else}
    <p class="stage-empty">No peers in the swarm yet.</p>
  {/each}
</div>

<style>
  @layer components {
    .stage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .stage-card-wrapper { display: flex; flex-direction: column; }
    .stage-card__header { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
    .stage-card__body { display: flex; flex-direction: column; gap: 0.5rem; }
    .stage-empty { grid-column: 1 / -1; text-align: center; color: var(--text-muted, var(--text)); font-style: italic; padding: 2rem 0; }
  }
</style>