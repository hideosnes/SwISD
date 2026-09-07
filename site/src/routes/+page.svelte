<!--
1. Relative path: site/src/routes/+page.svelte
2. Description: SwISD marketing site with standardized sections and an interactive architecture orbit explainer.
3. Expects: Svelte 5 runes, SSR-safe DOM access.
4. Provides: Swarm-topology hero, dual-audience toggle, scroll reveal, sticky nav, orbit architecture explainer.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { SwarmCanvas, SegmentedControl } from '$lib/components/ui';
  import { OrbitExplainer, type Rundown } from '$lib/components/datavis';

  let mobileMenuOpen = $state(false);
  let navScrolled = $state(false);
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
      text: 'The elected ambassador. Diplomats are the sole bridge between swarms, holding connections to the diplomats of neighboring swarms to carry knowledge and route tasks across boundaries — without ever exposing raw data.',
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

  const navLinks = [
    { href: '#problem', label: 'Problem' },
    { href: '#solution', label: 'Solution' },
    { href: '#architecture', label: 'Architecture' },
    { href: '#business', label: 'For Business' },
    { href: '#philosophy', label: 'Philosophy' }
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
    { num: '01', title: 'Agency', text: 'You choose the models, not the platform. Open weights, opinionated interface. Full control over what runs on your hardware.' },
    { num: '02', title: 'Autonomy', text: 'Built-in metadata reporting. Edge-native, OS-agnostic infrastructure that works without centralized servers.' },
    { num: '03', title: 'Reciprocity', text: 'User-facing controls. Runs locally on your devices. Your data stays yours, always.' }
  ];

  const codeFeatures = [
    { icon: '⚙', title: 'Zero-config setup', text: 'Initialize a swarm node with a single command. No complex orchestration needed.' },
    { icon: '🔗', title: 'Model-agnostic', text: 'Works with any open-weight model. Bring your own, or use community models.' },
    { icon: '📊', title: 'Built-in telemetry', text: "Metadata reporting out of the box. Know what's running, where, and how." }
  ];

  const businessPoints = [
    { num: '1', title: 'Cost Reduction', text: 'Eliminate cloud inference costs. Run models on existing hardware at the edge.' },
    { num: '2', title: 'Data Sovereignty', text: 'Keep sensitive data on-premise. No third-party access, no compliance headaches.' },
    { num: '3', title: 'Future-Proof', text: 'Model-agnostic architecture. Switch models without rewriting infrastructure.' }
  ];

  const metrics = [
    { value: '~90%', label: 'Cloud cost reduction' },
    { value: '<50ms', label: 'Local inference latency' },
    { value: '100%', label: 'Data ownership' },
    { value: '0', label: 'Vendor dependencies' }
  ];

  const oldWay = ['Complexity', 'Obscurity', 'Incapacity', 'Dependency', 'Extraction'];
  const newWay = ['Agency', 'Autonomy', 'Reciprocity', 'Sovereignty', 'Contribution'];

  const partners = ['FFG', 'FH Salzburg', 'KUPF OÖ', 'homahuki.eu'];

  const GITHUB = 'https://github.com/hideosnes/swisd';
  const HOMAHUKI = 'https://www.homahuki.eu';

  function handleScroll() {
    navScrolled = window.scrollY > 50;
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function selectAudience(next: 'dev' | 'exec') {
    audience = next;
  }

  function smoothScroll(e: MouseEvent, href: string) {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeMobileMenu();
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

    window.addEventListener('scroll', handleScroll);
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    revealObserver?.disconnect();
    window.removeEventListener('scroll', handleScroll);
  });
</script>

