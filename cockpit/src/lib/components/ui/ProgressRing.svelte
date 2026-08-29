<!--
1. Relative path: cockpit/src/lib/components/ui/ProgressRing.svelte
2. Description: Circular progress indicator primitive.
3. Expects: Progress value (0-100), optional size, and standard SVG attributes (like aria-label).
4. Provides: A strictly typed, accessible SVG progress ring.
-->
<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements';

  type Props = {
    value: number;
    size?: number;
    strokeWidth?: number;
    class?: string;
  } & SVGAttributes<SVGSVGElement>;

  let {
    value,
    size = 64,
    strokeWidth = 4,
    class: className,
    ...rest
  }: Props = $props();

  const radius = $derived((size - strokeWidth) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const offset = $derived(circumference - (value / 100) * circumference);
  const center = $derived(size / 2);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 {size} {size}"
  class={className}
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={value}
  {...rest}
>
  <circle
    cx={center}
    cy={center}
    r={radius}
    fill="none"
    stroke="var(--border)"
    stroke-width={strokeWidth}
  />
  <circle
    cx={center}
    cy={center}
    r={radius}
    fill="none"
    stroke="var(--accent)"
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-dasharray={circumference}
    stroke-dashoffset={offset}
    transform="rotate(-90 {center} {center})"
    style="transition: stroke-dashoffset var(--duration-normal) var(--ease);"
  />
</svg>