<!--
1. Relative path: site/src/lib/components/datavis/StatsChart.svelte
2. Description: Headless D3-math, Svelte-SVG bar chart primitive for statistical data.
3. Expects: Array of ChartDataPoint, optional width/height.
4. Provides: Accessible, token-themed SVG bar chart. Zero styled graph frameworks.
-->
<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import type { ChartDataPoint } from '$lib/content/schema';

  interface Props {
    data: ChartDataPoint[];
    width?: number;
    height?: number;
  }

  let { data, width = 400, height = 200 }: Props = $props();

  const maxValue = $derived(Math.max(...data.map(d => d.value), 0));
  const xScale = $derived(scaleLinear().domain([0, data.length]).range([0, width]));
  const yScale = $derived(scaleLinear().domain([0, maxValue]).range([height, 0]));
  const barWidth = $derived((width / data.length) * 0.8);
  const barOffset = $derived((width / data.length) * 0.1);
</script>

<svg {width} {height} role="img" aria-label="Statistical bar chart" class="overflow-visible">
  <title>Statistical Bar Chart</title>
  
  {#each data as d, i}
    {@const x = xScale(i) + barOffset}
    {@const y = yScale(d.value)}
    {@const h = height - y}
    
    <g role="graphics-symbol" aria-label={`${d.label}: ${d.value}`}>
      <rect
        x={x}
        y={y}
        width={barWidth}
        height={h}
        fill="var(--accent)"
        rx="2"
      />
      <text
        x={x + barWidth / 2}
        y={height + 16}
        text-anchor="middle"
        font-size="12"
        fill="var(--fg-muted)"
      >
        {d.label}
      </text>
      <text
        x={x + barWidth / 2}
        y={y - 6}
        text-anchor="middle"
        font-size="12"
        font-weight="600"
        fill="var(--fg)"
      >
        {d.value}
      </text>
    </g>
  {/each}
</svg>