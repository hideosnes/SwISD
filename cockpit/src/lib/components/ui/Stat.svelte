<!-- 1. Relative path: cockpit/src/lib/components/ui/Stat.svelte
     2. Description: Data readout stat with label and value.
     3. Expects: Label, value, and optional variant.
     4. Provides: A themed stat component for telemetry display. -->

<script lang="ts">
  type Variant = 'default' | 'live' | 'accent' | 'warn';

  interface Props {
    label: string;
    value: string | number;
    variant?: Variant;
  }

  let { label, value, variant = 'default' }: Props = $props();
</script>

<div class="stat stat--{variant}">
  <div class="stat-k">{label}</div>
  <div class="stat-v mono">{value}</div>
</div>

<style>
  .stat {
    flex: 1;
    min-width: 96px;
    padding: 13px 15px;
    border-radius: var(--r-sm);
    background: rgba(0,255,200,.03);
    border: 1px solid var(--border);
  }

  .stat-k {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .stat-v {
    font-size: 21px;
    font-weight: 600;
    margin-top: 4px;
    letter-spacing: -0.02em;
    color: var(--text-1);
  }

  .stat--live .stat-v {
    color: var(--live);
    text-shadow: 0 0 14px rgba(0,255,200,.5);
  }

  .stat--accent .stat-v {
    color: var(--accent);
  }

  .stat--warn .stat-v {
    color: var(--warn);
  }
</style>