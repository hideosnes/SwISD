<!-- 1. Relative path: cockpit/src/lib/components/ui/SwarmPulse.svelte
     2. Description: Global swarm state indicator with animated pulse.
     3. Expects: Current swarm state.
     4. Provides: A persistent top-nav indicator for idle/working/shedding states. -->

<script lang="ts">
  type SwarmState = 'idle' | 'working' | 'shedding' | 'error' | 'awaiting';

  interface Props {
    state: SwarmState;
  }

  let { state }: Props = $props();

  const stateConfig = $derived.by(() => {
    switch (state) {
      case 'idle':
        return { color: 'var(--text-3)', label: 'IDLE', animation: 'breathe 4s ease-in-out infinite' };
      case 'working':
        return { color: 'var(--live)', label: 'WORKING', animation: 'pulse-glow 1.5s ease-in-out infinite' };
      case 'shedding':
        return { color: 'var(--warn)', label: 'SHEDDING', animation: 'blink 0.8s steps(2) infinite' };
      case 'error':
        return { color: 'var(--danger)', label: 'ERROR', animation: 'none' };
      case 'awaiting':
        return { color: 'var(--accent)', label: 'AWAITING', animation: 'blink 1.2s ease-in-out infinite' };
    }
  });
</script>

<div class="swarm-pulse" title="Swarm State: {stateConfig.label}">
  <span class="pulse-dot" style="background: {stateConfig.color}; animation: {stateConfig.animation}"></span>
  <span class="pulse-label mono">{stateConfig.label}</span>
</div>

<style>
  .swarm-pulse {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: var(--surface-2);
  }

  .pulse-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

  .pulse-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--text-2);
  }
</style>