<svelte:head>
  <title>SwISD | Swarm Inference on Small Devices</title>
  <meta name="description" content="SwISD is a decentralized, capability-aware P2P network for distributed AI inference on small devices." />
  <link rel="icon" href="data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='107'%20height='128'%20viewBox='0%200%20107%20128'%3e%3ctitle%3esvelte-logo%3c/title%3e%3cpath%20d='M94.157%2022.819c-10.4-14.885-30.94-19.297-45.792-9.835L22.282%2029.608A29.92%2029.92%200%200%200%208.764%2049.65a31.5%2031.5%200%200%200%203.108%2020.231%2030%2030%200%200%200-4.477%2011.183%2031.9%2031.9%200%200%200%205.448%2024.116c10.402%2014.887%2030.942%2019.297%2045.791%209.835l26.083-16.624A29.92%2029.92%200%200%200%2098.235%2078.35a31.53%2031.53%200%200%200-3.105-20.232%2030%2030%200%200%200%204.474-11.182%2031.88%2031.88%200%200%200-5.447-24.116'%20style='fill:%23ff3e00'/%3e%3cpath%20d='M45.817%20106.582a20.72%2020.72%200%200%201-22.237-8.243%2019.17%2019.17%200%200%201-3.277-14.503%2018%2018%200%200%201%20.624-2.435l.49-1.498%201.337.981a33.6%2033.6%200%200%200%2010.203%205.098l.97.294-.09.968a5.85%205.85%200%200%200%201.052%203.878%206.24%206.24%200%200%200%206.695%202.485%205.8%205.8%200%200%200%201.603-.704L69.27%2076.28a5.43%205.43%200%200%200%202.45-3.631%205.8%205.8%200%200%200-.987-4.371%206.24%206.24%200%200%200-6.698-2.487%205.7%205.7%200%200%200-1.6.704l-9.953%206.345a19%2019%200%200%201-5.296%202.326%2020.72%2020.72%200%200%201-22.237-8.243%2019.17%2019.17%200%200%201-3.277-14.502%2017.99%2017.99%200%200%201%208.13-12.052l26.081-16.623a19%2019%200%200%201%205.3-2.329%2020.72%2020.72%200%200%201%2022.237%208.243%2019.17%2019.17%200%200%201%203.277%2014.503%2018%2018%200%200%201-.624%202.435l-.49%201.498-1.337-.98a33.6%2033.6%200%200%200-10.203-5.1l-.97-.294.09-.968a5.86%205.86%200%200%200-1.052-3.878%206.24%206.24%200%200%200-6.696-2.485%205.8%205.8%200%200%200-1.602.704L37.73%2051.72a5.42%205.42%200%200%200-2.449%203.63%205.79%205.79%200%200%200%20.986%204.372%206.24%206.24%200%200%200%206.698%202.486%205.8%205.8%200%200%200%201.602-.704l9.952-6.342a19%2019%200%200%201%205.295-2.328%2020.72%2020.72%200%200%201%2022.237%208.242%2019.17%2019.17%200%200%201%203.277%2014.503%2018%2018%200%200%201-8.13%2012.053l-26.081%2016.622a19%2019%200%200%201-5.3%202.328'%20style='fill:%23fff'/%3e%3c/svg%3e" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-500-normal.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-700-normal.css" />
</svelte:head>

