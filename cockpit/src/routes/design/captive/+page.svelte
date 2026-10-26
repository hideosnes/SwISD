<!--
1. Relative path: cockpit/src/routes/design/captive/+page.svelte
2. Description: Fullscreen mobile captive-portal design bench. Renders exactly what a smartphone captive webview shows — no cockpit shell, no device chrome — so the operator can click through the provisioning flow under device emulation.
3. Expects: The UI primitive barrel at $lib/components/ui, layout.css tokens loaded globally, and SvelteKit's $app/state page store for the invisible failure hook.
4. Provides: A token-themed, fullscreen captive-portal walkthrough (idle → joining → joined, with a failure branch reachable via ?simulate=fail).
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import { Button, TextField, Select, Toggle, Icon, ProgressRing } from '#lib/components/ui';
  import { page } from '$app/state';

  type PortalState = 'idle' | 'joining' | 'joined' | 'failed';

  const SECURITY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'wpa2-psk', label: 'WPA2 Personal' },
    { value: 'wpa3-sae', label: 'WPA3 Personal' },
    { value: 'open', label: 'Open (no password)' }
  ];

  let portalState = $state<PortalState>('idle');
  let errorMsg = $state('');
  let showPass = $state(false);

  let ssid = $state('');
  let country = $state('AT');
  let security = $state('wpa2-psk');
  let passphrase = $state('');
  let hidden = $state(false);
  let temporary = $state(false);

  let joinProgress = $state(0);
  let joinTimer: ReturnType<typeof setInterval> | null = null;

  const simulateFailure = $derived(page.url.searchParams.get('simulate') === 'fail');

  function clearTimer(): void {
    if (joinTimer !== null) {
      clearInterval(joinTimer);
      joinTimer = null;
    }
  }

  function handleSubmit(e: SubmitEvent): void {
    e.preventDefault();
    clearTimer();
    portalState = 'joining';
    joinProgress = 0;

    joinTimer = setInterval(() => {
      joinProgress = Math.min(100, joinProgress + 12);
      if (joinProgress >= 100) {
        clearTimer();
        setTimeout(() => {
          if (simulateFailure) {
            portalState = 'failed';
            errorMsg = 'Unable to join the network. Check the passphrase and try again.';
          } else {
            portalState = 'joined';
          }
        }, 400);
      }
    }, 180);
  }

  $effect(() => {
    return () => {
      clearTimer();
    };
  });
</script>

<div class="flex min-h-dvh flex-col bg-bg text-text-1">
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-6 py-8 sm:py-12">
    {#if portalState === 'idle' || portalState === 'failed'}
      <header class="mb-6 text-center">
        <h1 class="text-xl font-bold tracking-tight">SwISD Setup</h1>
        <p class="mt-1 text-sm text-text-2">Connect this node to your WiFi network.</p>
      </header>

      {#if portalState === 'failed'}
        <div class="mb-5 rounded-md border border-warn/30 bg-warn/10 px-4 py-3" role="alert">
          <p class="text-sm text-warn">{errorMsg}</p>
        </div>
      {/if}

      <form class="flex flex-col gap-5" onsubmit={handleSubmit}>
        <TextField id="cap-ssid" label="Network name (SSID)" bind:value={ssid} />

        <TextField id="cap-country" label="Country code" bind:value={country} />

        <Select id="cap-security" label="Security" bind:value={security} options={SECURITY_OPTIONS} />

        {#if security !== 'open'}
          <TextField
            id="cap-pass"
            label="Passphrase"
            type={showPass ? 'text' : 'password'}
            bind:value={passphrase}
          />
          <div class="-mt-3 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onclick={() => (showPass = !showPass)}>
              {showPass ? 'Hide' : 'Show'}
            </Button>
          </div>
        {/if}

        <div class="flex flex-col gap-4">
          <Toggle id="cap-hidden" label="Hidden network" bind:checked={hidden} />
          <Toggle
            id="cap-temporary"
            label="Temporary"
            description="Nodes will forget credentials on reboot."
            bind:checked={temporary}
          />
        </div>

        <div class="mt-4 flex justify-end">
          <Button type="submit" variant="primary" icon="wifi">Connect</Button>
        </div>
      </form>
    {:else if portalState === 'joining'}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <ProgressRing value={joinProgress} size={96} aria-label="Joining network" />
        <h1 class="mt-6 text-xl font-bold tracking-tight">Joining network…</h1>
        <p class="mt-2 text-sm text-text-2">Applying credentials and connecting. Keep this page open.</p>
      </div>
    {:else}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-live/15 text-live">
          <Icon name="check" size="lg" aria-hidden={true} />
        </div>
        <h1 class="mt-6 text-xl font-bold tracking-tight">Connected</h1>
        <p class="mt-2 text-sm text-text-2">
          This node joined {ssid || 'your network'}. Every available node connected to this setup
          portal has received the credentials and will join the network as well.
        </p>
        <p class="mt-4 text-sm text-text-2">
          Reconnect your phone to your usual WiFi, then open the cockpit.
        </p>
        <code class="mt-6 rounded-md bg-surface-2 px-4 py-3 font-mono text-sm text-accent">http://swisd.local:4101</code>
      </div>
    {/if}
  </main>
</div>