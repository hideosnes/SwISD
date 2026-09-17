<!--
1. Relative path: site/src/routes/design/+page.svelte
2. Description: Living style guide and design system documentation for SwISD.
3. Expects: Svelte 5 runes, global layout.css tokens, strict primitive composition.
4. Provides: A compact, context-aware visual catalog mimicking the live site structure, with side-by-side foundations.
-->
<script lang="ts">
  import { 
    Arrow, 
    Badge, 
    Button, 
    Card, 
    CodeBlock,
    LogoGallery, 
    ManifestoList, 
    Modal, 
    RoadmapTimeline,
    SegmentedControl,
    SwarmCanvas,
    Tabs,
    Tag,
    TextField,
    type LogoGalleryGroup 
  } from '$lib/components/ui';
  import { OrbitExplainer, type Rundown } from '$lib/components/datavis';
  import { type RoadmapEntry } from '$lib/content/roadmap';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { 
    huggingfaceLogo, 
    nodejsLogo, 
    webgpuLogo,
    ffgLogo,
    hpcjuLogo,
    stsbgLogo,
    kupfLogo,
    monochromLogo
  } from '$lib/assets';

  // State
  let isModalOpen = $state(false);
  let segmentedValue = $state<'dev' | 'exec'>('dev');

  // Mock Data
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
    {
      label: 'Research',
      items: [
        { src: ffgLogo, alt: 'FFG', wide: true },
        { src: hpcjuLogo, alt: 'EuroHPC JU', wide: true }
      ]
    },
    {
      label: 'Culture',
      items: [
        { src: kupfLogo, alt: 'Kupf', wide: true },
        { src: monochromLogo, alt: 'Monochrom', wide: true }
      ]
    }
  ];

  const ARCH_RUNDOWNS: readonly Rundown[] = [
    { actorId: 'conductor', pillar: 'Execution', title: 'Conductor', text: 'The brain.', chipLabel: 'Core' }
  ];

  const MOCK_ROADMAP: readonly RoadmapEntry[] = [
    { id: '1', title: 'Foundation', status: 'done', time: '2024', description: 'Core CRDTs.', type: 'milestone', image: '/swisd-01.jpg' },
    { id: '2', title: 'Swarm Routing', status: 'current', time: '2025', description: 'P2P gossip.', type: 'milestone', image: '/swisd-02.jpg' }
  ];

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
    <Badge variant="hero" label="Swarm Inference on Small Devices" />
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

<!-- 2. FOUNDATIONS (Side-by-Side) -->
<section class="py-12 border-b border-(--border)">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold font-mono mb-6">Foundations</h2>
    <div class="grid md:grid-cols-2 gap-8">
      
      <!-- Colors Column -->
      <div>
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest mb-4">Colors</h3>
        <div class="bg-(--surface) p-6 rounded-2xl border border-(--border)">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <div class="h-14 rounded-lg border border-(--border)" style="background: var(--color-lime, #54FF7E);"></div>
              <div>
                <p class="font-semibold text-(--text) text-sm">Lime</p>
                <p class="font-mono text-xs text-(--text-muted)">--color-lime</p>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <div class="h-14 rounded-lg border border-(--border)" style="background: var(--color-purple, #5E17EB);"></div>
              <div>
                <p class="font-semibold text-(--text) text-sm">Purple</p>
                <p class="font-mono text-xs text-(--text-muted)">--color-purple</p>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <div class="h-14 rounded-lg border border-(--border)" style="background: var(--color-gray-900, #111827);"></div>
              <div>
                <p class="font-semibold text-(--text) text-sm">Gray 900</p>
                <p class="font-mono text-xs text-(--text-muted)">--color-gray-900</p>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <div class="h-14 rounded-lg border border-(--border)" style="background: var(--color-gray-400, #9CA3AF);"></div>
              <div>
                <p class="font-semibold text-(--text) text-sm">Gray 400</p>
                <p class="font-mono text-xs text-(--text-muted)">--color-gray-400</p>
              </div>
            </div>
            <div class="flex flex-col gap-2 col-span-2">
              <div class="h-14 rounded-lg border border-(--border)" style="background: var(--color-white, #FFFFFF);"></div>
              <div>
                <p class="font-semibold text-(--text) text-sm">White</p>
                <p class="font-mono text-xs text-(--text-muted)">--color-white</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Typography Column -->
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
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest">H3 · Card</span>
            <h3 class="font-mono font-bold text-xl leading-tight">No transparency</h3>
            <span class="font-mono text-xs text-(--text-muted)">Mono · 700 · xl</span>
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

<!-- 3. PRIMITIVES (The Toolbox) -->
<section class="py-12 border-b border-(--border)">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold font-mono mb-6">Primitives</h2>
    
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Col 1: Controls -->
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
        <SegmentedControl options={SEGMENTED_OPTIONS} selected={segmentedValue} onSelect={(v) => segmentedValue = v} ariaLabel="Perspective" />
      </div>

      <!-- Col 2: Inputs & Feedback -->
      <div class="space-y-6">
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest">Inputs & Feedback</h3>
        <div class="space-y-3">
          <TextField label="Email" type="email" placeholder="node@swarm.local" />
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
          <Tag variant="idle">Offline</Tag>
        </div>
        <div class="flex gap-3">
          <Button variant="secondary" onclick={triggerToasts}>Trigger Toasts</Button>
          <Button variant="secondary" onclick={() => isModalOpen = true}>Open Modal</Button>
        </div>
      </div>

      <!-- Col 3: Navigation -->
      <div class="space-y-6">
        <h3 class="text-sm font-mono text-(--color-lime) uppercase tracking-widest">Navigation</h3>
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

