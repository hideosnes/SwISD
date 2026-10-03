<!--
1. Relative path: cockpit/src/lib/components/NodeDetailModal.svelte
2. Description: Modal for viewing and customizing a specific swarm node's identity and triggering manual pings.
3. Expects: Selected peer DTO, open state, and close callback.
4. Provides: A themed, accessible modal with TextField for naming, icon grid for device type, and a ping action button.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->
<script lang="ts">
  import type { TopologyPeerDTO } from '$lib/server/index.js';
  import type { DeviceType } from '$lib/components/datavis/types.js';
  import { Modal, TextField, Button, Icon, StatusPill } from '$lib/components/ui/index.js';
  import { peerOverrideStore } from '$lib/peerOverrides.svelte.js';

  import raspiIcon from '$lib/assets/icons/device-raspi.svg?raw';
  import arduinoIcon from '$lib/assets/icons/device-arduino.svg?raw';
  import androidIcon from '$lib/assets/icons/device-android.svg?raw';
  import iosIcon from '$lib/assets/icons/device-ios.svg?raw';
  import windowsIcon from '$lib/assets/icons/device-windows.svg?raw';
  import linuxIcon from '$lib/assets/icons/device-linux.svg?raw';
  import appleIcon from '$lib/assets/icons/device-apple.svg?raw';
  import unknownIcon from '$lib/assets/icons/device-unknown.svg?raw';

  interface Props {
    open: boolean;
    peer: TopologyPeerDTO | null;
    onclose: () => void;
  }

  let { open, peer, onclose }: Props = $props();

  const deviceOptions: { type: DeviceType; label: string; icon: string }[] = [
    { type: 'raspi', label: 'Raspberry Pi', icon: raspiIcon },
    { type: 'linux', label: 'Linux', icon: linuxIcon },
    { type: 'windows', label: 'Windows', icon: windowsIcon },
    { type: 'apple', label: 'Apple', icon: appleIcon },
    { type: 'android', label: 'Android', icon: androidIcon },
    { type: 'ios', label: 'iOS', icon: iosIcon },
    { type: 'arduino', label: 'Arduino', icon: arduinoIcon },
    { type: 'unknown', label: 'Unknown', icon: unknownIcon },
  ];

  let customName = $state('');
  let selectedIcon = $state<DeviceType>('unknown');
  let isPinging = $state(false);
  let pingStatus = $state<'idle' | 'success' | 'error'>('idle');
  let isRenaming = $state(false);
  let renameStatus = $state<'idle' | 'success' | 'error'>('idle');

  $effect(() => {
    if (peer && open) {
      const override = peerOverrideStore.getOverride(peer.peerId);
      customName = override?.name ?? peer.hostname ?? '';
      selectedIcon = override?.icon ?? peer.deviceType;
      pingStatus = 'idle';
      renameStatus = 'idle';
    }
  });

  function saveOverrides(): void {
    if (!peer) return;
    peerOverrideStore.setOverride(peer.peerId, {
      name: customName.trim() || undefined,
      icon: selectedIcon,
    });
  }

  async function triggerRename(): Promise<void> {
    if (!peer || !customName.trim() || isRenaming) return;
    isRenaming = true;
    renameStatus = 'idle';
    try {
      const res = await fetch('/api/system/hostname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: customName.trim() }),
      });
      if (!res.ok) throw new Error('Rename failed');
      renameStatus = 'success';
      // Optimistically update local override so UI reflects it instantly
      saveOverrides();
      setTimeout(() => { renameStatus = 'idle'; }, 2000);
    } catch (err) {
      console.error('[NodeDetailModal] Rename failed:', err);
      renameStatus = 'error';
    } finally {
      isRenaming = false;
    }
  }

  async function triggerPing(): Promise<void> {
    if (!peer || isPinging) return;
    isPinging = true;
    pingStatus = 'idle';
    try {
      const res = await fetch(`/api/peers/${encodeURIComponent(peer.peerId)}/ping`, { method: 'POST' });
      if (!res.ok) throw new Error('Ping failed');
      pingStatus = 'success';
      setTimeout(() => { pingStatus = 'idle'; }, 2000);
    } catch (err) {
      console.error('[NodeDetailModal] Ping failed:', err);
      pingStatus = 'error';
    } finally {
      isPinging = false;
    }
  }
