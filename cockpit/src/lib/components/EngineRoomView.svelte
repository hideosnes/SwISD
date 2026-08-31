<!--
1. Relative path: cockpit/src/lib/components/EngineRoomView.svelte
2. Description: The Sysadmin-focused, task-centric view of the swarm's technical telemetry.
3. Expects: The local ObservabilitySnapshot to render backpressure, load, and task queues.
4. Provides: A dense, technical dashboard of the Conductor's local state and swarm bottlenecks.
-->
<script lang="ts">
  import type { SwarmSnapshot } from '$core/observability/index.js';
  import { Card, Stat, Panel } from '$lib/components/ui/index.js';

  let { snapshot }: { snapshot: SwarmSnapshot } = $props();
  
  const loadPercent = $derived((snapshot.load.loadScore * 100).toFixed(1));
</script>

<div class="engine-grid">
  <Card title="Conductor Telemetry">
    <div class="engine-stats">
      <Stat label="CPU / Load Score" value={`${loadPercent}%`} />
      <Stat label="Backpressure" value={snapshot.load.backpressureState.toUpperCase()} />
      <Stat label="Active Tasks" value={snapshot.tasks.active.length.toString()} />
      <Stat label="Queued Tasks" value={snapshot.tasks.queued.length.toString()} />
    </div>
  </Card>

  <Card title="Network & CRDT">
    <div class="engine-stats">
      <Stat label="Known Peers" value={snapshot.network.knownPeers.length.toString()} />
      <Stat label="Neighbors" value={snapshot.network.neighborCount.toString()} />
      <Stat label="Gossip" value={snapshot.network.gossipEnabled ? 'ACTIVE' : 'DISABLED'} />
      <Stat label="Rep. Events" value={snapshot.crdt.reputationEventCount.toString()} />
    </div>
  </Card>

  <div class="engine-events">
    <Panel title="Recent Events">
      <ul class="event-list">
        {#each snapshot.recentEvents.slice(0, 5) as event (event.sequence)}
          <li class="event-item" class:event-item--warn={event.level === 'warn'} class:event-item--error={event.level === 'error'}>
            <span class="event-topic">[{event.topic}]</span>
            <span class="event-msg">{event.message}</span>
          </li>
        {:else}
          <li class="event-empty">No recent events.</li>
        {/each}
      </ul>
    </Panel>
  </div>
</div>

<style>
  @layer components {
    .engine-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .engine-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .engine-events {
      grid-column: 1 / -1;
    }
    .event-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
    }
    .event-item {
      display: flex;
      gap: 0.5rem;
      color: var(--text);
    }
    .event-item--warn { color: var(--warning, #eab308); }
    .event-item--error { color: var(--danger, #ef4444); }
    .event-topic {
      color: var(--accent);
      font-weight: 600;
      min-width: 80px;
    }
    .event-empty {
      color: var(--text-muted, var(--text));
      font-style: italic;
    }
  }
</style>