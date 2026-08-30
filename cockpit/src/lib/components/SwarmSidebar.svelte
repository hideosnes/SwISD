<!--
1. Relative path: cockpit/src/lib/components/SwarmSidebar.svelte
2. Description: Right-hand cockpit rail. Pinned peers on top for prolonged control; scrollable informational event log on the bottom.
3. Expects: Swarm topology peers, observability events, and a peer-selection callback owned by the route.
4. Provides: Persistent sidebar composition with keyboard-accessible pin/unpin and a polite live log region.
-->
<script lang="ts">
  import type { ObservabilityEvent } from '$core/observability/index.js';
  import type { TopologyPeerDTO } from '$lib/server/index.js';
  import { Badge, EmptyState, StatusPill } from '$lib/components/ui/index.js';
  import { trustToStatus } from '$lib/adapters/index.js';
  import { getPinnedPeerIds, togglePin } from '$lib/pins.svelte.js';

  interface Props {
    peers: ReadonlyArray<TopologyPeerDTO>;
    events: ReadonlyArray<ObservabilityEvent>;
    onSelectPeer: (peerId: string) => void;
  }

  let { peers, events, onSelectPeer }: Props = $props();

  const pinnedIds = $derived(getPinnedPeerIds());
  const pinnedPeers = $derived(
    pinnedIds
      .map((id) => peers.find((peer) => peer.peerId === id))
      .filter((peer): peer is TopologyPeerDTO => peer !== undefined),
  );

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour12: false });
  }
</script>

<aside class="sidebar" aria-label="Swarm sidebar">
  <section class="sidebar__section">
    <header class="sidebar__header">
      <h2 class="sidebar__title">Pinned</h2>
      <Badge count={pinnedPeers.length} />
    </header>

    {#if pinnedPeers.length === 0}
      <p class="sidebar__hint">Pin a peer from its telemetry modal to keep it here.</p>
    {:else}
      <ul class="sidebar__pins">
        {#each pinnedPeers as peer (peer.peerId)}
          <li class="pin-row">
            <button
              type="button"
              class="pin-row__select"
              onclick={() => onSelectPeer(peer.peerId)}
            >
              <span class="mono">{peer.peerId.slice(0, 10)}</span>
              <StatusPill status={trustToStatus(peer.trustState)} label={peer.trustState} />
            </button>
            <button
              type="button"
              class="pin-row__unpin"
              aria-label="Unpin peer {peer.peerId.slice(0, 10)}"
              onclick={() => togglePin(peer.peerId)}
            >
              ×
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="sidebar__section sidebar__section--log">
    <header class="sidebar__header">
      <h2 class="sidebar__title">Log</h2>
      <Badge count={events.length} />
    </header>

    {#if events.length === 0}
      <EmptyState title="No events yet" icon="swarm" />
    {:else}
      <ul class="log" role="log" aria-label="Swarm event log">
        {#each events as event (event.sequence)}
          <li
            class="log__row"
            class:log__row--warn={event.level === 'warn'}
            class:log__row--error={event.level === 'error'}
          >
            <span class="log__time">{formatTime(event.timestamp)}</span>
            <span class="log__topic">[{event.topic}]</span>
            <span class="log__msg">{event.message}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</aside>

<style>
  @layer components {
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
    }
    .sidebar__section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .sidebar__section--log {
      flex: 1;
      min-height: 0;
    }
    .sidebar__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .sidebar__title {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, var(--text));
    }
    .sidebar__hint {
      font-size: 0.875rem;
      font-style: italic;
      color: var(--text-muted, var(--text));
    }
    .sidebar__pins {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .pin-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .pin-row__select {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
      color: var(--text);
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .pin-row__select:hover {
      background: var(--surface-2);
    }
    .pin-row__select:focus-visible {
      outline: 2px solid var(--focus-ring, var(--accent));
      outline-offset: 2px;
    }
    .pin-row__unpin {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      background: transparent;
      border: none;
      border-radius: var(--r-sm);
      color: var(--text-muted, var(--text));
      font-size: 1rem;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    .pin-row__unpin:hover {
      color: var(--warn);
    }
    .pin-row__unpin:focus-visible {
      outline: 2px solid var(--focus-ring, var(--accent));
      outline-offset: 2px;
    }
    .log {
      list-style: none;
      margin: 0;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      max-height: 20rem;
      overflow-y: auto;
      background: var(--surface);
      border-radius: var(--r-sm);
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }
    .log__row {
      display: flex;
      gap: 0.5rem;
      color: var(--text);
    }
    .log__row--warn {
      color: var(--warn);
    }
    .log__row--error {
      color: var(--danger, var(--warn));
    }
    .log__time {
      color: var(--text-muted, var(--text));
      flex-shrink: 0;
    }
    .log__topic {
      color: var(--accent);
      flex-shrink: 0;
    }
    .log__msg {
      overflow-wrap: anywhere;
    }
  }
</style>