</script>

<Modal {open} onclose={onclose} title={peer ? `Node Details: ${peer.peerId.slice(0, 8)}...` : 'Node Details'}>
  {#if peer}
    <div class="space-y-4">
      <!-- Custom Name (Global Mutation) -->
      <div class="space-y-2">
        <TextField
          id="node-custom-name"
          label="Swarm Hostname"
          bind:value={customName}
          helper="Updates the core's persistent mDNS hostname globally."
        />
        <div class="flex justify-end">
          <Button 
            variant="primary" 
            size="sm" 
            onclick={triggerRename} 
            disabled={isRenaming || !customName.trim()}
          >
            {isRenaming ? 'Updating...' : 'Update Hostname'}
          </Button>
        </div>
        {#if renameStatus === 'success'}
          <p class="text-xs text-live text-right">Hostname updated successfully.</p>
        {:else if renameStatus === 'error'}
          <p class="text-xs text-danger text-right">Failed to update hostname.</p>
        {/if}
      </div>

      <!-- Icon Selector -->
      <div>
        <div class="text-xs font-semibold uppercase tracking-wider text-text-2 mb-2">Local Display Icon</div>
        <div class="grid grid-cols-4 gap-2" role="group" aria-label="Device Icon selection">
          {#each deviceOptions as opt}
            <button
              type="button"
              class="icon-picker-btn"
              class:icon-picker-btn--active={selectedIcon === opt.type}
              onclick={() => { selectedIcon = opt.type; saveOverrides(); }}
              aria-label={`Select ${opt.label} icon`}
              aria-pressed={selectedIcon === opt.type}
            >
              <div class="icon-svg">{@html opt.icon}></div>
              <span class="icon-label">{opt.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Manual Ping -->
      <div class="flex items-center justify-between rounded-sm border border-border bg-bg p-3">
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-text-1">Manual Liveness Check</span>
          <span class="text-xs text-text-3">Force an immediate ping to this peer.</span>
        </div>
        <div class="flex items-center gap-2">
          {#if pingStatus === 'success'}
            <StatusPill status="live" label="Pinged" />
          {:else if pingStatus === 'error'}
            <StatusPill status="warn" label="Failed" />
          {/if}
          <Button 
            variant="secondary" 
            size="sm" 
            icon="wifi_tethering" 
            onclick={triggerPing} 
            disabled={isPinging}
          >
            {isPinging ? 'Pinging...' : 'Ping'}
          </Button>
        </div>
      </div>

      <!-- Raw Metadata -->
      <div class="rounded-sm border border-border bg-bg p-3 font-mono text-xs">
        <div class="flex justify-between py-1">
          <span class="text-text-3">Peer ID</span>
          <span class="text-text-1">{peer.peerId}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-text-3">mDNS Hostname</span>
          <span class="text-text-1">{peer.hostname ?? 'N/A'}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-text-3">Trust State</span>
          <span class="text-text-1 uppercase">{peer.trustState}</span>
        </div>
      </div>
    </div>

    {#snippet footer()}
      <Button variant="ghost" onclick={onclose}>Close</Button>
    {/snippet}
  {/if}
</Modal>

<style>
  @layer components {
    .icon-picker-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 4px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease);
    }
    .icon-picker-btn:hover {
      border-color: var(--accent-2);
      background: var(--surface-2);
    }
    .icon-picker-btn--active {
      border-color: var(--accent);
      background: var(--surface-2);
      box-shadow: 0 0 0 1px var(--accent);
    }
    .icon-svg {
      width: 24px;
      height: 24px;
      color: var(--text-1);
    }
    .icon-svg :global(svg) {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
    .icon-picker-btn--active .icon-svg {
      color: var(--accent);
    }
    .icon-label {
      font-size: 10px;
      color: var(--text-3);
      text-align: center;
      line-height: 1.2;
    }
    .icon-picker-btn--active .icon-label {
      color: var(--text-1);
      font-weight: 600;
    }
  }
</style>