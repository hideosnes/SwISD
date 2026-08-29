<!-- 1. Relative path: cockpit/src/lib/components/ui/StatusPill.svelte
     2. Description: Status indicator pill with animated dot.
     3. Expects: Status variant and label text.
     4. Provides: A themed status indicator for swarm/peer state. -->

<script lang="ts">
  type Status = 'live' | 'warn' | 'accent' | 'idle';

  interface Props {
    status: Status;
    label: string;
  }

  let { status, label }: Props = $props();
</script>

<span class="pill pill--{status}">
  <span class="dot"></span>
  {label}
</span>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 11px;
    border-radius: var(--r-sm);
    background: var(--surface-2);
    border: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 1px;
  }

  .pill--live {
    color: var(--live);
  }

  .pill--live .dot {
    background: var(--live);
    box-shadow: 0 0 8px var(--live);
    animation: breathe 2.4s ease-in-out infinite;
  }

  .pill--warn {
    color: var(--warn);
  }

  .pill--warn .dot {
    background: var(--warn);
    box-shadow: 0 0 8px var(--warn);
    animation: blink 1s steps(2) infinite;
  }

  .pill--accent {
    color: var(--accent);
  }

  .pill--accent .dot {
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
    animation: blink 1.6s ease-in-out infinite;
  }

  .pill--idle {
    color: var(--text-3);
  }

  .pill--idle .dot {
    background: var(--text-3);
  }
</style>