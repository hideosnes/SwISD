<!--
1. Relative path: site/src/routes/design/+page.svelte
2. Description: Living style guide and design system documentation for SwISD.
3. Expects: Svelte 5 runes, global layout.css tokens.
4. Provides: Visual catalog of colors, typography, components, and patterns.
-->
<script lang="ts">
  // Design page is purely presentational
</script>

<svelte:head>
  <title>SwISD Design System</title>
</svelte:head>

<div class="design-page">
  <!-- Header -->
  <header class="design-header">
    <div class="container">
      <h1>SwISD Design System</h1>
      <p class="design-intro">
        A living catalog of colors, typography, and components. One h1, one h2, one h3. Standardized and reusable.
      </p>
    </div>
  </header>

  <!-- Colors -->
  <section class="design-section">
    <div class="container">
      <h2>Colors</h2>
      <div class="color-grid">
        <div class="color-swatch">
          <div class="swatch" style="background: var(--color-lime);"></div>
          <p class="swatch-name">Lime</p>
          <p class="swatch-hex">#54FF7E</p>
        </div>
        <div class="color-swatch">
          <div class="swatch" style="background: var(--color-purple);"></div>
          <p class="swatch-name">Purple</p>
          <p class="swatch-hex">#5E17EB</p>
        </div>
        <div class="color-swatch">
          <div class="swatch" style="background: var(--color-gray-900);"></div>
          <p class="swatch-name">Gray 900</p>
          <p class="swatch-hex">#111827</p>
        </div>
        <div class="color-swatch">
          <div class="swatch" style="background: var(--color-gray-400);"></div>
          <p class="swatch-name">Gray 400</p>
          <p class="swatch-hex">#9CA3AF</p>
        </div>
        <div class="color-swatch">
          <div class="swatch" style="background: var(--color-white);"></div>
          <p class="swatch-name">White</p>
          <p class="swatch-hex">#FFFFFF</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Typography -->
  <section class="design-section">
    <div class="container">
      <h2>Typography</h2>
      <div class="type-showcase">
        <div class="type-sample">
          <span class="type-label">H1 — Display</span>
          <h1>Swarm Inference</h1>
          <p class="type-spec">JetBrains Mono · 700 · clamp(2.5rem, 7vw, 5.5rem) · lh 1.05</p>
        </div>
        <div class="type-sample">
          <span class="type-label">H2 — Section</span>
          <h2>The Question Cascade</h2>
          <p class="type-spec">JetBrains Mono · 700 · clamp(2rem, 4vw, 3.5rem) · lh 1.1</p>
        </div>
        <div class="type-sample">
          <span class="type-label">H3 — Card Title</span>
          <h3>No transparency</h3>
          <p class="type-spec">JetBrains Mono · 700 · 1.25rem · lh 1.3</p>
        </div>
        <div class="type-sample">
          <span class="type-label">Body</span>
          <p>From the developer choosing a model to the executive signing the contract to the citizen living inside the system's consequences.</p>
          <p class="type-spec">Inter · 400 · 1rem · lh 1.7</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Buttons -->
  <section class="design-section">
    <div class="container">
      <h2>Buttons</h2>
      <div class="button-showcase">
        <button class="btn btn-primary">Primary Action</button>
        <button class="btn btn-secondary">Secondary Action</button>
      </div>
    </div>
  </section>

  <!-- Cards -->
  <section class="design-section">
    <div class="container">
      <h2>Cards</h2>
      <div class="card-showcase">
        <div class="card">
          <p class="card-audience">Developers & Executives</p>
          <h3 class="card-title">No transparency</h3>
          <ul class="card-list">
            <li>Which model am I actually running?</li>
            <li>What can it do, what can't it do?</li>
            <li>Where does my data go once it leaves my hands?</li>
          </ul>
        </div>
        <div class="card-solution">
          <span class="card-solution-number">01</span>
          <h3>Agency</h3>
          <p>You choose the models, not the platform. Open weights, opinionated interface. Full control over what runs on your hardware.</p>
        </div>
        <div class="card-arch">
          <span class="card-arch-step">Step 01</span>
          <h3>Task Mediation</h3>
          <p>Proximity forms networks. SwISD checks closest nodes first, then expands the search radius intelligently.</p>
          <div class="card-arch-detail">CRDT-based state sync · Proximity routing</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Patterns -->
  <section class="design-section">
    <div class="container">
      <h2>Patterns</h2>
      
      <div class="pattern-block">
        <h3>Section Layout</h3>
        <div class="pattern-example">
          <div class="section-label">// The Problem</div>
          <h2>Today, the answer is silence.</h2>
          <p class="section-desc">
            From the developer choosing a model to the executive signing the contract to the citizen living inside the system's consequences.
          </p>
        </div>
      </div>

      <div class="pattern-block">
        <h3>Grid Layout</h3>
        <div class="pattern-example">
          <div class="grid-3">
            <div class="card">
              <p class="card-audience">Audience</p>
              <h3 class="card-title">Card 1</h3>
            </div>
            <div class="card">
              <p class="card-audience">Audience</p>
              <h3 class="card-title">Card 2</h3>
            </div>
            <div class="card">
              <p class="card-audience">Audience</p>
              <h3 class="card-title">Card 3</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="pattern-block">
        <h3>Code Block</h3>
        <div class="pattern-example">
          <div class="code-block">
            <div class="code-header">
              <span class="code-dot code-dot-red"></span>
              <span class="code-dot code-dot-yellow"></span>
              <span class="code-dot code-dot-green"></span>
              <span class="code-filename">example.ts</span>
            </div>
            <div class="code-body">
              <pre><span class="token-keyword">const</span> node = <span class="token-keyword">new</span> <span class="token-function">SwarmNode</span>(&#123; <span class="token-comment">// config</span> &#125;);</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="design-footer">
    <div class="container">
      <p>SwISD Design System · Standardized · Reusable · Token-Driven</p>
    </div>
  </footer>
</div>

<style>
  .design-page {
    background: var(--color-gray-900);
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  .design-header {
    padding: 6rem 0 4rem;
    text-align: center;
  }

  .design-intro {
    font-size: 1.25rem;
    color: var(--color-gray-400);
    max-width: 600px;
    margin: 1.5rem auto 0;
  }

  .design-section {
    padding: 4rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .design-section h2 {
    margin-bottom: 3rem;
  }

  /* Colors */
  .color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .color-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .color-swatch {
    text-align: center;
  }

  .swatch {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 1rem;
    margin-bottom: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .swatch-name {
    font-weight: 600;
    color: var(--color-white);
    margin-bottom: 0.25rem;
  }

  .swatch-hex {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--color-gray-500);
  }

  /* Typography */
  .type-showcase {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .type-sample {
    padding: 2rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 1rem;
  }

  .type-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--color-lime);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
    display: block;
  }

  .type-spec {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--color-gray-500);
    margin-top: 1rem;
  }

  /* Buttons */
  .button-showcase {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  /* Cards */
  .card-showcase {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .card-showcase {
      grid-template-columns: 1fr;
    }
  }

  /* Patterns */
  .pattern-block {
    margin-bottom: 4rem;
  }

  .pattern-block h3 {
    margin-bottom: 2rem;
    color: var(--color-white);
  }

  .pattern-example {
    padding: 2rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 1rem;
  }

  /* Footer */
  .design-footer {
    padding: 3rem 0;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin-top: 4rem;
  }

  .design-footer p {
    color: var(--color-gray-500);
    font-size: 0.875rem;
  }
</style>