<!--
1. Relative path: cockpit/src/lib/components/CommandQueue.svelte
2. Description: Operator action queue. Composes ui/Drawer to surface decisions that need a human hand — trust approvals today; WiFi setup and model approvals tomorrow.
3. Expects: Pending peer DTOs, drawer state, busy indicator, and decision callbacks owned by the route.
4. Provides: A right-edge actionable drawer with keyboard-accessible approve/reject actions and an honest empty state.
-->
<script lang="ts">
  import type { TopologyPeerDTO } from '$lib/server/index.js';
  import { Button, Drawer, EmptyState, StatusPill } from '$lib/components/ui/index.js';

  interface Props {
    open: boolean;
    pendingPeers: ReadonlyArray<TopologyPeerDTO>;
    busyPeerId: string | null;
    onclose: () => void;
    onTrust: (peerId: string) => void;
    onReject: (peerId: string) => void;
  }

  let { open, pendingPeers, busyPeerId, onclose, onTrust, onReject }: Props = $props();

  function formatDiscoveredAt(timestamp: number): string {
    const ageMs = Date.now() - timestamp;
    const minutes = Math.floor(ageMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
</script>

<Drawer {open} onclose={onclose} title="Command Queue">
  <div class="queue">
    <p class="queue__subtitle">Decisions that need your hands.</p>

    {#if pendingPeers.length === 0}
      <EmptyState title="Queue clear" icon="swarm" />
    {:else}
      <ul class="queue__list">
        {#each pendingPeers as peer (peer.peerId)}
          <li class="queue__item">
            <div class="queue__item-head">
              <span class="mono queue__peer">{peer.peerId.slice(0, 12)}</span>
              <StatusPill status="warn" label="pending" />
            </div>
            <dl class="queue__meta">
              <div class="queue__meta-row">
                <dt>Source</dt>
                <dd>{peer.source}</dd>
              </div>
              <div class="queue__meta-row">
                <dt>Seen</dt>
                <dd>{formatDiscoveredAt(peer.discoveredAt)}</dd>
              </div>
            </dl>
            <div class="queue__actions">
              <Button onclick={() => onTrust(peer.peerId)}>
                {busyPeerId === peer.peerId ? 'Working…' : 'Trust'}
              </Button>
              <Button onclick={() => onReject(peer.peerId)}>
                Reject
              </Button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Drawer>

<style>
  @layer components {
    .queue {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .queue__subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, var(--text));
    }
    .queue__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .queue__item {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--surface);
      border-radius: var(--r-sm);
    }
    .queue__item-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .queue__peer {
      font-size: 0.875rem;
      color: var(--text);
    }
    .queue__meta {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.75rem;
    }
    .queue__meta-row {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .queue__meta-row dt {
      color: var(--text-muted, var(--text));
    }
    .queue__meta-row dd {
      margin: 0;
      color: var(--text);
    }
    .queue__actions {
      display: flex;
      gap: 0.5rem;
    }
  }
</style>