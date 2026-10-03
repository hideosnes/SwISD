<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/SwarmNode.svelte
2. Description: Renders a trusted swarm peer as a layered interactive SVG node — stress arc, modality cake, device icon, friendly hostname label, and a CCW ping liveness ring.
3. Expects: A LaidOutPeer model with position, radius, device type, modalities, load score, hostname, and presence state.
4. Provides: A clickable, accessible SVG group with device icon, modality cake, stress arc, ping ring, and text label.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->
<script lang="ts">
  import type { LaidOutPeer, DeviceType, ModalityCode } from '../types.js';
  import { modalityToColor, loadToStressColor, stressArcPath } from './layout.js';
  import { peerOverrideStore } from '$lib/peerOverrides.svelte.js';

  import raspiIcon from '$lib/assets/icons/device-raspi.svg?raw';
  import arduinoIcon from '$lib/assets/icons/device-arduino.svg?raw';
  import androidIcon from '$lib/assets/icons/device-android.svg?raw';
  import iosIcon from '$lib/assets/icons/device-ios.svg?raw';
  import windowsIcon from '$lib/assets/icons/device-windows.svg?raw';
  import linuxIcon from '$lib/assets/icons/device-linux.svg?raw';
  import appleIcon from '$lib/assets/icons/device-apple.svg?raw';
  import unknownIcon from '$lib/assets/icons/device-unknown.svg?raw';

  const ICON_BOX_RATIO = 1.2;
  const ICON_WELL_RATIO = 0.9;
  const ICON_CLIP_RATIO = 0.75;
  const ICON_GLOBAL_SCALE = 1.0;

  const ICON_SIZE_BY_DEVICE: Partial<Record<DeviceType, number>> = {
    windows: 0.75,
  };

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
    const circle = (r: number): string =>
      `M ${-r} 0 ` +
      `a ${r} ${r} 0 1 0 ${r * 2} 0 ` +
      `a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
    return `${circle(outerRadius)} ${circle(innerRadius)}`;
  }

  function pingArcPath(cx: number, cy: number, radius: number, progress: number): string {
    if (progress <= 0.01) return '';
    if (progress >= 0.99) {
      return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius}`;
    }
    const startAngle = Math.PI / 2; // 6 o'clock
    const endAngle = startAngle - (progress * 2 * Math.PI); // Counter-clockwise
    
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    
    const largeArc = progress > 0.5 ? 1 : 0;
    // sweep-flag = 0 for counter-clockwise
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
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

  // Apply operator overrides
  const override = $derived(peerOverrideStore.getOverride(peer.peer.peerId));
  const displayName = $derived(override?.name ?? (peer.peer.hostname && peer.peer.hostname !== 'unknown' ? peer.peer.hostname : peer.peer.peerId.slice(0, 12)));
  const displayIconType = $derived(override?.icon ?? peer.peer.deviceType);
  const subId = $derived(override?.name && peer.peer.hostname !== 'unknown' ? peer.peer.peerId.slice(0, 8) + '...' : '');

  const isOffline = $derived(peer.peer.presence === 'offline');
  const label = $derived(`${displayName}${isOffline ? ' (offline)' : ''} - Load: ${peer.peer.loadScore ?? 'Unknown'}`);

  const deviceIcon = $derived(deviceIconMap[displayIconType]);
  const deviceSizeMultiplier = $derived(ICON_SIZE_BY_DEVICE[displayIconType] ?? 1.0);

  const iconBox = $derived(peer.nodeRadius * ICON_BOX_RATIO * ICON_GLOBAL_SCALE * deviceSizeMultiplier);
  const iconWellRadius = $derived(peer.nodeRadius * ICON_WELL_RATIO * ICON_GLOBAL_SCALE);
  const iconClipRadius = $derived(iconWellRadius * ICON_CLIP_RATIO);

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

  // Ping ring logic: 60 seconds full circle, shrinks CCW from 6 o'clock
  const now = $derived(Date.now());
  const lastSeen = $derived(peer.peer.lastSeenAt ?? peer.peer.discoveredAt);
  const ageMs = $derived(now - lastSeen);
  const pingProgress = $derived(Math.max(0, 1 - (ageMs / 60000))); // 60s threshold
  const pingRadius = $derived(peer.nodeRadius + 4);
  const pingPath = $derived(pingArcPath(0, 0, pingRadius, pingProgress));
</script>

<g
  transform="translate({peer.position.x}, {peer.position.y})"
  class="topology-node"
  class:topology-node--offline={isOffline}
  role="button"
  tabindex="0"
  aria-label={label}
  {onclick}
  {onkeydown}
>
  <!-- Layer 0: Ping Liveness Ring (Counter-clockwise from 6 o'clock) -->
  {#if pingPath}
    <path d={pingPath} class="topology-node__ping-ring" style="opacity: {pingProgress}" />
  {/if}

  {#if stressPath}
    <path d={stressPath} class="topology-node__stress-arc" style="stroke: {stressColor}" />
  {/if}

  <g class="topology-node__cake">
    {#each modalitySlices() as slice}
      <path
        d={modalitySlicePath(0, 0, peer.nodeRadius, slice.startAngle, slice.endAngle)}
        class="topology-node__cake-slice"
        style="_fill: {slice.color}"
      />
    {/each}
  </g>

  <circle class="topology-node__icon-well" r={iconWellRadius} />

  <g
    class="topology-node__icon"
    transform={iconGeometry.transform}
    aria-hidden="true"
  >
    {@html iconGeometry.body}
  </g>

  <path
    class="topology-node__icon-clip"
    d={cropRingPath}
    fill-rule="evenodd"
  />

  <text 
    y={peer.nodeRadius + 14} 
    text-anchor="middle" 
    class="topology-node__label-primary"
    aria-hidden="true"
  >
    {displayName}
  </text>
  {#if subId}
    <text 
      y={peer.nodeRadius + 26} 
      text-anchor="middle" 
      class="topology-node__label-secondary"
      aria-hidden="true"
    >
      {subId}
    </text>
  {/if}
</g>

<style>
  @layer components {
    .topology-node {
      cursor: pointer;
      outline: none;
      transition: opacity 0.3s ease, filter 0.3s ease;
    }
    .topology-node:focus-visible .topology-node__stress-arc,
    .topology-node:focus-visible .topology-node__ping-ring {
      stroke-width: 3px;
    }
    .topology-node--offline {
      opacity: 0.4;
      filter: grayscale(80%);
    }
    .topology-node__ping-ring {
      fill: none;
      stroke: var(--live);
      stroke-width: 2px;
      stroke-linecap: round;
      transition: opacity 0.5s ease;
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
    .topology-node__label-primary {
      fill: var(--text-1);
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-ui);
      pointer-events: none;
      user-select: none;
    }
    .topology-node__label-secondary {
      fill: var(--text-3);
      font-size: 9px;
      font-family: var(--font-mono);
      pointer-events: none;
      user-select: none;
    }
  }
</style>