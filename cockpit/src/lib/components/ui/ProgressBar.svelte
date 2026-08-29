<!-- 1. Relative path: cockpit/src/lib/components/ui/ProgressBar.svelte
     2. Description: Linear progress bar for download/task progress.
     3. Expects: Progress value (0-100).
     4. Provides: A themed progress bar with phosphor glow. -->

<script lang="ts">
  interface Props {
    value: number;
  }

  let { value }: Props = $props();

  const clampedValue = $derived(Math.max(0, Math.min(100, value)));
</script>

<div class="bar">
  <div class="bar-fill" style="width: {clampedValue}%"></div>
</div>

<style>
  .bar {
    height: 5px;
    border-radius: 2px;
    background: var(--surface-3);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 2px;
    background: var(--live);
    box-shadow: 0 0 10px rgba(0,255,200,.7);
    transition: width 200ms linear;
  }
</style>