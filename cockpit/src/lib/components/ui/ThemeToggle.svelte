<!--
1. Relative path: cockpit/src/lib/components/ui/ThemeToggle.svelte
2. Description: Accessible light/dark regime quick-flip primitive.
3. Expects: The active regime ('light' | 'dark') and a typed toggle callback.
4. Provides: A token-styled switch with visible state label, full keyboard and ARIA switch semantics.
-->

<script lang="ts">
  import type { Regime } from '$lib';

  let {
    regime,
    ontoggle
  }: {
    regime: Regime;
    ontoggle: (next: Regime) => void;
  } = $props();

  function handleToggle(): void {
    ontoggle(regime === 'dark' ? 'light' : 'dark');
  }
</script>

<button
  type="button"
  class="toggle"
  role="switch"
  aria-checked={regime === 'dark'}
  onclick={handleToggle}
>
  <span class="toggle-track" aria-hidden="true">
    <span class="toggle-thumb" class:toggle-thumb--dark={regime === 'dark'}></span>
  </span>
  <span class="toggle-label mono">{regime === 'dark' ? 'DARK' : 'LIGHT'}</span>
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-2);
    transition: color var(--duration-fast) var(--ease);
  }

  .toggle:hover {
    color: var(--text-1);
  }

  .toggle-track {
    position: relative;
    width: 40px;
    height: 20px;
    border-radius: var(--r-full);
    background: var(--surface-3);
    transition: background var(--duration-fast) var(--ease);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: var(--r-full);
    background: var(--accent-fill);
    box-shadow: var(--glow-accent);
    transition: transform var(--duration-normal) var(--ease);
  }

  .toggle-thumb--dark {
    transform: translateX(20px);
  }

  .toggle-label {
    font-size: var(--font-size-2xs);
    font-weight: 700;
    letter-spacing: 0.14em;
  }
</style>