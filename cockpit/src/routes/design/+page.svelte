<!--
1. Relative path: cockpit/src/routes/design/+page.svelte
2. Description: Living design-system bench for the Conductor Cockpit (Cyberdeck theme).
3. Expects: The UI primitive barrel at $lib/components/ui and layout.css tokens loaded globally.
4. Provides: A dummy visual-verification page exercising every UI primitive in isolation.
-->

<script lang="ts">
  import {
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

  async function simulate(): Promise<void> {
    if (busy) return;
    busy = true;
    while (progress < 100) {
      progress = Math.min(100, progress + 8);
      await new Promise<void>((resolve) => setTimeout(resolve, 120));
    }
    busy = false;
  }
</script>

<div class="min-h-screen px-6 py-10">
  <div class="mx-auto flex w-full max-w-[1440px] flex-col gap-6">

    <!-- HEADER -->
    <header class="border-b border-[var(--border)] pb-6">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-2xl font-bold tracking-tight text-[var(--text-1)]">Primitive Bench</h1>
        <span class="fx text-lg text-[var(--accent)]">CYBERDECK // v0.1</span>
      </div>
      <p class="mt-2 max-w-2xl text-sm text-[var(--text-2)]">
        Visual contract for the Conductor Cockpit. Every primitive below resolves its colors,
        radii, type, and motion exclusively from tokens in layout.css. If it looks wrong here,
        it is wrong everywhere.
      </p>
      <div class="mt-4 flex gap-6 font-mono text-xs text-[var(--text-2)]">
        <span>THEME <b class="text-[var(--accent)]">CYBERDECK</b></span>
        <span>RADIUS <b class="text-[var(--accent)]">6px</b></span>
        <span>MODE <b class="text-[var(--accent)]">DARK</b></span>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">

      <!-- 01 · SWARM PULSE -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">01</span> · Swarm Pulse
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <SwarmPulse state="idle" />
          <SwarmPulse state="working" />
          <SwarmPulse state="shedding" />
          <SwarmPulse state="awaiting" />
          <SwarmPulse state="error" />
        </div>
      </section>

      <!-- 02 · STATUS PILLS -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">02</span> · Status Pills
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <StatusPill status="live" label="Online" />
          <StatusPill status="warn" label="Shedding" />
          <StatusPill status="accent" label="Awaiting" />
          <StatusPill status="idle" label="Offline" />
        </div>
      </section>

      <!-- 03 · BUTTONS -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">03</span> · Buttons
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon="rocket_launch">Deploy</Button>
          <Button variant="secondary" icon="visibility">Preview</Button>
          <Button variant="ghost">Docs</Button>
          <Button variant="danger" icon="block">Abort</Button>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" icon="refresh">Sync</Button>
          <Button variant="secondary" size="sm" icon="settings" aria-label="Settings" />
          <Button variant="primary" disabled={true}>Queued</Button>
        </div>
      </section>

      <!-- 04 · TEXT FIELDS -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">04</span> · Text Fields
        </h2>
        <TextField label="Peer Name" bind:value={peerName} helper="rfc-1123 · lowercase + dashes" />
        <TextField label="Search Swarm" icon="search" placeholder="peers, models, chunks…" />
      </section>

      <!-- 05 · PROGRESS -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">05</span> · Progress
        </h2>
        <div class="flex items-center gap-6">
          <ProgressRing value={progress} size={72} />
          <div class="flex flex-1 flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">Download</span>
              <span class="mono text-sm font-semibold text-[var(--live)]">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
            <div>
              <Button variant="secondary" size="sm" icon="play_arrow" onclick={simulate}>Simulate</Button>
            </div>
          </div>
        </div>
      </section>

      <!-- 06 · DATA READOUTS -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">06</span> · Data Readouts
        </h2>
        <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat label="Throughput" value="118 MB/s" variant="live" />
          <Stat label="ETA" value="00:42" variant="accent" />
          <Stat label="Chunks" value="4096" variant="warn" />
          <Stat label="Storage" value="61%" variant="default" />
        </div>
      </section>

      <!-- 07 · EXPANDABLE CARD -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">07</span> · Expandable Card
        </h2>
        <Card title="pi-kappa" subtitle="12D3KooWSD5p9aQyV4nZRu2LhXcM7bFq" expandable={true}>
          <p class="text-sm text-[var(--text-2)]">
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
      </section>

      <!-- 08 · EMPTY STATE -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">08</span> · Empty State
        </h2>
        <div class="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)]">
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
      </section>

      <!-- 09 · ICONS -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">09</span> · Icons (Material Symbols)
        </h2>
        <div class="flex flex-wrap items-center gap-4 text-[var(--text-2)]">
          <Icon name="terminal" />
          <Icon name="hub" size="lg" />
          <Icon name="download" fill={1} />
          <Icon name="memory" weight={600} />
          <Icon name="security" size="sm" />
          <Icon name="cloud_download" size="lg" fill={1} />
        </div>
      </section>

      <!-- 10 · OVERLAYS -->
      <section class="flex flex-col gap-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 class="border-b border-[var(--border)] pb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-2)]">
          <span class="text-[var(--accent)]">10</span> · Overlays
        </h2>
        <p class="text-sm text-[var(--text-2)]">
          Overlays inherit the active theme. Modal traps focus for accessibility.
          Drawer slides in from the right edge as a notification queue.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon="cloud_download" onclick={() => modalOpen = true}>
            Open Approval Gate
          </Button>
          <Button variant="secondary" icon="notifications" onclick={() => drawerOpen = true}>
            Open Action Queue
          </Button>
        </div>
      </section>
    </div>
  </div>
</div>

<!-- APPROVAL GATE MODAL -->
<Modal open={modalOpen} title="Approve download" onclose={() => modalOpen = false}>
  <p class="text-sm text-[var(--text-2)]">
    This model will be stored locally and seeded to the swarm. Continue?
  </p>
  <div class="mt-4 flex flex-col gap-2">
    <div class="mono flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
      <span class="text-[var(--text-3)]">SIZE</span>
      <b class="text-[var(--accent)]">2.1 GB · 4 shards</b>
    </div>
    <div class="mono flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
      <span class="text-[var(--text-3)]">MERKLE</span>
      <b class="text-[var(--accent)]">9f2c…a41d</b>
    </div>
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => modalOpen = false}>Cancel</Button>
    <Button variant="primary" icon="check" onclick={() => modalOpen = false}>Approve</Button>
  {/snippet}
</Modal>

<!-- ACTION QUEUE DRAWER -->
<Drawer open={drawerOpen} title="Action Queue" onclose={() => drawerOpen = false}>
  <div class="flex flex-col gap-3">
    <div class="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div class="flex items-center gap-2">
        <Icon name="warning" size="sm" />
        <span class="text-sm font-bold text-[var(--text-1)]">3 peers awaiting trust</span>
      </div>
      <p class="mt-1 text-xs text-[var(--text-2)]">
        Verify Ed25519 identities before allowing swarm participation.
      </p>
    </div>
    <div class="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div class="flex items-center gap-2">
        <Icon name="wifi" size="sm" />
        <span class="text-sm font-bold text-[var(--text-1)]">WiFi setup required</span>
      </div>
      <p class="mt-1 text-xs text-[var(--text-2)]">
        pi-nadir booted with no known network and entered Genesis fallback.
      </p>
    </div>
  </div>
</Drawer>