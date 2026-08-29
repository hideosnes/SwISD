<!-- 1. Relative path: cockpit/src/lib/components/ui/ProgressRing.svelte
     2. Description: Circular progress indicator for download/task progress.
     3. Expects: Progress value (0-100) and optional size.
     4. Provides: A themed SVG progress ring with phosphor glow. -->

<script lang="ts">
  interface Props {
    value: number;
    size?: number;
    strokeWidth?: number;
  }

  let {
    value,
    size = 72,
    strokeWidth = 6,
  }: Props = $props();

  const radius = $derived((size - strokeWidth) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const offset = $derived(circumference * (1 - Math.max(0, Math.min(100, value)) / 100));
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 {size} {size}"
  aria-hidden="true"
>
  <circle
    class="ring-track"
    cx={size / 2}
    cy={size / 2}
    r={radius}
    fill="none"
    stroke-width={strokeWidth}
  />
  <circle
    class="ring-fill"
    cx={size / 2}
    cy={size / 2}
    r={radius}
    fill="none"
    stroke-width={strokeWidth}
    stroke-dasharray={circumference}
    stroke-dashoffset={offset}
    transform="rotate(-90 {size / 2} {size / 2})"
  />
</svg>

<style>
  .ring-track {
    stroke: var(--surface-3);
  }

  .ring-fill {
    stroke: var(--live);
    stroke-linecap: butt;
    transition: stroke-dashoffset 200ms linear;
    filter: drop-shadow(0 0 4px rgba(0,255,200,.8));
  }
</style>