<!-- 4. SECTIONS (The Stage: Contextual Layouts) -->
<section class="py-12 border-b border-(--border)">
  <div class="container mx-auto px-4">
    <h2 class="text-2xl font-bold font-mono mb-6">Layout Patterns</h2>

    <!-- Pattern A: Problem Grid -->
    <div class="mb-12">
      <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Three-Column Grid</h3>
      <div class="grid md:grid-cols-3 gap-6">
        <Card variant="default">
          <p class="text-xs text-(--text-muted) mb-2">Developers</p>
          <h3 class="font-mono font-bold text-lg mb-2">No transparency</h3>
          <p class="text-sm text-(--text-muted)">Which model am I running?</p>
        </Card>
        <Card variant="default">
          <p class="text-xs text-(--text-muted) mb-2">Executives</p>
          <h3 class="font-mono font-bold text-lg mb-2">No choice</h3>
          <p class="text-sm text-(--text-muted)">Locked into vendor stack?</p>
        </Card>
        <Card variant="default">
          <p class="text-xs text-(--text-muted) mb-2">Society</p>
          <h3 class="font-mono font-bold text-lg mb-2">No agency</h3>
          <p class="text-sm text-(--text-muted)">Who controls the infra?</p>
        </Card>
      </div>
    </div>

    <!-- Pattern B: Manifesto -->
    <div class="mb-12 bg-(--surface) p-8 rounded-2xl border border-(--border)">
      <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Manifesto Layout</h3>
      <div class="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest block mb-2">The Solution</span>
          <h2 class="font-mono font-bold text-2xl mb-4">Silence is a business model.</h2>
          <p class="text-(--text-muted) text-sm leading-relaxed">SwISD flips the contract. You choose the models, and work routes only to peers that claim the capability.</p>
        </div>
        <ManifestoList items={solutions} ariaLabel="Principles" />
      </div>
    </div>

    <!-- Pattern C: Code & Inline Gallery -->
    <div class="mb-12">
      <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Code Layout + Inline Gallery</h3>
      <div class="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 class="font-mono font-bold text-xl mb-2">The swarm is a function call.</h2>
          <p class="text-(--text-muted) text-sm mb-4">Boot devices with no monitor. Drop a FAT32 stick and the fleet provisions.</p>
          <LogoGallery groups={runtimeGroups} ariaLabel="Runtimes" variant="grid" columns={3} align="left" />
        </div>
        <CodeBlock filename="swarm.config.ts">
          <pre class="font-mono text-xs text-(--text)"><span class="text-(--color-purple)">import</span> &#123; SwarmNode &#125; <span class="text-(--color-purple)">from</span> <span class="text-(--color-lime)">'@swisd/core'</span>;
<span class="text-(--color-purple)">const</span> node = <span class="text-(--color-purple)">new</span> SwarmNode(&#123; capability: <span class="text-(--color-lime)">'inference'</span> &#125;);</pre>
        </CodeBlock>
      </div>
    </div>

    <!-- Pattern D: Centered Gallery -->
    <div class="mb-12 text-center">
      <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Centered Gallery (Wide Tiles)</h3>
      <div class="w-full">
        <LogoGallery groups={grantGroups} ariaLabel="Grants" variant="grid" columns={6} align="center" />
      </div>
    </div>

    <!-- Pattern E: Labeled Gallery -->
    <div class="mb-12 text-center">
      <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Labeled Gallery (Grouped)</h3>
      <div class="w-full">
        <LogoGallery groups={labeledGroups} ariaLabel="Partners" variant="grid" columns={4} align="center" />
      </div>
    </div>

    <!-- Pattern F: Architecture -->
    <div class="mb-12">
      <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Datavis: Orbit Explainer</h3>
      <div class="bg-(--surface) p-6 rounded-2xl border border-(--border)">
        <OrbitExplainer rundowns={ARCH_RUNDOWNS}>
          {#snippet header()}
            <span class="font-mono text-xs text-(--color-lime) uppercase tracking-widest block mb-2">Architecture</span>
            <h2 class="font-mono font-bold text-2xl mb-2">The swarm has no brain.</h2>
          {/snippet}
        </OrbitExplainer>
      </div>
    </div>

    <!-- Pattern G: Roadmap -->
    <div>
      <h3 class="text-sm font-mono text-(--text-muted) uppercase tracking-widest mb-6">Timeline</h3>
      <div class="max-w-2xl mx-auto">
        <RoadmapTimeline entries={MOCK_ROADMAP} onSelect={() => {}} />
      </div>
    </div>
  </div>
</section>

<!-- Modal -->
<Modal isOpen={isModalOpen} onClose={() => isModalOpen = false} ariaLabel="Design system modal">
  <div class="p-6">
    <h3 class="font-mono font-bold text-xl mb-4">Modal Primitive</h3>
    <p class="text-(--text-muted) mb-6 text-sm">Accessible, snippet-driven dialog.</p>
    <Button variant="primary" onclick={() => isModalOpen = false}>Close</Button>
  </div>
</Modal>