<!--
1. Relative path: site/src/routes/+page.svelte
2. Description: SwISD marketing site with standardized sections and an interactive architecture orbit explainer.
3. Expects: Svelte 5 runes, SSR-safe DOM access.
4. Provides: Swarm-topology hero, dual-audience toggle, scroll reveal, orbit architecture explainer.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Arrow, LogoGallery, ManifestoList, SwarmCanvas, SegmentedControl, type LogoGalleryItem } from '$lib/components/ui';
  import { OrbitExplainer, type Rundown } from '$lib/components/datavis';
  import { currentEntry } from '$lib/content/roadmap';
  import { swisdLogo, huggingfaceLogo, nodejsLogo, webgpuLogo, sdg9, sdg12, sdg16 } from '$lib/assets';

  let revealObserver: IntersectionObserver | null = null;
  let audience = $state<'dev' | 'exec'>('dev');

  const AUDIENCE_OPTIONS: readonly { value: 'dev' | 'exec'; label: string }[] = [
    { value: 'dev', label: 'For Developers' },
    { value: 'exec', label: 'For Executives' }
  ];

  const AUDIENCE_COPY: Record<'dev' | 'exec', string> = {
    dev: "SwISD is a capability-aware, polymorphic P2P render engine: tasks enter blind, workloads propagate neighborhood-by-neighborhood like a torrent, and results return through targeted, encrypted tunnels. Beautifully dumb stateless agents on phones, boards, and browsers pool whatever compute they have: No cloud. No coordinator. No vendor lock-in.",
    exec: "SwISD turns the devices you already own into AI infrastructure: no rented datacenter, no opaque energy bill, no third party holding your data. The swarm computes on hardware that already exists, keeps inference where your data lives, and stays model-agnostic so tomorrow's model slots into today's infrastructure. Costs in sight. Data at home. Control in hand."
  };

  const ARCH_RUNDOWNS: readonly Rundown[] = [
    {
      actorId: 'conductor',
      pillar: 'Workload Execution',
      title: 'The Conductor',
      text: "The operator's stateful brain. It chunks your task into 256KB blocks, Merkle-hashes each for integrity and HMAC-signs each for authenticity, then opens a direct encrypted tunnel to pull results home. Ingress is blind; egress is targeted.",
      chipLabel: 'Conductor'
    },
    {
      actorId: 'worker',
      pillar: 'Task Mediation',
      title: 'The Worker',
      text: 'Beautifully dumb and stateless. Workers advertise the executors they support, take only the chunks they are capable of running, execute them in parallel, and reassemble the result via Merkle proofs. Drop one and the task preempts to the next peer instantly.',
      chipLabel: 'Worker'
    },
    {
      actorId: 'diplomat',
      pillar: 'Deep Networking',
      title: 'The Diplomat',
      text: 'The elected ambassador. Diplomats are the sole bridge between swarms, holding connections to the diplomats of neighboring swarms to carry knowledge and route tasks across boundaries without ever exposing raw data.',
      chipLabel: 'Diplomat'
    },
    {
      actorId: 'ghost',
      pillar: 'Trust Boundary',
      title: 'The Ghost',
      text: "A stranger at the gate. Newly discovered peers dock in a limbo orbit as PENDING. Discovery is advisory only; the operator must explicitly trust the peer's Ed25519 identity before it may join CRDT gossip or receive tasks.",
      chipLabel: 'Ghost'
    }
  ];

  const problems = [
    {
      audience: 'Developers & Executives',
      title: 'No transparency',
      items: [
        'Which model am I actually running?',
        "What can it do, what can't it do?",
        'Where does my data go once it leaves my hands?'
      ]
    },
    {
      audience: 'Customers & Users',
      title: 'No choice',
      items: [
        "Am I locked into one vendor's stack?",
        'Can I swap the model without rewriting my pipeline?',
        'Do I have a credible alternative?'
      ]
    },
    {
      audience: 'Society & Individuals',
      title: 'No agency',
      items: [
        'Can I influence how the system scales?',
        'Who decides the environmental and economic cost?',
        'Who actually controls the infrastructure I depend on?'
      ]
    }
  ];

  const solutions = [
    { title: 'Agency', text: 'You choose the models, not the platform. Open weights, opinionated interface. Full control over what runs on your hardware.' },
    { title: 'Autonomy', text: 'Built-in metadata reporting. Edge-native, OS-agnostic infrastructure that works without centralized servers.' },
    { title: 'Reciprocity', text: 'User-facing controls. Runs locally on your devices. Your data stays yours, always.' }
  ];

  const businessPoints = [
    { title: 'Cost Reduction', text: 'Eliminate unpredictable cloud bills by running AI workloads directly on the hardware you already own.' },
    { title: 'Data Sovereignty', text: 'Keep sensitive information entirely on-premise, safely insulated from third-party access and compliance risks.' },
    { title: 'Independence', text: 'Adopt new AI models and operating systems freely without rewriting your infrastructure or losing historical context.' },
    { title: 'Sustainability', text: 'Extend the lifespan of your existing devices to eliminate e-waste while precisely tracking your environmental footprint.' }
  ];

  const runtimeLogos: readonly LogoGalleryItem[] = [
    { src: webgpuLogo, alt: 'WebGPU' },
    { src: nodejsLogo, alt: 'NodeJS' },
    { src: huggingfaceLogo, alt: 'HuggingFace' }
  ];

  const sdgLogos: readonly LogoGalleryItem[] = [
    { src: sdg9, alt: 'SDG9' },
    { src: sdg12, alt: 'SDG12' },
    { src: sdg16, alt: 'SDG16' }
  ];

  const oldWay = ['Complexity', 'Obscurity', 'Incapacity', 'Dependency', 'Extraction'];
  const newWay = ['Agency', 'Autonomy', 'Reciprocity', 'Sovereignty', 'Contribution'];

  const partners = ['FFG', 'FH Salzburg', 'KUPF OÖ', 'homahuki.eu'];

  const GITHUB = 'https://github.com/hideosnes/swisd';
  const HOMAHUKI = 'https://www.homahuki.eu';

  function selectAudience(next: 'dev' | 'exec') {
    audience = next;
  }

  function smoothScroll(e: MouseEvent, href: string) {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onMount(() => {
    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver?.observe(el));
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    revealObserver?.disconnect();
  });
