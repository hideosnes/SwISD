<!--
1. Relative path: cockpit/src/routes/design/+page.svelte
2. Description: Living design-system bench for the Conductor Cockpit (Cyberdeck theme).
3. Expects: The UI primitive barrel at $lib/components/ui, layout.css tokens loaded globally, and the datavis barrel for live node specimens.
4. Provides: A visual-verification page exercising every UI primitive in isolation, plus swarm-node specimens rendered by the production orbital pipeline, including live ping rings.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import {
    PageShell,
    Panel,
    Button,
    Card,
    StatusPill,
    SwarmPulse,
    ProgressRing,
    ProgressBar,
    Modal,
    Drawer,
    TextField,
    Icon,
    Stat,
    EmptyState
  } from '$lib/components/ui';

  import type { SwarmTopologyDTO } from '$lib/server/index.js';
  import {
    GhostNode,
    SwarmNode,
    TrustRing,
    computeOrbitalLayout,
    defaultOrbitalConfig
  } from '$lib/components/datavis';
  import { TopologyAnatomyBench } from '$lib/components/datavis';

  let modalOpen = $state(false);
  let drawerOpen = $state(false);
  let progress = $state(64);
  let busy = $state(false);
  let peerName = $state('pi-alpha-04');

  let intervalId: ReturnType<typeof setInterval> | null = null;

  function clearSimulation(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startSimulation(initial: number): void {
    clearSimulation();
    progress = Math.max(0, Math.min(100, initial));
    busy = true;

    intervalId = setInterval(() => {
      progress = Math.min(100, progress + 8);
      if (progress >= 100) {
        busy = false;
        clearSimulation();
      }
    }, 120);
  }

  function simulate(): void {
    if (busy) return;
    startSimulation(progress >= 100 ? 0 : progress);
  }

  function restart(): void {
    startSimulation(0);
  }

  const BENCH_W = 480;
  const BENCH_H = 360;
  const CONDUCTOR_ID = `0x${'c'.repeat(64)}`;
  const now = Date.now();

  const benchTopology: SwarmTopologyDTO = {
    generatedAt: now,
    conductorPeerId: CONDUCTOR_ID,
    swarmSize: 3,
    ghostCount: 2,
    offlineCount: 0,
    peers: [
      {
        peerId: `0x${'a'.repeat(64)}`,
        hostname: 'raspi-p5-01',
        presence: 'online',
        trustState: 'trusted',
        discoveredAt: now - 10000,
        lastSeenAt: now - 10000, // 10s ago -> ~83% ping ring
        source: 'replay',
        capabilities: ['llama-cpp'],
        loadScore: 0.15,
        activeTaskCount: null,
        deviceType: 'raspi',
        modalities: ['T2T']
      },
      {
        peerId: `0x${'b'.repeat(64)}`,
        hostname: 'linux-node-02',
        presence: 'online',
        trustState: 'trusted',
        discoveredAt: now - 45000,
        lastSeenAt: now - 45000, // 45s ago -> ~25% ping ring
        source: 'replay',
        capabilities: ['stable-diffusion'],
        loadScore: 0.5,
        activeTaskCount: null,
        deviceType: 'linux',
        modalities: ['T2I']
      },
      {
        peerId: `0x${'d'.repeat(64)}`,
        hostname: 'windows-pc-03',
        presence: 'online',
        trustState: 'trusted',
        discoveredAt: now - 5000,
        lastSeenAt: now - 5000, // 5s ago -> ~92% ping ring
        source: 'replay',
        capabilities: ['llama-cpp', 'stable-diffusion', 'whisper-cpp'],
        loadScore: 0.9,
        activeTaskCount: null,
        deviceType: 'windows',
        modalities: ['T2T', 'T2I', 'T2A']
      },
      {
        peerId: `0x${'e'.repeat(64)}`,
        hostname: null,
        presence: 'offline',
        trustState: 'pending',
        discoveredAt: now - 120000,
        lastSeenAt: now - 120000, // 2m ago -> 0% ping ring (offline)
        source: 'replay',
        capabilities: [],
        loadScore: null,
        activeTaskCount: null,
        deviceType: 'unknown',
        modalities: []
      },
      {
        peerId: `0x${'f'.repeat(64)}`,
        hostname: null,
        presence: 'offline',
        trustState: 'pending',
        discoveredAt: now - 180000,
        lastSeenAt: null,
        source: 'replay',
        capabilities: [],
        loadScore: null,
        activeTaskCount: null,
        deviceType: 'unknown',
        modalities: []
      }
    ]
  };

  const benchLayout = computeOrbitalLayout(
    benchTopology,
    defaultOrbitalConfig(BENCH_W, BENCH_H)
  );

  const loadLowSpecimen = {
    peer: {
      peerId: `0x${'1'.repeat(64)}`,
      hostname: 'raspi-p5-04',
      presence: 'online',
      trustState: 'trusted',
      discoveredAt: now - 15000,
      lastSeenAt: now - 15000,
      source: 'replay',
      capabilities: ['llama-cpp'],
      loadScore: 0.15,
      activeTaskCount: null,
      deviceType: 'raspi',
      modalities: ['T2T']
    },
    ring: 'trust',
    angleRad: 0,
    position: { x: 42, y: 42 },
    nodeRadius: 12
  } as const;

  const loadHighSpecimen = {
    peer: {
      peerId: `0x${'2'.repeat(64)}`,
      hostname: 'raspi-p5-05',
      presence: 'online',
      trustState: 'trusted',
      discoveredAt: now - 30000,
      lastSeenAt: now - 30000,
      source: 'replay',
      capabilities: ['llama-cpp'],
      loadScore: 0.9,
      activeTaskCount: null,
      deviceType: 'raspi',
      modalities: ['T2T']
    },
    ring: 'trust',
    angleRad: 0,
    position: { x: 126, y: 42 },
    nodeRadius: 26
  } as const;

  const bezelSpecimen = {
    peer: {
      peerId: `0x${'3'.repeat(64)}`,
      hostname: 'windows-pc-06',
      presence: 'online',
      trustState: 'trusted',
      discoveredAt: now - 20000,
      lastSeenAt: now - 20000,
      source: 'replay',
      capabilities: ['llama-cpp', 'stable-diffusion', 'whisper-cpp'],
      loadScore: 0.5,
      activeTaskCount: null,
      deviceType: 'windows',
      modalities: ['T2T', 'T2I', 'T2A']
    },
    ring: 'trust',
    angleRad: 0,
    position: { x: 42, y: 42 },
    nodeRadius: 22
  } as const;

  const ghostSpecimen = {
    peer: {
      peerId: `0x${'4'.repeat(64)}`,
      hostname: null,
      presence: 'offline',
      trustState: 'pending',
      discoveredAt: now - 90000,
      lastSeenAt: now - 90000,
      source: 'replay',
      capabilities: [],
      loadScore: null,
      activeTaskCount: null,
      deviceType: 'unknown',
      modalities: []
    },
    ring: 'limbo',
    angleRad: 0,
    position: { x: 42, y: 42 },
    nodeRadius: 22
  } as const;

  $effect(() => {
    return () => {
      clearSimulation();
    };
  });
</script>

<PageShell>
  <header class="border-b border-border pb-6 pt-2">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-bold tracking-tight text-text-1">
        Primitive Bench
      </h1>
      <span class="font-fx text-lg text-accent">CYBERDECK // v0.1</span>
    </div>

    <p class="mt-2 max-w-prose-bench text-sm text-text-2">
      Visual contract for the Conductor Cockpit. Every primitive below resolves its colors,
      radii, type, and motion exclusively from tokens in layout.css. If it looks wrong here,
      it is wrong everywhere.
    </p>

    <div class="mt-4 flex flex-wrap gap-6 font-mono text-xs text-text-2">
      <span>THEME <b class="text-accent">CYBERDECK</b></span>
      <span>RADIUS <b class="text-accent">6px</b></span>
      <span>MODE <b class="text-accent">DARK</b></span>
    </div>
  </header>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Panel index="01" title="Swarm Pulse">
      <div class="flex flex-wrap items-center gap-3">
        <SwarmPulse state="idle" />
        <SwarmPulse state="working" />
        <SwarmPulse state="shedding" />
        <SwarmPulse state="awaiting" />
        <SwarmPulse state="error" />
      </div>
    </Panel>

    <Panel index="02" title="Status Pills">
      <div class="flex flex-wrap items-center gap-3">
        <StatusPill status="live" label="Online" />
        <StatusPill status="warn" label="Shedding" />
        <StatusPill status="accent" label="Awaiting" />
        <StatusPill status="idle" label="Offline" />
      </div>
    </Panel>

    <Panel index="03" title="Backpressure & Load">
      <p class="mb-3 text-sm text-text-2">
        Domain adapters map numeric load scores and backpressure states to primitive semantic vocabulary.
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <StatusPill status="idle" label="Idle (< 60%)" />
        <StatusPill status="warn" label="Throttled (> 60%)" />
        <StatusPill status="warn" label="Shedding (> 80%)" />
      </div>
      <div class="mt-4 flex items-center gap-4">
        <SwarmPulse state="idle" />
        <SwarmPulse state="working" />
        <SwarmPulse state="shedding" />
      </div>
    </Panel>

    <Panel index="04" title="Buttons">
      <div class="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon="rocket_launch">Deploy</Button>
        <Button variant="secondary" icon="visibility">Preview</Button>
        <Button variant="ghost">Docs</Button>
        <Button variant="danger" icon="block">Abort</Button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" icon="refresh">Sync</Button>
        <Button variant="secondary" size="sm" icon="settings" aria-label="Settings" />
        <Button variant="primary" disabled>Queued</Button>
      </div>
    </Panel>

    <Panel index="05" title="Text Fields">
      <TextField
        id="peer-name"
        label="Peer Name"
        bind:value={peerName}
        helper="rfc-1123 · lowercase + dashes"
      />

      <TextField
        id="search-swarm"
        label="Search Swarm"
        icon="search"
        placeholder="peers, models, chunks…"
      />
    </Panel>

    <Panel index="06" title="Progress">
      <div class="flex items-center gap-6">
        <ProgressRing
          value={progress}
          size={64}
          aria-label="Download progress"
        />

        <div class="flex flex-1 flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="font-mono text-2xs uppercase tracking-widest text-text-3">
              Download
            </span>
            <span
              class="font-mono text-sm font-semibold text-live"
              aria-live="polite"
            >
              {progress}%
            </span>
          </div>

          <ProgressBar
            value={progress}
            aria-label="Download progress"
          />

          <div class="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon="play_arrow"
              onclick={simulate}
              disabled={busy}
            >
              Simulate
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon="restart_alt"
              onclick={restart}
            >
              Restart
            </Button>
          </div>
        </div>
      </div>
    </Panel>

    <Panel index="07" title="Data Readouts">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Throughput" value="118 MB/s" variant="live" />
        <Stat label="ETA" value="00:42" variant="accent" />
        <Stat label="Chunks" value="4096" variant="warn" />
        <Stat label="Storage" value="61%" variant="default" />
      </div>
    </Panel>

    <Panel index="08" title="Expandable Card">
      <Card
        title="pi-kappa"
        subtitle="12D3KooWSD5p9aQyV4nZRu2LhXcM7bFq"
        expandable
      >
        <p class="text-sm text-text-2">
          Executor pool serving tier-1 inference. Reputation 0.94 across 1,284 completed tasks.
        </p>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Load" value="0.62" variant="live" />
          <Stat label="Uptime" value="14d 06h" variant="accent" />
        </div>

        {#snippet footer()}
          <Button variant="ghost" size="sm">Drain</Button>
          <Button variant="primary" size="sm" icon="visibility">Inspect</Button>
        {/snippet}
      </Card>
    </Panel>

    <Panel index="09" title="Empty State">
      <div class="rounded-sm border border-border bg-bg p-6">
        <EmptyState
          icon="folder_off"
          title="No models ingested"
          description="Drag a .gguf into the drop zone or fetch one from HuggingFace."
        >
          {#snippet action()}
            <Button variant="primary" icon="add">Ingest Model</Button>
          {/snippet}
        </EmptyState>
      </div>
    </Panel>

    <Panel index="10" title="Icons (Material Symbols)">
      <div class="flex flex-wrap items-center gap-4 text-text-2">
        <Icon name="terminal" aria-hidden={true} />
        <Icon name="hub" size="lg" aria-hidden={true} />
        <Icon name="download" fill={1} aria-hidden={true} />
        <Icon name="memory" weight={600} aria-hidden={true} />
        <Icon name="security" size="sm" aria-hidden={true} />
        <Icon name="cloud_download" size="lg" fill={1} aria-hidden={true} />
      </div>
    </Panel>

    <Panel index="11" title="Overlays">
      <p class="text-sm text-text-2">
        Overlays inherit the active theme. Modal traps focus for accessibility.
        Drawer slides in from the right edge as a notification queue.
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          icon="cloud_download"
          onclick={() => (modalOpen = true)}
        >
          Open Approval Gate
        </Button>

        <Button
          variant="secondary"
          icon="notifications"
          onclick={() => (drawerOpen = true)}
        >
          Open Action Queue
        </Button>
      </div>
    </Panel>

    <Panel index="12" title="Swarm Node States">
      <p class="mb-3 text-sm text-text-2">
        Live specimens rendered by the production orbital pipeline — computeOrbitalLayout positioning
        SwarmNode and GhostNode over a deterministic fixture topology, showcasing the counter-clockwise ping ring.
      </p>

      <div class="rounded-sm border border-border bg-bg p-3">
        <svg
          viewBox="0 0 {BENCH_W} {BENCH_H}"
          class="node-bench-canvas"
          role="img"
          aria-label="Swarm node state specimens: trusted peers on the trust ring with load-scaled radii, capability bezels, and ping rings, pending ghosts docked on the limbo orbit"
        >
          {#each benchLayout.rings as ring (ring.kind)}
            <TrustRing {ring} />
          {/each}

          <g transform="translate({benchLayout.center.x}, {benchLayout.center.y})">
            <circle r={benchLayout.conductorRadius} class="node-bench-conductor" />
            <text class="node-bench-conductor-label" text-anchor="middle" dominant-baseline="central">C</text>
          </g>

          {#each benchLayout.peers as laidOut (laidOut.peer.peerId)}
            {#if laidOut.ring === 'trust'}
              <SwarmNode peer={laidOut} />
            {:else if laidOut.ring === 'limbo'}
              <GhostNode peer={laidOut} />
            {/if}
          {/each}
        </svg>
      </div>

      <h3 class="mt-6 mb-3 font-mono text-xs font-bold uppercase tracking-widest text-text-3">
        Legend — rendered specimens
      </h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex items-center gap-4 rounded-sm border border-border bg-bg p-3">
          <svg
            viewBox="0 0 168 84"
            class="node-bench-specimen"
            role="img"
            aria-label="Load-scaled radii and ping rings: a small trusted node at load 0.15 beside a large trusted node at load 0.9"
          >
            <SwarmNode peer={loadLowSpecimen} />
            <SwarmNode peer={loadHighSpecimen} />
          </svg>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="font-mono text-xs font-bold uppercase tracking-widest text-text-1">
              Radius → load · Ring → liveness
            </span>
            <span class="text-sm text-text-2">
              Node radius tracks loadScore. The green ping ring shrinks counter-clockwise from 6 o'clock as time since last ping increases.
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-sm border border-border bg-bg p-3">
          <svg
            viewBox="0 0 84 84"
            class="node-bench-specimen"
            role="img"
            aria-label="A trusted node whose fill encodes its dominant capability and whose bezel is divided into one ring segment per advertised capability"
          >
            <SwarmNode peer={bezelSpecimen} />
          </svg>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="font-mono text-xs font-bold uppercase tracking-widest text-text-1">
              Fill → dominant capability · Bezel → capability set
            </span>
            <span class="text-sm text-text-2">
              The body fill encodes the dominant executor; the bezel divides into one ring segment per advertised capability.
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-sm border border-border bg-bg p-3">
          <svg
            viewBox="0 0 84 84"
            class="node-bench-specimen"
            role="img"
            aria-label="A pending ghost rendered as a dashed hollow circle with a question mark"
          >
            <GhostNode peer={ghostSpecimen} />
          </svg>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="font-mono text-xs font-bold uppercase tracking-widest text-text-1">
              Dashed body → pending ghost
            </span>
            <span class="text-sm text-text-2">
              Discovered but untrusted: hollow body, dashed outline, docked in the limbo orbit until the operator approves the Ed25519 identity.
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-sm border border-border bg-bg p-3">
          <svg
            viewBox="0 0 84 84"
            class="node-bench-specimen rounded-sm border border-dashed border-border"
            role="img"
            aria-label="An empty frame: churned and rejected peers render no circle at all"
          ></svg>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="font-mono text-xs font-bold uppercase tracking-widest text-text-1">
              No circle → churned & rejected
            </span>
            <span class="text-sm text-text-2">
              Peers that drop mid-task or fail trust vanish from the map by doctrine. They live in lists and logs, never as geometry.
            </span>
          </div>
        </div>
      </div>
      <TopologyAnatomyBench />
    </Panel>

    <Panel index="13" title="Conductor States (Cockpit Device)">
      <p class="mb-3 text-sm text-text-2">
        The operator's local device states, from Genesis bootstrap to live orchestration and backpressure shedding.
      </p>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="rounded-sm border border-border bg-bg p-4">
          <div class="flex items-center gap-2 mb-2">
            <SwarmPulse state="awaiting" />
            <span class="text-sm font-bold text-text-1">Genesis (Searching)</span>
          </div>
          <p class="text-xs text-text-3 mb-3">Zero peers discovered. Overlay active.</p>
          <StatusPill status="accent" label="Searching" />
        </div>

        <div class="rounded-sm border border-border bg-bg p-4">
          <div class="flex items-center gap-2 mb-2">
            <SwarmPulse state="working" />
            <span class="text-sm font-bold text-text-1">Live (Orchestrating)</span>
          </div>
          <p class="text-xs text-text-3 mb-3">Mesh connected, routing tasks.</p>
          <StatusPill status="live" label="Live" />
        </div>

        <div class="rounded-sm border border-border bg-bg p-4">
          <div class="flex items-center gap-2 mb-2">
            <SwarmPulse state="shedding" />
            <span class="text-sm font-bold text-text-1">Shedding (Overloaded)</span>
          </div>
          <p class="text-xs text-text-3 mb-3">Local load > 80%. Dropping low-priority.</p>
          <StatusPill status="warn" label="Shedding" />
        </div>

        <div class="rounded-sm border border-border bg-bg p-4">
          <div class="flex items-center gap-2 mb-2">
            <SwarmPulse state="error" />
            <span class="text-sm font-bold text-text-1">Disconnected</span>
          </div>
          <p class="text-xs text-text-3 mb-3">BFF telemetry lost.</p>
          <StatusPill status="warn" label="Error" />
        </div>
      </div>
    </Panel>
  </div>
</PageShell>

<Modal
  open={modalOpen}
  title="Approve download"
  onclose={() => (modalOpen = false)}
>
  <p class="text-sm text-text-2">
    This model will be stored locally and seeded to the swarm. Continue?
  </p>

  <div class="mt-4 flex flex-col gap-2">
    <div class="flex items-center justify-between rounded-sm border border-border bg-bg px-3 py-2 font-mono text-xs">
      <span class="text-text-3">SIZE</span>
      <b class="text-accent">2.1 GB · 4 shards</b>
    </div>

    <div class="flex items-center justify-between rounded-sm border border-border bg-bg px-3 py-2 font-mono text-xs">
      <span class="text-text-3">MERKLE</span>
      <b class="text-accent">9f2c…a41d</b>
    </div>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={() => (modalOpen = false)}>
      Cancel
    </Button>

    <Button
      variant="primary"
      icon="check"
      onclick={() => (modalOpen = false)}
    >
      Approve
    </Button>
  {/snippet}
</Modal>

<Drawer
  open={drawerOpen}
  title="Action Queue"
  onclose={() => (drawerOpen = false)}
>
  <div class="flex flex-col gap-3">
    <div class="rounded-sm border border-border bg-surface-2 p-4">
      <div class="flex items-center gap-2">
        <Icon
          name="warning"
          size="sm"
          class="text-warn"
          aria-hidden={true}
        />
        <span class="text-sm font-bold text-text-1">
          3 peers awaiting trust
        </span>
      </div>

      <p class="mt-1 text-xs text-text-2">
        Verify Ed25519 identities before allowing swarm participation.
      </p>
    </div>

    <div class="rounded-sm border border-border bg-surface-2 p-4">
      <div class="flex items-center gap-2">
        <Icon
          name="wifi"
          size="sm"
          class="text-accent-2"
          aria-hidden={true}
        />
        <span class="text-sm font-bold text-text-1">
          WiFi setup required
        </span>
      </div>

      <p class="mt-1 text-xs text-text-2">
        pi-nadir booted with no known network and entered Genesis fallback.
      </p>
    </div>
  </div>
</Drawer>

<style>
  @layer components {
    .node-bench-canvas {
      display: block;
      width: 100%;
      height: auto;
      max-height: 380px;
    }
    .node-bench-conductor {
      fill: var(--accent);
      stroke: var(--bg);
      stroke-width: 2px;
    }
    .node-bench-conductor-label {
      fill: var(--bg);
      font-size: 14px;
      font-weight: bold;
      font-family: var(--font-mono, monospace);
    }
    .node-bench-specimen {
      display: block;
      height: 84px;
      width: auto;
      flex: none;
    }
  }
</style>