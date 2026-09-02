<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/SwarmNode.svelte
2. Description: Renders a trusted swarm peer as a layered interactive SVG node — stress arc, modality cake, and a device icon.
3. Expects: A LaidOutPeer model with position, radius, device type, modalities, and load score.
4. Provides: A clickable, accessible SVG group with device icon, modality cake, and stress arc.
-->
<script lang="ts">
  import type { LaidOutPeer, DeviceType, ModalityCode } from '../types.js';
  import { modalityToColor, loadToStressColor, stressArcPath } from './layout.js';

  import raspiIcon from '$lib/assets/icons/device-raspi.svg?raw';
  import arduinoIcon from '$lib/assets/icons/device-arduino.svg?raw';
  import androidIcon from '$lib/assets/icons/device-android.svg?raw';
  import iosIcon from '$lib/assets/icons/device-ios.svg?raw';
  import windowsIcon from '$lib/assets/icons/device-windows.svg?raw';
  import linuxIcon from '$lib/assets/icons/device-linux.svg?raw';
  import appleIcon from '$lib/assets/icons/device-apple.svg?raw';
  import unknownIcon from '$lib/assets/icons/device-unknown.svg?raw';

  let {
    peer,
    onclick,
    onkeydown
  }: {
    peer: LaidOutPeer;
    onclick?: (e: MouseEvent) => void;
    onkeydown?: (e: KeyboardEvent) => void;
  } = $props();

  const deviceIconMap: Record<DeviceType, string> = {
    raspi: raspiIcon,
    arduino: arduinoIcon,
    android: androidIcon,
    ios: iosIcon,
    windows: windowsIcon,
    linux: linuxIcon,
    apple: appleIcon,
    unknown: unknownIcon,
  };

  const label = $derived(`Peer ${peer.peer.peerId.slice(0, 8)} - Load: ${peer.peer.loadScore ?? 'Unknown'}`);

  const deviceIcon = $derived(deviceIconMap[peer.peer.deviceType]);
  const iconSize = $derived(peer.nodeRadius * 0.6);
  const iconWellRadius = $derived(iconSize * 0.6);
  
  // FIXED: Strip the outer <svg> wrapper and width/height attributes from the injected icon.
  // This injects only the <path> elements, allowing the parent <g> transform to control sizing.
  const iconContent = $derived(() => {
    return deviceIcon
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '')
      .replace(/\s*width="[^"]*"/g, '')
      .replace(/\s*height="[^"]*"/g, '');
  });

  const modalitySlices = $derived(() => {
    const modalities = peer.peer.modalities;
    if (modalities.length === 0) return [];
    const sliceAngle = (Math.PI * 2) / modalities.length;
    return modalities.map((mod, i) => ({
      modality: mod,
      color: modalityToColor(mod),
      startAngle: i * sliceAngle,
      endAngle: (i + 1) * sliceAngle,
    }));
  });

  function modalitySlicePath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  const stressColor = $derived(
    peer.peer.loadScore !== null ? loadToStressColor(peer.peer.loadScore) : 'var(--text-muted)'
  );

  const stressPath = $derived(
    peer.peer.loadScore !== null
      ? stressArcPath(0, 0, peer.nodeRadius + 6, peer.peer.loadScore)
      : ''
  );
</script>

<g
  transform="translate({peer.position.x}, {peer.position.y})"
  class="topology-node"
  role="button"
  tabindex="0"
  aria-label={label}
  {onclick}
  {onkeydown}
>
  <!-- Layer 1 (outermost): Stress arc -->
  {#if stressPath}
    <path d={stressPath} class="topology-node__stress-arc" style="stroke: {stressColor}" />
  {/if}

  <!-- Layer 2: Modality cake -->
  <g class="topology-node__cake">
    {#each modalitySlices() as slice}
      <path
        d={modalitySlicePath(0, 0, peer.nodeRadius, slice.startAngle, slice.endAngle)}
        class="topology-node__cake-slice"
        style="fill: {slice.color}"
      />
    {/each}
  </g>

  <!-- Layer 3: Icon well — a backing disc so the glyph reads on any cake color or none -->
  <circle class="topology-node__icon-well" r={iconWellRadius} />

  <!-- Layer 4 (innermost): Device icon. 
       FIXED: Inject only the <path> elements (stripped outer <svg> wrapper) into a <g>
       with a scale transform. The Flaticon SVGs are assumed to be 24x24 units. -->
  <g
    class="topology-node__icon"
    transform="translate({-iconSize / 2}, {-iconSize / 2}) scale({iconSize / 24})"
    aria-hidden="true"
  >
    {@html iconContent()}
  </g>
</g>

<style>
  @layer components {
    .topology-node {
      cursor: pointer;
      outline: none;
    }
    .topology-node:focus-visible .topology-node__stress-arc {
      stroke-width: 3px;
    }
    .topology-node__stress-arc {
      fill: none;
      stroke-width: 2px;
      stroke-linecap: round;
      transition: stroke 0.3s ease;
    }
    .topology-node__cake {
      opacity: 0.8;
    }
    .topology-node__cake-slice {
      stroke: var(--bg);
      stroke-width: 0.5px;
    }
    .topology-node__icon-well {
      fill: var(--bg);
    }
    .topology-node__icon {
      color: var(--text);
      pointer-events: none;
    }
    /* FIXED: Apply fill to all descendant paths/elements, crushing any inline fill attributes */
    .topology-node__icon :global(svg),
    .topology-node__icon :global(path),
    .topology-node__icon :global(circle),
    .topology-node__icon :global(rect),
    .topology-node__icon :global(polygon) {
      fill: currentColor;
    }
  }
</style>