<nav class="navbar" class:scrolled={navScrolled}>
  <a href="#hero" class="nav-logo" onclick={(e) => smoothScroll(e, '#hero')}>
    <span class="logo-dot"></span>
    SwISD
  </a>
  <ul class="nav-links" class:open={mobileMenuOpen}>
    {#each navLinks as link}
      <li><a href={link.href} onclick={(e) => smoothScroll(e, link.href)}>{link.label}</a></li>
    {/each}
    <li><a href={GITHUB} target="_blank" rel="noopener noreferrer" class="nav-cta">GitHub ↗</a></li>
  </ul>
  <button
    type="button"
    class="mobile-menu-btn"
    onclick={toggleMobileMenu}
    aria-label="Toggle menu"
    aria-expanded={mobileMenuOpen}
  >
    {mobileMenuOpen ? '✕' : '☰'}
  </button>
</nav>

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
            Learn More →
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
    <div class="solution-layout">
      <div class="reveal">
        <span class="section-label">The Solution</span>
        <h2 class="section-title section-title-sm">
          <span class="silence">Silence</span> is a business model.<br />
          <span class="lime">We build the alternative.</span>
        </h2>
        <p class="section-desc">
          Agency is capability-aware by construction. Peers advertise the executors and models they actually run, and work flows only to nodes that explicitly claim the capability. You choose the models, and the swarm obeys. Autonomy is coordinator-free by mathematics. Membership, reputation, and task state live in Merkle-DAG CRDTs that converge on their own when peers vanish, while built-in telemetry reports what ran, where, and how. Reciprocity is symmetric by design. Your devices contribute compute, your models and data stay sharded inside your own swarm, and results return through a targeted encrypted tunnel to you, never broadcast and never surrendered to a third party.
        </p>
      </div>
      <div class="solution-stack reveal reveal-delay-2">
        {#each solutions as s, i (s.title)}
          <div class="solution-card">
            <span class="solution-card-number">{s.num}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        {/each}
      </div>
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
        <span class="section-label">Developer Experience</span>
        <h2 class="section-title section-title-sm">
          Ship in minutes,<br />
          <span class="lime">not months.</span>
        </h2>
        <div class="code-features">
          {#each codeFeatures as f (f.title)}
            <div class="code-feature">
              <div class="code-feature-icon" aria-hidden="true">{f.icon}</div>
              <div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            </div>
          {/each}
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
    <div class="business-layout">
      <div class="reveal">
        <span class="section-label">For Decision Makers</span>
        <h2 class="section-title section-title-sm">
          Infrastructure<br />
          <span class="lime">that scales with you.</span>
        </h2>
        <p class="section-desc" style="margin-top: 1rem;">Reduce costs. Eliminate vendor lock-in. Own your AI stack end-to-end.</p>
        <div class="business-points">
          {#each businessPoints as b (b.title)}
            <div class="business-point">
              <span class="business-point-num">{b.num}</span>
              <div>
                <h4>{b.title}</h4>
                <p>{b.text}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
      <div class="metrics-grid reveal reveal-delay-2">
        {#each metrics as m (m.label)}
          <div class="metric-card">
            <div class="metric-value">{m.value}</div>
            <div class="metric-label">{m.label}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<section id="philosophy">
  <div class="container">
    <div class="reveal" style="text-align: center; margin-bottom: 3rem;">
      <span class="section-label">Philosophy</span>
      <h2 class="section-title section-title-sm">Two paths forward.</h2>
    </div>
    <div class="philosophy-compare reveal">
      <div class="philosophy-col old">
        <p class="philosophy-col-label">Proprietary Platform</p>
        <h3 style="color: var(--gray-500);">The Old Way</h3>
        <ul>
          {#each oldWay as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
      <div class="philosophy-divider" aria-hidden="true">→</div>
      <div class="philosophy-col new">
        <p class="philosophy-col-label">Participatory Framework</p>
        <h3 style="color: var(--lime);">The SwISD Way</h3>
        <ul>
          {#each newWay as item}
            <li>✦ {item}</li>
          {/each}
        </ul>
      </div>
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

<section id="cta">
  <div class="cta-content">
    <div class="reveal">
      <h2 class="cta-title">
        Let's build AI infrastructure<br />
        that <span class="lime">puts people first.</span>
      </h2>
      <p class="cta-desc">SwISD is open-source and actively seeking contributors. Join the swarm.</p>
      <div class="cta-actions">
        <a href={GITHUB} target="_blank" rel="noopener noreferrer" class="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          Star on GitHub
        </a>
        <a href={HOMAHUKI} target="_blank" rel="noopener noreferrer" class="btn-secondary">
          Visit homahuki.eu →
        </a>
      </div>
    </div>
    <div class="cta-footer reveal">
      <p>A project by <a href={HOMAHUKI} target="_blank" rel="noopener noreferrer">homahuki.eu</a> &middot; Linz, Austria</p>
    </div>
  </div>
</section>

<footer>
  <div class="footer-content">
    <span class="footer-logo">SwISD</span>
    <div class="footer-links">
      <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="#architecture" onclick={(e) => smoothScroll(e, '#architecture')}>Docs</a>
      <a href="#philosophy" onclick={(e) => smoothScroll(e, '#philosophy')}>Philosophy</a>
      <a href={HOMAHUKI} target="_blank" rel="noopener noreferrer">homahuki.eu</a>
    </div>
    <span class="footer-copy">&copy; 2025 SwISD. Open Source.</span>
  </div>
</footer>