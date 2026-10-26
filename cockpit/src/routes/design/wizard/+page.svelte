<!--
1. Relative path: cockpit/src/routes/design/wizard/+page.svelte
2. Description: Wizard preview bench — renders the REAL Out-of-Box setup portal artifact (renderWizardPage from $core/provision) in a device frame, with live-run and forced-state controls.
3. Expects: Dev-only /design/wizard/preview, /join, /status sim routes (see lib/server/wizardSim.ts), $lib/components/ui barrel.
4. Provides: Clickable phone-frame walkthrough of the actual portal: live join flow, or frozen idle/joined/failed states.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
	import { dev } from '$app/env';
	import { Button, TextField, Icon } from '#lib/components/ui';

	type BenchMode = 'live' | 'idle' | 'joining' | 'joined' | 'failed';
	const MODES: ReadonlyArray<{ mode: BenchMode; label: string; icon: string }> = [
		{ mode: 'live', label: 'Live flow', icon: 'captions' },
		{ mode: 'idle', label: 'Idle', icon: 'pause' },
		{ mode: 'joining', label: 'Joining', icon: 'progress_activity' },
		{ mode: 'joined', label: 'Joined', icon: 'check_circle' },
		{ mode: 'failed', label: 'Failed', icon: 'error' }
	];

	let benchMode = $state<BenchMode>('live');
	let device = $state<'phone' | 'full'>('phone');
	let errorText = $state('psk rejected by example network');
	let previewSsid = $state('Home-Net');
	let frameKey = $state(0);

	// Cache-buster so "Refresh" re-navigates identical URLs (server state may have moved on).
	const previewUrl = $derived.by(() => {
		const base =
			benchMode === 'live'
				? '/design/wizard/preview'
				: `/design/wizard/preview?state=${benchMode}&error=${encodeURIComponent(errorText)}&ssid=${encodeURIComponent(previewSsid)}`;
		return `${base}${base.includes('?') ? '&' : '?'}frame=${frameKey}`;
	});

	function applyMode(mode: BenchMode): void {
		benchMode = mode;
		frameKey += 1;
	}

	function refresh(): void {
		frameKey += 1;
	}
</script>

<div class="flex min-h-dvh flex-col gap-6 p-6 lg:flex-row">
	<!-- Controls -->
	<aside class="flex w-full flex-col gap-5 lg:max-w-sm">
		<header>
			<h1 class="flex items-center gap-2 text-lg font-bold tracking-tight">
				<Icon name="settings_remote" size="sm" />
				Wizard Preview Bench
			</h1>
			<p class="mt-1 text-sm text-text-2">
				The verbatim <code class="font-mono text-xs">renderWizardPage()</code> artifact, running its real fetch/poll loop against a dev-only
				emulated portal.
			</p>
		</header>

		<section class="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
			<h2 class="text-2xs font-semibold uppercase tracking-widest text-text-2">State</h2>
			<div class="flex flex-wrap gap-2">
				{#each MODES as entry (entry.mode)}
					<Button
						variant={benchMode === entry.mode ? 'primary' : 'secondary'}
						size="sm"
						icon={entry.icon}
						onclick={() => applyMode(entry.mode)}
					>
						{entry.label}
					</Button>
				{/each}
			</div>
			<Button variant="ghost" size="sm" icon="refresh" onclick={refresh}>Reload frame</Button>
			<p class="text-2xs text-text-3">
				<span class="font-semibold text-text-2">Live flow:</span> fill the form and hit Connect — the sim answers after 2.5 s. Any SSID starting
				with <code class="font-mono">Bad-</code> fails with <code class="font-mono">auth-failed</code>; everything else joins.
			</p>
		</section>

		<section class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
			<h2 class="text-2xs font-semibold uppercase tracking-widest text-text-2">Forced-state payload</h2>
			<TextField label="Joined SSID" bind:value={previewSsid} />
			<TextField label="Error message" bind:value={errorText} />
			<p class="text-2xs text-text-3">Applies to the Idle/Joining/Joined/Failed freezes — the screens' initial server-side render.</p>
		</section>

		<section class="flex items-center gap-2 rounded-lg border border-border bg-surface p-4">
			<Button variant={device === 'phone' ? 'primary' : 'secondary'} size="sm" icon="smartphone" onclick={() => (device = 'phone')}>
				Phone frame
			</Button>
			<Button variant={device === 'full' ? 'primary' : 'secondary'} size="sm" icon="crop_free" onclick={() => (device = 'full')}>
				Full bleed
			</Button>
			<a class="ml-auto text-2xs text-text-2 underline hover:text-accent" href={previewUrl} target="_blank" rel="noopener">
				Raw preview ↗
			</a>
		</section>
	</aside>

	<!-- Stage -->
	<main class="flex min-w-0 flex-1 items-start justify-center">
		{#if !dev}
			<div class="flex min-h-[40vh] max-w-md items-center p-8">
				<p class="rounded-lg border border-warn/30 bg-warn/10 p-4 text-sm text-warn">
					The wizard preview bench only runs against the dev server (<code class="font-mono">npm run dev</code> in
					<code class="font-mono">cockpit/</code>) — the emulated portal routes are dev-gated and dead in production builds.
				</p>
			</div>
		{:else if device === 'phone'}
			<div
				class="h-[680px] w-[390px] max-w-full overflow-y-auto rounded-lg border border-border-strong bg-bg shadow-2xl"
				title="Wizard preview (phone viewport 390×680)"
			>
				<iframe src={previewUrl} title="SwISD setup wizard preview" class="h-full w-full border-0"></iframe>
			</div>
		{:else}
			<div class="h-[80vh] w-full overflow-y-auto rounded-lg border border-border bg-bg" title="Wizard preview (full viewport)">
				<iframe src={previewUrl} title="SwISD setup wizard preview" class="h-full w-full border-0"></iframe>
			</div>
		{/if}
	</main>
</div>