</script>

<svelte:head>
  <title>SwISD | Swarm Inference on Small Devices</title>
  <meta name="description" content="SwISD is a decentralized, capability-aware P2P network for distributed AI inference on small devices." />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-500-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-700-normal.css" />
</svelte:head>

<section id="hero">
  <SwarmCanvas />
  <div class="hero-content">
    <div class="hero-badge">
      <span class="badge-dot"></span>
      Swarm Inference on Small Devices
    </div>
    <h1 class="hero-title">
      AI Inference<br />
      <span class="highlight">On Your Terms</span>
    </h1>

    <div class="hero-toggle">
      <SegmentedControl
        options={AUDIENCE_OPTIONS}
        selected={audience}
        onSelect={selectAudience}
        ariaLabel="Choose your perspective"
      />
    </div>

    <div class="hero-subtitle-wrap">
      {#key audience}
        <div class="hero-subtitle hero-swap">
          <p>{AUDIENCE_COPY[audience]}</p>
          <a href="#problem" class="btn-secondary" onclick={(e) => smoothScroll(e, '#problem')}>
            Learn More <Arrow direction="down" />
          </a>
        </div>
      {/key}
    </div>
  </div>
</section>

<section id="problem">
  <div class="container">
    <div class="reveal">
      <span class="section-label">The Problem</span>
      <h2 class="section-title section-title-sm">
        Three audiences. One wall.<br />
        <span class="lime">The answer is <span class="silence">silence</span>.</span>
      </h2>
      <p class="section-desc">
        From the developer choosing a model to the executive signing the contract to the citizen living inside the system's consequences. Three audiences with different questions, hit by the same wall: an opaque, centralized black box that answers none of them honestly.
      </p>
    </div>
    <div class="problem-grid">
      {#each problems as p, i (p.title)}
        <div class="problem-card reveal reveal-delay-{i + 1}">
          <p class="card-audience">{p.audience}</p>
          <h3>{p.title}</h3>
          <ul>
            {#each p.items as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
</section>

<section id="solution">
  <div class="container">
    <div class="manifesto-layout">
      <div class="reveal">
        <span class="section-label">The Solution</span>
        <h2 class="section-title section-title-sm">
          <span class="silence">Silence</span> is a business model.<br />
          <span class="lime">We build the alternative.</span>
        </h2>
        <p class="section-desc">
          Proprietary AI rents you a black box. You don't own the model, the data, or the bill. SwISD flips the contract. You choose the models, and work routes only to peers that claim the capability. The swarm converges without a coordinator, through mathematics that heal when peers vanish. Your data stays sharded inside your own network and returns through a targeted tunnel. Never broadcast. Never surrendered.
        </p>
      </div>
      <div class="manifesto-block reveal reveal-delay-2">
        <ManifestoList items={solutions} ariaLabel="SwISD principles" />
      </div>
    </div>
  </div>
</section>

<section id="showcase" class="cta-band">
  <div class="cta-content reveal">
    <h2 class="cta-title">
      One framework. Many ideas.<br />
      <span class="lime">Creativity is the only limit.</span>
    </h2>
    <p class="cta-desc">
      Glitch-proof live audio. Cultural archives that answer your questions. Spectrogram transformers that help researchers hear. These are the first ideas already taking shape on the swarm.
    </p>
    <div class="cta-actions">
      <a href="/example" class="btn-primary">
        Examples <Arrow direction="right" />
      </a>
      <a href="#architecture" class="btn-secondary" onclick={(e) => smoothScroll(e, '#architecture')}>
        Learn more <Arrow direction="down" />
      </a>
    </div>
  </div>
</section>

<section id="architecture">
  <div class="container">
    <div class="reveal">
      <OrbitExplainer rundowns={ARCH_RUNDOWNS}>
        {#snippet header()}
          <span class="section-label">For Developers</span>
          <h2 class="section-title section-title-sm">
            The swarm has no brain.<br />
            <span class="lime">It has mathematics.</span>
          </h2>
          <p class="section-desc">
            Most distributed systems solve coordination with a central brain. SwISD solves it with local gossip, content-addressed chunks, and convergent mathematics. These three mechanisms replace the coordinator with topology, verification, and learning, and every one of them is clickable below.
          </p>
        {/snippet}
      </OrbitExplainer>
    </div>
  </div>
</section>

<section id="code-section">
  <div class="container">
    <div class="code-layout">
      <div class="reveal">
        <span class="section-label">Implementation</span>
        <h2 class="section-title section-title-sm">
          No cluster to provision.<br />
          <span class="lime">The swarm is a function call.</span>
        </h2>
        <p class="section-desc">
          Boot devices with no monitor, no router, no YAML. Without a network, the Conductor spins up its own hotspot and mDNS announces every node on the wire. A phone injects WiFi credentials in one tap. Drop a FAT32 stick with a single JSON file and the whole fleet provisions identically. One command, no orchestrator, no Terraform, no certification required.  
        </p>
        <div class="logo-gallery-slot">
          <LogoGallery items={runtimeLogos} ariaLabel="Supported runtimes" align="left" />
        </div>
      </div>
      <div class="code-block reveal reveal-delay-2">
        <div class="code-header">
          <span class="code-dot red"></span>
          <span class="code-dot yellow"></span>
          <span class="code-dot green"></span>
          <span class="code-filename">swarm.config.ts</span>
        </div>
        <div class="code-body">
<pre><span class="comment">// Initialize a SwISD swarm node</span>
<span class="keyword">import</span> &#123; <span class="func">SwarmNode</span> &#125; <span class="keyword">from</span> <span class="string">'@swisd/core'</span>;

<span class="keyword">const</span> node = <span class="keyword">new</span> <span class="func">SwarmNode</span>(&#123;
  <span class="type">capability</span>: <span class="string">'inference'</span>,
  <span class="type">model</span>: <span class="string">'llama-3.2-1b'</span>,
  <span class="type">chunkSize</span>: <span class="number">256</span> * <span class="number">1024</span>,
  <span class="type">network</span>: &#123;
    <span class="type">protocol</span>: <span class="string">'p2p'</span>,
    <span class="type">discovery</span>: <span class="string">'proximity'</span>,
    <span class="type">sync</span>: <span class="string">'crdt'</span>,
  &#125;,
  <span class="type">privacy</span>: &#123;
    <span class="type">federated</span>: <span class="keyword">true</span>,
    <span class="type">localOnly</span>: <span class="keyword">true</span>,
  &#125;
&#125;);

<span class="keyword">await</span> node.<span class="func">join</span>();
<span class="comment">// ✓ Node online. Swarm ready.</span></pre>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="business">
  <div class="container">
    <div class="manifesto-layout">
      <div class="reveal">
        <span class="section-label">For Decision Makers</span>
        <h2 class="section-title section-title-sm">
          AI Infrastructure<br />
          <span class="lime">that scales with you.</span>
        </h2>
        <p class="section-desc">
          SwISD meets your business where it already stands. It works with the systems you run today, no migration required. Setup is simple, maintenance stays light, and nothing is locked to a single vendor or buried in a bill. Every task, every watt, every cost shows up in reporting your board can actually read.
        </p>
        <div class="logo-gallery-slot">
          <LogoGallery items={sdgLogos} ariaLabel="SDG's" align="left" />
        </div>
      </div>
      <div class="manifesto-block reveal reveal-delay-2">
        <ManifestoList items={businessPoints} ariaLabel="Business value" />
      </div>
    </div>
  </div>
</section>

<section id="research" class="cta-band cta-band-thin">
  <div class="container">
    <div class="cta-band-inner reveal">
      <div>
        <span class="section-label">The Science</span>
        <h2 class="section-title section-title-sm">
          We build infrastructure<br />
          <span class="lime">and grow knowledge.</span>
        </h2>
      </div>
      <div class="cta-actions-right">
        <a href="/research" class="btn-primary">
          Read the Whitepapers <Arrow direction="right" />
        </a>
        <a href="#roadmap" class="btn-secondary" onclick={(e) => smoothScroll(e, '#roadmap')}>
          Learn more <Arrow direction="down" />
        </a>
      </div>
    </div>
  </div>
</section>

<section id="roadmap-preview">
  <div class="container">
    <div class="reveal" style="text-align: center; margin-bottom: 3rem;">
      <span class="section-label">Roadmap</span>
      <h2 class="section-title section-title-sm">
        {#if currentEntry}
          Currently building:<br />
          <span class="lime">{currentEntry.title}</span>
        {:else}
          The path forward.
        {/if}
      </h2>
      {#if currentEntry?.description}
        <p class="section-desc" style="margin: 0 auto;">{currentEntry.description}</p>
      {/if}
    </div>
    <div class="reveal" style="text-align: center;">
      <a href="/roadmap" class="btn-primary">View Full Timeline <Arrow direction="right" /></a>
    </div>
  </div>
</section>

<section id="traction">
  <div class="container">
    <div class="reveal" style="text-align: center;">
      <span class="section-label">Traction</span>
      <h2 class="section-title section-title-sm">Building the Federated Future</h2>
      <p class="section-desc" style="margin: 0 auto;">Supported by serious research. Trusted by institutions.</p>
    </div>
    <div class="partners-grid reveal">
      {#each partners as p (p)}
        <div class="partner-card">
          <span>{p}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<section id="cta" class="cta-band">
  <div class="cta-content">
    <div class="reveal">
      <h2 class="cta-title">
        Let's build AI infrastructure<br />
        that <span class="lime">puts people first.</span>
      </h2>
      <p class="cta-desc">SwISD is open-source and actively seeking contributors. Join the swarm.</p>
      <div class="cta-actions">
        <a href={GITHUB} target="_blank" rel="noopener noreferrer" class="btn-primary">
          Star on GitHub <Arrow direction="external" />
        </a>
        <a href={HOMAHUKI} target="_blank" rel="noopener noreferrer" class="btn-secondary">
          Visit homahuki.eu <Arrow direction="external" />
        </a>
      </div>
    </div>
    <div class="cta-footer reveal">
      <p>A project by <a href={HOMAHUKI} target="_blank" rel="noopener noreferrer">homahuki.eu <Arrow direction="external" /></a> &middot; Linz, Austria</p>
    </div>
  </div>
</section>