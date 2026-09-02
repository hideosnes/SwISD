<!--
1. Relative path: cockpit/src/lib/components/datavis/topology/TopologyAnatomyBench.svelte
2. Description: Diagnostic isolation bench for the /design route. Renders every topology node element individually to isolate visual defects.
3. Expects: Nothing. Builds its own deterministic fixtures.
4. Provides: A labeled grid of isolated node specimens for visual defect triage.
-->
<script lang="ts">
  import SwarmNode from './SwarmNode.svelte';
  import GhostNode from './GhostNode.svelte';
  import type { LaidOutPeer, DeviceType, OrbitalRingKind } from '../types.js';
  import type { TopologyPeerDTO } from '$lib/server/topology.js';

  import raspiIcon from '$lib/assets/icons/device-raspi.svg?raw';
  import arduinoIcon from '$lib/assets/icons/device-arduino.svg?raw';
  import androidIcon from '$lib/assets/icons/device-android.svg?raw';
  import iosIcon from '$lib/assets/icons/device-ios.svg?raw';
  import windowsIcon from '$lib/assets/icons/device-windows.svg?raw';
  import linuxIcon from '$lib/assets/icons/device-linux.svg?raw';
  import appleIcon from '$lib/assets/icons/device-apple.svg?raw';
  import unknownIcon from '$lib/assets/icons/device-unknown.svg?raw';

  const SPECIMEN = 120;

  const rawIcons: ReadonlyArray<{ deviceType: DeviceType; svg: string }> = [
    { deviceType: 'raspi', svg: raspiIcon },
    { deviceType: 'arduino', svg: arduinoIcon },
    { deviceType: 'android', svg: androidIcon },
    { deviceType: 'ios', svg: iosIcon },
    { deviceType: 'windows', svg: windowsIcon },
    { deviceType: 'linux', svg: linuxIcon },
    { deviceType: 'apple', svg: appleIcon },
    { deviceType: 'unknown', svg: unknownIcon },
  ];

  function makePeer(overrides: Partial<TopologyPeerDTO>): TopologyPeerDTO {
    return {
      peerId: `0x${'0'.repeat(64)}`,
      trustState: 'trusted',
      discoveredAt: 0,
      lastSeenAt: null,
      source: 'replay',
      capabilities: [],
      loadScore: null,
      activeTaskCount: null,
      deviceType: 'unknown',
      modalities: [],
      ...overrides,
    };
  }

  function layOut(
    peer: TopologyPeerDTO,
    nodeRadius: number,
    ring: OrbitalRingKind = 'trust',
  ): LaidOutPeer {
    return {
      peer,
      ring,
      angleRad: 0,
      position: { x: SPECIMEN / 2, y: SPECIMEN / 2 },
      nodeRadius,
    };
  }

  const iconNodes = rawIcons.map((r) => ({
    deviceType: r.deviceType,
    laidOut: layOut(makePeer({ deviceType: r.deviceType }), 44),
  }));

  const cakeNode = layOut(makePeer({ deviceType: 'raspi', modalities: ['T2T', 'T2I', 'I2T'] }), 44);
  const stressNode = layOut(makePeer({ deviceType: 'raspi', loadScore: 0.9 }), 44);
  const fullNode = layOut(makePeer({ deviceType: 'raspi', modalities: ['T2T', 'T2I'], loadScore: 0.7 }), 44);
  const ghostNode = layOut(makePeer({ trustState: 'pending' }), 44, 'limbo');
</script>

<section class="anatomy-bench" aria-label="Topology node anatomy bench">
  <div>
    <h3 class="anatomy-title">1 · Raw icon assets (bare <code>&#123;@html&#125;</code>)</h3>
    <div class="anatomy-grid">
      {#each rawIcons as item (item.deviceType)}
        <figure class="anatomy-cell">
          <div class="raw-icon">{@html item.svg}</div>
          <figcaption>{item.deviceType}</figcaption>
        </figure>
      {/each}
    </div>
  </div>

  <div>
    <h3 class="anatomy-title">2 · Node layers via real components</h3>
    <div class="anatomy-grid">
      {#each iconNodes as node (node.deviceType)}
        <figure class="anatomy-cell">
          <!-- FIXED: Removed aria-hidden="true" to prevent focus trap violations on tabindex="0" descendants -->
          <svg viewBox="0 0 {SPECIMEN} {SPECIMEN}" class="anatomy-svg">
            <SwarmNode peer={node.laidOut} />
          </svg>
          <figcaption>icon · {node.deviceType}</figcaption>
        </figure>
      {/each}

      <figure class="anatomy-cell">
        <svg viewBox="0 0 {SPECIMEN} {SPECIMEN}" class="anatomy-svg">
          <SwarmNode peer={cakeNode} />
        </svg>
        <figcaption>cake + icon</figcaption>
      </figure>

      <figure class="anatomy-cell">
        <svg viewBox="0 0 {SPECIMEN} {SPECIMEN}" class="anatomy-svg">
          <SwarmNode peer={stressNode} />
        </svg>
        <figcaption>stress + icon</figcaption>
      </figure>

      <figure class="anatomy-cell">
        <svg viewBox="0 0 {SPECIMEN} {SPECIMEN}" class="anatomy-svg">
          <SwarmNode peer={fullNode} />
        </svg>
        <figcaption>full node</figcaption>
      </figure>

      <figure class="anatomy-cell">
        <svg viewBox="0 0 {SPECIMEN} {SPECIMEN}" class="anatomy-svg">
          <GhostNode peer={ghostNode} />
        </svg>
        <figcaption>ghost</figcaption>
      </figure>
    </div>
  </div>
</section>

<style>
  @layer components {
    .anatomy-bench {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      font-family: var(--font-mono, monospace);
    }
    .anatomy-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .anatomy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: 0.5rem;
    }
    .anatomy-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .anatomy-cell figcaption {
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      text-align: center;
    }
    .anatomy-svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .raw-icon {
      width: 64px;
      height: 64px;
      color: var(--text);
    }
    .raw-icon :global(svg) {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  }
</style>