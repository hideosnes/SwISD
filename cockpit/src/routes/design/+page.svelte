<!--
1. Relative path: cockpit/src/routes/design/+page.svelte
2. Description: Living design-system bench for the Conductor Cockpit (Cyberdeck theme).
3. Expects: The UI primitive barrel at $lib/components/ui and layout.css tokens loaded globally.
4. Provides: A dummy visual-verification page exercising every UI primitive in isolation.
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

  $effect(() => {
    return () => {
      clearSimulation();
    };
  });
</script>

<PageShell>
  <!-- HEADER -->
  <header class="border-b border-border pb-6">
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

    <Panel index="03" title="Buttons">
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

    <Panel index="04" title="Text Fields">
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

    <Panel index="05" title="Progress">
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

    <Panel index="06" title="Data Readouts">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Throughput" value="118 MB/s" variant="live" />
        <Stat label="ETA" value="00:42" variant="accent" />
        <Stat label="Chunks" value="4096" variant="warn" />
        <Stat label="Storage" value="61%" variant="default" />
      </div>
    </Panel>

    <Panel index="07" title="Expandable Card">
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

    <Panel index="08" title="Empty State">
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

    <Panel index="09" title="Icons (Material Symbols)">
      <div class="flex flex-wrap items-center gap-4 text-text-2">
        <Icon name="terminal" aria-hidden={true} />
        <Icon name="hub" size="lg" aria-hidden={true} />
        <Icon name="download" fill={1} aria-hidden={true} />
        <Icon name="memory" weight={600} aria-hidden={true} />
        <Icon name="security" size="sm" aria-hidden={true} />
        <Icon name="cloud_download" size="lg" fill={1} aria-hidden={true} />
      </div>
    </Panel>

    <Panel index="10" title="Overlays">
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
  </div>
</PageShell>

<!-- APPROVAL GATE MODAL -->
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

<!-- ACTION QUEUE DRAWER -->
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