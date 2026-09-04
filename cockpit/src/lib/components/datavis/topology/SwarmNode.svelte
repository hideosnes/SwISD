<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/SwarmNode.svelte
2. Description: Renders a trusted swarm peer as a layered interactive SVG node — stress arc, modality cake, and a viewBox-corrected device icon cropped by a green cover ring.
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

  // ════════════════════════════════════════════════════════════════
  //  ICON TUNING HANDLES — turn these dials, save, refresh /design
  // ════════════════════════════════════════════════════════════════
  // Side length of the icon's bounding box, as a fraction of nodeRadius.
  const ICON_BOX_RATIO = 1.2;

  // Radius of the backing well disc, as a fraction of nodeRadius.
  const ICON_WELL_RATIO = 0.9;

  // Radius of the GREEN CROP LINE, as a fraction of the well radius.
  // Lower = tighter crop + thicker green band.
  const ICON_CLIP_RATIO = 0.75;

  // Uniform multiplier on ALL icon geometry. 1.0 = mathematically correct.
  const ICON_GLOBAL_SCALE = 1.0;

  // ── THE WINDOWS DIAL ────────────────────────────────────────────
  // PER-DEVICE icon size multipliers — "name the size, case by case."
  // Optical correction for square logos: Windows' 2x2 grid needs to be
  // drawn smaller than round logos to look balanced in the circle.
  // Start at 0.75; dial between 0.7 and 0.8 until it sits right.
  const ICON_SIZE_BY_DEVICE: Partial<Record<DeviceType, number>> = {
    windows: 0.75,
  };
  // ════════════════════════════════════════════════════════════════

  interface IconViewBox {
    readonly minX: number;
    readonly minY: number;
    readonly width: number;
    readonly height: number;
  }

  const FALLBACK_VIEWBOX: IconViewBox = { minX: 0, minY: 0, width: 24, height: 24 };

  function parseViewBox(svgString: string): IconViewBox {
    const match = /viewBox\s*=\s*["']\s*([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)\s*["']/.exec(svgString);
    if (!match) return FALLBACK_VIEWBOX;
    const minX = Number(match[1]);
    const minY = Number(match[2]);
    const width = Number(match[3]);
    const height = Number(match[4]);
    if (![minX, minY, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
      return FALLBACK_VIEWBOX;
    }
    return { minX, minY, width, height };
  }

  function stripSvgShell(svgString: string): string {
    return svgString
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '');
  }

  function buildCropRingPath(innerRadius: number, outerRadius: number): string {
    // Two concentric full circles in one path. With fill-rule="evenodd" the
    // band between them fills; the center stays hollow so the icon shows.
    const circle = (r: number): string =>
      `M ${-r} 0 ` +
      `a ${r} ${r} 0 1 0 ${r * 2} 0 ` +
      `a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
    return `${circle(outerRadius)} ${circle(innerRadius)}`;
  }

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

  // Per-device size override, falling back to the global multiplier.
  const deviceSizeMultiplier = $derived(ICON_SIZE_BY_DEVICE[peer.peer.deviceType] ?? 1.0);

  const iconBox = $derived(peer.nodeRadius * ICON_BOX_RATIO * ICON_GLOBAL_SCALE * deviceSizeMultiplier);
  const iconWellRadius = $derived(peer.nodeRadius * ICON_WELL_RATIO * ICON_GLOBAL_SCALE);
  const iconClipRadius = $derived(iconWellRadius * ICON_CLIP_RATIO);

  // Green COVER RING — thickness halved, anchored at the crop line.
  const cropRingOuter = $derived(iconClipRadius + (iconWellRadius - iconClipRadius) / 2);
  const cropRingPath = $derived(buildCropRingPath(iconClipRadius, cropRingOuter));

  const iconGeometry = $derived.by(() => {
    const vb = parseViewBox(deviceIcon);
    const scale = iconBox / Math.max(vb.width, vb.height);
    const centerX = vb.minX + vb.width / 2;
    const centerY = vb.minY + vb.height / 2;
    return {
      transform: `scale(${scale}) translate(${-centerX}, ${-centerY})`,
      body: stripSvgShell(deviceIcon),
    };
  });

  const modalitySlices = $derived(() => {
    const modalities = peer.peer.modalities;
    if (modalities.length === 0) return [];
    const sliceAngle = (Math.PI * 2) / modalities.length;
    return modalities.map((mod, i) => ({
      modality: mod,
      color: modalityToColor(mod, i),
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

  <!-- Layer 3: Icon well — backing disc -->
  <circle class="topology-node__icon-well" r={iconWellRadius} />

  <!-- Layer 4: Device icon -->
  <g
    class="topology-node__icon"
    transform={iconGeometry.transform}
    aria-hidden="true"
  >
    {@html iconGeometry.body}
  </g>

  <!-- Layer 5 (topmost): Green COVER RING — crops the icon -->
  <path
    class="topology-node__icon-clip"
    d={cropRingPath}
    fill-rule="evenodd"
  />
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
      opacity: 0.9;
    }
    .topology-node__cake-slice {
      stroke: var(--bg);
      stroke-width: 0.5px;
    }
    .topology-node__icon-well {
      fill: var(--bg);
    }
    /* Solid #00ff00 crop band — explicit operator override, not themed. */
    .topology-node__icon-clip {
      fill: #00ff00;
      pointer-events: none;
    }
    .topology-node__icon {
      color: var(--text);
      pointer-events: none;
    }
    .topology-node__icon :global(svg),
    .topology-node__icon :global(path),
    .topology-node__icon :global(circle),
    .topology-node__icon :global(rect),
    .topology-node__icon :global(polygon) {
      fill: currentColor;
    }
  }
</style>