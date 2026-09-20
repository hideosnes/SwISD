<!--
1. Relative path: site/src/routes/design/+page.svelte
2. Description: Living style guide and design system documentation for the SwISD marketing site.
3. Expects: Svelte 5 runes, global layout.css tokens, strict primitive composition, and barrel imports.
4. Provides: A compact, context-aware visual catalog of primitives, patterns, and layout regimes.
-->
<script lang="ts">
  import { 
    Arrow, Badge, Button, Card, CaseCard, CodeBlock, FilterChip, LogoGallery, 
    ManifestoList, Modal, MultiSelect, RoadmapModal, RoadmapTimeline, SegmentedControl, 
    SwarmCanvas, Tabs, Tag, TextField, type LogoGalleryGroup 
  } from '$lib/components/ui';
  import { OrbitExplainer, type Rundown } from '$lib/components/datavis';
  import { roadmapEntries } from '$lib/content/roadmap';
  import { cases } from '$lib/content/cases';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { 
    huggingfaceLogo, nodejsLogo, webgpuLogo, ffgLogo, hpcjuLogo, 
    stsbgLogo, kupfLogo, monochromLogo, swisdLogo 
  } from '$lib/assets';

  // --- State ---
  let isModalOpen = $state(false);
  let segmentedValue = $state<'dev' | 'exec'>('dev');
  let activeModal = $state<'text' | 'split' | 'appliance' | null>(null);
  let multiSelectValue = $state<string[]>([]);

  // --- Progressive Disclosure State ---
  const MOCK_LONG_LIST = Array.from({ length: 16 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Milestone ${i + 1}`,
    desc: 'Technical proof of concept and architectural validation.'
  }));
  let revealCount = $state(4);
  const visibleItems = $derived(MOCK_LONG_LIST.slice(0, revealCount));
  function revealMore() { revealCount += 4; }

  // --- Mock Data ---
  const SEGMENTED_OPTIONS = [
    { value: 'dev' as const, label: 'For Developers' },
    { value: 'exec' as const, label: 'For Executives' }
  ];

  const solutions = [
    { title: 'Agency', text: 'You choose the models, not the platform.' },
    { title: 'Autonomy', text: 'Edge-native infrastructure.' },
    { title: 'Reciprocity', text: 'Your data stays yours.' }
  ];

  const runtimeGroups: readonly LogoGalleryGroup[] = [
    { items: [{ src: webgpuLogo, alt: 'WebGPU' }, { src: nodejsLogo, alt: 'NodeJS' }, { src: huggingfaceLogo, alt: 'HuggingFace' }] }
  ];

  const grantGroups: readonly LogoGalleryGroup[] = [
    { items: [{ src: ffgLogo, alt: 'FFG', wide: true }, { src: hpcjuLogo, alt: 'EuroHPC JU', wide: true }, { src: stsbgLogo, alt: 'Stadt Salzburg', wide: true }] }
  ];

  const labeledGroups: readonly LogoGalleryGroup[] = [
    { label: 'Research', items: [{ src: ffgLogo, alt: 'FFG', wide: true }, { src: hpcjuLogo, alt: 'EuroHPC JU', wide: true }] },
    { label: 'Culture', items: [{ src: kupfLogo, alt: 'Kupf', wide: true }, { src: monochromLogo, alt: 'Monochrom', wide: true }] }
  ];

  const ARCH_RUNDOWNS: readonly Rundown[] = [
    { actorId: 'conductor', pillar: 'Workload Execution', title: 'The Conductor', text: "The operator's stateful brain. Chunks tasks, Merkle-hashes for integrity, HMAC-signs for authenticity.", chipLabel: 'Conductor' },
    { actorId: 'worker', pillar: 'Task Mediation', title: 'The Worker', text: 'Beautifully dumb and stateless. Advertises capabilities, takes chunks, executes in parallel.', chipLabel: 'Worker' },
    { actorId: 'diplomat', pillar: 'Deep Networking', title: 'The Diplomat', text: 'The elected ambassador. Sole bridge between swarms for cross-boundary routing.', chipLabel: 'Diplomat' },
    { actorId: 'ghost', pillar: 'Trust Boundary', title: 'The Ghost', text: 'A stranger at the gate. Docked in limbo until explicitly trusted by the operator.', chipLabel: 'Ghost' }
  ];

  const sampleRoadmapEntry = roadmapEntries[0];

  // sampleCase showcases a LINKED title + LINKED partner; sampleCase2 showcases the unlinked states.
  const sampleCase = cases[0] ?? {
    slug: 'mock-1', title: 'Mock Project Alpha', image: swisdLogo, year: 2024,
    partners: [{ name: 'Partner A', link: { href: 'https://example.com', external: true } }],
    categories: ['Research' as const], tags: ['AI' as const],
    summary: 'Mock summary for design showcase.',
    link: { href: '/case-studies' }
  };

  const sampleCase2 = cases[1] ?? {
    slug: 'mock-2', title: 'Mock Project Beta', image: swisdLogo, year: 2025,
    partners: [{ name: 'Partner B' }],
    categories: ['Product' as const], tags: ['Edge' as const],
    summary: 'Another mock summary for design showcase.'
  };

  function triggerToasts() {
    uiStore.addToast('Model downloaded successfully.', 'success');
    uiStore.addToast('New peer discovered in the swarm.', 'info');
    uiStore.addToast('Connection lost. Retrying...', 'error');
  }
</script>

<svelte:head>
  <title>SwISD Design System</title>
  <meta name="description" content="Living style guide and design system documentation for SwISD." />
</svelte:head>

<!-- 1. HERO -->
<section class="relative h-[60vh] min-h-screen flex items-center justify-center overflow-hidden border-b border-(--border)">
  <SwarmCanvas />
  <div class="relative z-10 text-center px-4">
    <Tag variant="lime">Swarm Inference on Small Devices</Tag>
    <h1 class="mt-6 mb-4 text-4xl md:text-5xl font-bold font-mono">Design System</h1>
    <p class="text-(--text-muted) max-w-xl mx-auto mb-8">
      A compact, living catalog of the SwISD visual language. Primitives, patterns, and rhythms.
    </p>
    <div class="flex flex-wrap gap-4 justify-center">
      <Button variant="primary">Explore Primitives <Arrow direction="down" /></Button>
      <Button variant="secondary">View on GitHub <Arrow direction="external" /></Button>
    </div>
  </div>
</section>

<!-- 2. FOUNDATIONS -->
<section class="py-16 border-b border-(--border)">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold font-mono mb-8">Foundations</h2>
    <div class="grid md:grid-cols-2 gap-8">
      <div>
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest mb-4">Colors</h3>
        <div class="bg-(--surface) p-6 rounded-2xl border border-(--border)">
          <div class="grid grid-cols-2 gap-4">
            {#each [
              { name: 'Lime', token: '--color-lime' },
              { name: 'Purple', token: '--color-purple' },
              { name: 'Gray 900', token: '--color-gray-900' },
              { name: 'Gray 400', token: '--color-gray-400' }
            ] as color}
              <div class="flex flex-col gap-2">
                <div class="h-14 rounded-lg border border-(--border)" style="background: var({color.token});"></div>
                <div>
                  <p class="font-semibold text-(--text) text-sm">{color.name}</p>
                  <p class="font-mono text-xs text-(--text-muted)">{color.token}</p>
                </div>
              </div>
            {/each}
            <div class="flex flex-col gap-2 col-span-2">
              <div class="h-14 rounded-lg border border-(--border)" style="background: var(--color-white);"></div>
              <div>
                <p class="font-semibold text-(--text) text-sm">White</p>
                <p class="font-mono text-xs text-(--text-muted)">--color-white</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest mb-4">Typography Tokens</h3>
        <div class="bg-(--surface) rounded-2xl border border-(--border) divide-y divide-(--border) overflow-hidden">
          <div class="p-6 flex flex-col gap-2">
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest">H1 · Display</span>
            <h1 class="font-mono font-bold text-3xl leading-tight">Swarm Inference</h1>
            <span class="font-mono text-xs text-(--text-muted)">Mono · 700 · 3xl</span>
          </div>
          <div class="p-6 flex flex-col gap-2">
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest">H2 · Section</span>
            <h2 class="font-mono font-bold text-2xl leading-tight">The Question Cascade</h2>
            <span class="font-mono text-xs text-(--text-muted)">Mono · 700 · 2xl</span>
          </div>
          <div class="p-6 flex flex-col gap-2">
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest">Label</span>
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest">The Problem</span>
            <span class="font-mono text-xs text-(--text-muted)">Mono · xs · uppercase</span>
          </div>
          <div class="p-6 flex flex-col gap-2">
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest">Body</span>
            <p class="text-(--text-muted) leading-relaxed">From the developer choosing a model to the executive signing the contract.</p>
            <span class="font-mono text-xs text-(--text-muted)">Inter · 400 · base</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 3. PRIMITIVES -->
<section class="py-16 border-b border-(--border)">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold font-mono mb-8">Primitives</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="space-y-6">
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest">Controls</h3>
        <div class="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div class="flex gap-4 text-(--text)">
          <Arrow direction="up" /> <Arrow direction="down" /> <Arrow direction="right" /> <Arrow direction="external" />
        </div>
        <div>
          <h4 class="text-xs font-mono text-(--text-muted) uppercase tracking-widest mb-2">Pill Tabs</h4>
          <SegmentedControl options={SEGMENTED_OPTIONS} selected={segmentedValue} onSelect={(v) => segmentedValue = v} ariaLabel="Perspective" />
        </div>
        <div>
          <h4 class="text-xs font-mono text-(--text-muted) uppercase tracking-widest mb-2">Compact Segmented</h4>
          <SegmentedControl options={SEGMENTED_OPTIONS} selected={segmentedValue} onSelect={(v) => segmentedValue = v} ariaLabel="Perspective Compact" variant="compact" />
        </div>
        <div>
          <h4 class="text-xs font-mono text-(--text-muted) uppercase tracking-widest mb-2">Filter Chips</h4>
          <div class="flex flex-wrap gap-2">
            <FilterChip label="Active" active={true} onclick={() => {}} />
            <FilterChip label="Inactive" active={false} onclick={() => {}} />
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest">Inputs & Feedback</h3>
        <TextField label="Email" type="email" placeholder="node@swarm.local" />
        
        <div>
          <h4 class="text-xs font-mono text-(--text-muted) uppercase tracking-widest mb-2">Multi-Select</h4>
          <MultiSelect 
            options={['Research', 'Product', 'Edge', 'AI', 'Culture']} 
            bind:selected={multiSelectValue} 
            placeholder="Select categories" 
            label="Categories" 
          />
        </div>

        <div class="flex flex-wrap gap-3 items-center">
          <Badge count={5} />
          <Badge variant="status" status="live" />
          <Badge variant="status" status="warn" />
          <Badge variant="status" status="idle" />
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <Tag variant="lime">Capability</Tag>
          <Tag variant="purple">CRDT</Tag>
          <Tag variant="warn">Latency</Tag>
        </div>
        <div class="flex gap-3">
          <Button variant="secondary" onclick={triggerToasts}>Trigger Toasts</Button>
          <Button variant="secondary" onclick={() => isModalOpen = true}>Open Modal</Button>
        </div>
      </div>

      <div class="space-y-6">
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest">Nav Tabs</h3>
        <div class="bg-(--surface) p-4 rounded-xl border border-(--border)">
          <Tabs tabs={[{id: 'a', label: 'Tab A'}, {id: 'b', label: 'Tab B'}]}>
            {#snippet children(id)}
              <p class="text-sm text-(--text-muted) py-2">Content for {id}</p>
            {/snippet}
          </Tabs>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 4. LAYOUT PATTERNS -->
<section class="py-16 border-b border-(--border)">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold font-mono mb-8">Layout Patterns</h2>

    <div class="space-y-16">
      <div>
        <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Three-Column Grid</h3>
        <div class="grid md:grid-cols-3 gap-6">
          <Card variant="default">
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest mb-2 block">Developers</span>
            <h3 class="font-mono font-bold text-lg mb-2">No transparency</h3>
            <ul class="space-y-2 text-(--text-muted) text-sm list-disc list-inside">
              <li>Which model am I running?</li>
              <li>What can it do?</li>
              <li>Where does my data go?</li>
            </ul>
          </Card>
          <Card variant="default">
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest mb-2 block">Executives</span>
            <h3 class="font-mono font-bold text-lg mb-2">No choice</h3>
            <ul class="space-y-2 text-(--text-muted) text-sm list-disc list-inside">
              <li>Am I locked into one vendor?</li>
              <li>Can I swap the model easily?</li>
              <li>Is the ROI predictable?</li>
            </ul>
          </Card>
          <Card variant="default">
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest mb-2 block">Society</span>
            <h3 class="font-mono font-bold text-lg mb-2">No agency</h3>
            <ul class="space-y-2 text-(--text-muted) text-sm list-disc list-inside">
              <li>Who decides the environmental cost?</li>
              <li>Who controls the infrastructure?</li>
            </ul>
          </Card>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Manifesto Layout</h3>
        <div class="bg-(--surface) p-8 rounded-2xl border border-(--border) grid md:grid-cols-2 gap-8 items-start">
          <div>
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest block mb-2">The Solution</span>
            <h2 class="font-mono font-bold text-2xl mb-4">Silence is a business model.</h2>
            <p class="text-(--text-muted) text-sm leading-relaxed">SwISD flips the contract. You choose the models, and work routes only to peers that claim the capability.</p>
          </div>
          <ManifestoList items={solutions} ariaLabel="Principles" />
        </div>
      </div>

      <div>
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest mb-6">Architecture (Orbit Explainer)</h3>
        <div class="bg-(--surface) p-6 rounded-2xl border border-(--border)">
          <OrbitExplainer rundowns={ARCH_RUNDOWNS}>
            {#snippet header()}
              <span class="section-label">For Developers</span>
              <h2 class="section-title section-title-sm">The swarm has no brain.<br /><span class="lime">It has mathematics.</span></h2>
              <p class="section-desc">Most distributed systems solve coordination with a central brain. SwISD solves it with local gossip and convergent mathematics.</p>
            {/snippet}
          </OrbitExplainer>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Timeline</h3>
        <div class="max-w-2xl mx-auto">
          <RoadmapTimeline entries={roadmapEntries.slice(0, 2)} onSelect={() => {}} />
        </div>
      </div>

      <div>
        <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-4">Progressive Disclosure</h3>
        <p class="text-(--text-muted) text-sm leading-relaxed max-w-3xl mb-6">
          Rendering extensive lists at once degrades initial paint. This pattern uses localized state to smoothly reveal content.
        </p>
        <div class="bg-(--surface) p-6 rounded-2xl border border-(--border)">
          <ul class="space-y-4">
            {#each visibleItems as item (item.id)}
              <li class="flex items-center gap-4 p-4 rounded-xl bg-(--bg) border border-(--border)">
                <div class="w-10 h-10 rounded-full bg-(--color-lime)/10 flex items-center justify-center text-(--color-lime) font-mono font-bold text-sm shrink-0">
                  {item.id.split('-')[1]}
                </div>
                <div>
                  <h4 class="font-mono font-bold text-(--text)">{item.title}</h4>
                  <p class="text-xs text-(--text-muted)">{item.desc}</p>
                </div>
              </li>
            {/each}
          </ul>
          {#if revealCount < MOCK_LONG_LIST.length}
            <div class="pt-6 text-center">
              <Button variant="secondary" onclick={revealMore}>Reveal More <Arrow direction="down" /></Button>
            </div>
          {/if}
        </div>
      </div>

      <div>
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest mb-4">Case Study Layout</h3>
        <p class="text-(--text-muted) text-sm leading-relaxed max-w-3xl mb-8">
          The selected posture for the Case Studies archive. The <code class="text-(--color-lime)">CaseCard</code> primitive supports variance via the strictly typed <code class="text-(--color-lime)">layout</code> union prop. The first card shows a linked title + linked partner; the second shows the unlinked states.
        </p>

        <div>
          <h4 class="text-xs font-mono text-(--text-muted) uppercase tracking-widest mb-4">Split (Horizontal Grid)</h4>
          <div class="grid md:grid-cols-2 gap-6">
            <CaseCard project={sampleCase} layout="split" />
            <CaseCard project={sampleCase2} layout="split" />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest mb-4">Modal Patterns</h3>
        <p class="text-(--text-muted) text-sm leading-relaxed max-w-3xl mb-6">
          Accessible, snippet-driven dialogs enforcing a consistent anatomy: fixed header, scrollable content well, fixed footer.
        </p>
        <div class="flex flex-wrap gap-4">
          <Button variant="secondary" onclick={() => activeModal = 'text'}>1. Text-Only</Button>
          <Button variant="secondary" onclick={() => activeModal = 'split'}>2. Split-Media</Button>
          <Button variant="secondary" onclick={() => activeModal = 'appliance'}>3. Appliance</Button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- MODALS -->
<Modal isOpen={activeModal === 'text'} onClose={() => activeModal = null} ariaLabel="Trust Boundary Decision" size="text">
  {#snippet children()}
    <h3 class="font-mono font-bold text-2xl mb-4 text-(--text)">Trust Boundary</h3>
    <p class="text-(--text-muted) leading-relaxed">
      A stranger at the gate. Newly discovered peers dock in a limbo orbit as PENDING. Discovery is advisory only; the operator must explicitly trust the peer's Ed25519 identity.
    </p>
  {/snippet}
  {#snippet footer()}
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
      <span class="font-mono text-sm text-(--color-lime)">Peer ID: a7f3...e9b2</span>
      <div class="flex gap-3">
        <Button variant="primary" onclick={() => activeModal = null}>Trust</Button>
        <Button variant="secondary" onclick={() => activeModal = null}>Dismiss</Button>
      </div>
    </div>
  {/snippet}
</Modal>

<RoadmapModal entry={sampleRoadmapEntry} isOpen={activeModal === 'split'} onClose={() => activeModal = null} />

<Modal isOpen={activeModal === 'appliance'} onClose={() => activeModal = null} ariaLabel="Newsletter Subscription" size="appliance">
  {#snippet children()}
    <div class="text-center">
      <h3 class="font-mono font-bold text-xl mb-2 text-(--text)">Join the Swarm</h3>
      <p class="text-(--text-muted) text-sm mb-6">Get updates on SwISD development.</p>
      <TextField label="Email" type="email" placeholder="node@swarm.local" />
    </div>
  {/snippet}
  {#snippet footer()}
    <div class="flex flex-col items-center gap-4 text-center w-full">
      <span class="font-mono text-xs text-(--text-muted)">"No spam, ever"</span>
      <Button variant="primary" onclick={() => activeModal = null} class="w-full justify-center">Subscribe</Button>
    </div>
  {/snippet}
</Modal>

<Modal isOpen={isModalOpen} onClose={() => isModalOpen = false} ariaLabel="Standard Design Modal">
  {#snippet children()}
    <h3 class="font-mono font-bold text-xl mb-4">Standard Modal</h3>
    <p class="text-(--text-muted) mb-6 text-sm">The baseline accessible, snippet-driven dialog.</p>
  {/snippet}
  {#snippet footer()}
    <Button variant="primary" onclick={() => isModalOpen = false}>Close</Button>
  {/snippet}
</Modal>