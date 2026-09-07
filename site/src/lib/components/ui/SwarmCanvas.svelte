<!--
1. Relative path: site/src/lib/components/ui/SwarmCanvas.svelte
2. Description: Decorative swarm-topology canvas with territorial clusters and a diplomat mesh.
3. Expects: CSS custom properties (--lime, --purple) resolvable on :root at runtime.
4. Provides: Ambient parallax node-field; clusters as spread territories (core + halo), dense intra-cluster edges, guaranteed + distance-based diplomat bridges, routing pulses.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  type Cluster = { x: number; y: number; r: number };
  type Node = { x: number; y: number; vx: number; vy: number; layer: number; cluster: number; hx: number; hy: number };
  type Edge = { a: number; b: number; cx: number; cy: number; alpha: number; layer: number; diplomat: boolean };
  type Pulse = { a: number; b: number; t: number; speed: number; diplomat: boolean };

  // Five territories covering the canvas; radii are fractions of the min dimension.
  const CLUSTER_DEFS = [
    { x: 0.16, y: 0.26, r: 0.30 },
    { x: 0.80, y: 0.20, r: 0.28 },
    { x: 0.50, y: 0.80, r: 0.30 },
    { x: 0.86, y: 0.70, r: 0.26 },
    { x: 0.12, y: 0.74, r: 0.26 }
  ];

  // Radial bands per parallax layer: far = halo, near = bright core.
  const LAYER_BANDS: Array<[number, number]> = [
    [0.70, 1.0],
    [0.40, 0.75],
    [0.10, 0.45]
  ];

  const LAYERS = [
    { depth: 0.35, speed: 0.10, radius: 1.1, link: 100, alpha: 0.30, width: 0.6 },
    { depth: 0.65, speed: 0.16, radius: 1.7, link: 135, alpha: 0.50, width: 0.8 },
    { depth: 1.0, speed: 0.24, radius: 2.3, link: 170, alpha: 0.75, width: 1.0 }
  ];

  const FRAME_MS = 33;
  const MAX_DPR = 1.5;
  const DIPLOMAT_LINK = 240; // Distance threshold for extra cross-swarm edges
  const MAX_EXTRA_DIPLOMATS = 16;
  const BRIDGE_REFRESH = 45; // Frames between guaranteed-bridge recomputes

  let canvas: HTMLCanvasElement | undefined = $state();

  onMount(() => {
    const el = canvas;
    const maybeCtx = el ? el.getContext('2d') : null;
    if (!el || !maybeCtx) return;

    const surface: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    // ---- Token discipline ----
    const parseHex = (input: string, fallback: { r: number; g: number; b: number }): { r: number; g: number; b: number } => {
      const raw = input.trim().replace(/^#/, '');
      if (raw.length === 3) {
        return {
          r: parseInt(raw[0] + raw[0], 16),
          g: parseInt(raw[1] + raw[1], 16),
          b: parseInt(raw[2] + raw[2], 16)
        };
      }
      if (raw.length === 6) {
        const r = parseInt(raw.slice(0, 2), 16);
        const g = parseInt(raw.slice(2, 4), 16);
        const b = parseInt(raw.slice(4, 6), 16);
        if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) return { r, g, b };
      }
      return fallback;
    };

    const rootStyle = getComputedStyle(document.documentElement);
    const LIME = parseHex(rootStyle.getPropertyValue('--lime'), { r: 84, g: 255, b: 126 });
    const PURPLE = parseHex(rootStyle.getPropertyValue('--purple'), { r: 94, g: 23, b: 235 });
    const limeCss = `rgb(${LIME.r}, ${LIME.g}, ${LIME.b})`;
    const purpleCss = `rgb(${PURPLE.r}, ${PURPLE.g}, ${PURPLE.b})`;

    // ---- State ----
    let width = 0;
    let height = 0;
    let clusters: Cluster[] = [];
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let pulses: Pulse[] = [];
    let bridgePairs: Array<{ a: number; b: number }> = [];
    let tick = 0;
    let rafId = 0;
    let last = 0;
    let running = false;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---- Center-sparse distribution (readability) ----
    const inSafeZone = (x: number, y: number): boolean => {
      const dx = (x - width / 2) / (width * 0.30);
      const dy = (y - height * 0.52) / (height * 0.30);
      return dx * dx + dy * dy < 1;
    };

    function initClusters(): void {
      const base = Math.min(width, height);
      clusters = CLUSTER_DEFS.map((def) => ({
        x: def.x * width,
        y: def.y * height,
        r: def.r * base
      }));
    }

    function nearestCluster(x: number, y: number): number {
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < clusters.length; i++) {
        const dx = clusters[i].x - x;
        const dy = clusters[i].y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          best = i;
        }
      }
      return best;
    }

    function sampleOffset(c: Cluster, layer: number): [number, number] {
      const [lo, hi] = LAYER_BANDS[layer];
      const band = lo + Math.random() * (hi - lo);
      const ang = Math.random() * Math.PI * 2;
      const dist = band * c.r;
      return [Math.cos(ang) * dist, Math.sin(ang) * dist * 0.9];
    }

    function spawnNode(): Node {
      const roll = Math.random();
      const layer = roll < 0.45 ? 0 : roll < 0.8 ? 1 : 2;
      for (let attempt = 0; attempt < 10; attempt++) {
        const ci = Math.floor(Math.random() * clusters.length);
        const [ox, oy] = sampleOffset(clusters[ci], layer);
        const x = clusters[ci].x + ox;
        const y = clusters[ci].y + oy;
        if (x < 0 || x > width || y < 0 || y > height || inSafeZone(x, y)) continue;
        const speed = LAYERS[layer].speed * (0.5 + Math.random() * 0.5);
        const dir = Math.random() * Math.PI * 2;
        return { x, y, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, layer, cluster: ci, hx: ox, hy: oy };
      }
      // Fallback: ring outside the safe zone
      const angle = Math.random() * Math.PI * 2;
      const x = Math.min(Math.max(width / 2 + Math.cos(angle) * width * 0.42, 0), width);
      const y = Math.min(Math.max(height * 0.52 + Math.sin(angle) * height * 0.42, 0), height);
      const ci = nearestCluster(x, y);
      const speed = LAYERS[layer].speed * (0.5 + Math.random() * 0.5);
      const dir = Math.random() * Math.PI * 2;
      return { x, y, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, layer, cluster: ci, hx: x - clusters[ci].x, hy: y - clusters[ci].y };
    }

    function seed(): void {
      initClusters();
      const count = Math.min(Math.floor((width * height) / 8000), 190);
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push(spawnNode());
      }
      pulses = [];
      bridgePairs = [];
      buildEdges();
      const pulseCount = Math.min(22, edges.length);
      for (let i = 0; i < pulseCount; i++) spawnPulse();
    }

    function controlFor(ax: number, ay: number, bx: number, by: number, key: number): [number, number] {
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const dx = bx - ax;
      const dy = by - ay;
      const d = Math.hypot(dx, dy) || 1;
      const off = d * 0.18 * (key % 2 === 0 ? 1 : -1);
      return [mx - (dy / d) * off, my + (dx / d) * off];
    }

    function buildEdges(): void {
      edges = [];

      // Intra-cluster edges (dense local swarm communication)
      for (let layer = 0; layer < LAYERS.length; layer++) {
        const link = LAYERS[layer].link;
        const link2 = link * link;
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          if (a.layer !== layer) continue;
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            if (b.layer !== layer || a.cluster !== b.cluster) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > link2) continue;
            const [cx, cy] = controlFor(a.x, a.y, b.x, b.y, i + j);
            edges.push({
              a: i,
              b: j,
              cx,
              cy,
              alpha: (1 - Math.sqrt(d2) / link) * LAYERS[layer].alpha,
              layer,
              diplomat: false
            });
          }
        }
      }

      // Guaranteed bridges: one closest-pair diplomat per cluster pair (refreshed periodically)
      if (tick % BRIDGE_REFRESH === 0) {
        bridgePairs = [];
        for (let c1 = 0; c1 < clusters.length; c1++) {
          for (let c2 = c1 + 1; c2 < clusters.length; c2++) {
            let bi = -1;
            let bj = -1;
            let bd = Number.POSITIVE_INFINITY;
            for (let i = 0; i < nodes.length; i++) {
              if (nodes[i].cluster !== c1) continue;
              for (let j = 0; j < nodes.length; j++) {
                if (nodes[j].cluster !== c2) continue;
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < bd) {
                  bd = d2;
                  bi = i;
                  bj = j;
                }
              }
            }
            if (bi >= 0) bridgePairs.push({ a: bi, b: bj });
          }
        }
      }
      for (const bp of bridgePairs) {
        const a = nodes[bp.a];
        const b = nodes[bp.b];
        const layer = Math.max(a.layer, b.layer);
        const [cx, cy] = controlFor(a.x, a.y, b.x, b.y, bp.a + bp.b);
        edges.push({ a: bp.a, b: bp.b, cx, cy, alpha: 0.40, layer, diplomat: true });
      }

      // Distance-based extra diplomats (cross-swarm chatter where territories meet)
      const link2 = DIPLOMAT_LINK * DIPLOMAT_LINK;
      let extras = 0;
      for (let i = 0; i < nodes.length && extras < MAX_EXTRA_DIPLOMATS; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          if (a.cluster === b.cluster) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > link2) continue;
          const layer = Math.max(a.layer, b.layer);
          const [cx, cy] = controlFor(a.x, a.y, b.x, b.y, i + j);
          edges.push({
            a: i,
            b: j,
            cx,
            cy,
            alpha: (1 - Math.sqrt(d2) / DIPLOMAT_LINK) * 0.5,
            layer,
            diplomat: true
          });
          extras++;
        }
      }
    }

    function spawnPulse(): void {
      if (edges.length === 0) return;
      const isDiplomat = Math.random() < 0.35;
      const candidateEdges = edges.filter((e) => e.diplomat === isDiplomat);
      const pool = candidateEdges.length > 0 ? candidateEdges : edges;
      const e = pool[Math.floor(Math.random() * pool.length)];
      pulses.push({ a: e.a, b: e.b, t: Math.random(), speed: 0.006 + Math.random() * 0.008, diplomat: e.diplomat });
    }

    function step(dt: number): void {
      tick++;
      const cx = width / 2;
      const cy = height * 0.52;

      for (const n of nodes) {
        // Soft repulsion from center (headline clarity)
        if (inSafeZone(n.x, n.y)) {
          const dx = n.x - cx;
          const dy = n.y - cy;
          const d = Math.hypot(dx, dy) || 1;
          n.vx += (dx / d) * 0.004 * LAYERS[n.layer].depth * dt;
          n.vy += (dy / d) * 0.004 * LAYERS[n.layer].depth * dt;
        }

        // Gravity toward the node's HOME POINT inside its territory (spread, not collapse)
        const c = clusters[n.cluster];
        const tx = c.x + n.hx;
        const ty = c.y + n.hy;
        const cdx = tx - n.x;
        const cdy = ty - n.y;
        const cdist = Math.hypot(cdx, cdy);
        if (cdist > 24) {
          const pull = 0.006 * LAYERS[n.layer].depth * dt;
          n.vx += (cdx / cdist) * pull;
          n.vy += (cdy / cdist) * pull;
        }

        // Clamp to ambient-slow layer speed
        const max = LAYERS[n.layer].speed;
        const v = Math.hypot(n.vx, n.vy);
        if (v > max) {
          n.vx = (n.vx / v) * max;
          n.vy = (n.vy / v) * max;
        }

        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.x = Math.min(Math.max(n.x, 0), width);
        n.y = Math.min(Math.max(n.y, 0), height);

        // Occasional migration: re-home into a different territory
        if (Math.random() < 0.0004) {
          const next = (n.cluster + 1 + Math.floor(Math.random() * (clusters.length - 1))) % clusters.length;
          n.cluster = next;
          const [ox, oy] = sampleOffset(clusters[next], n.layer);
          n.hx = ox;
          n.hy = oy;
        }
      }

      buildEdges();

      for (const p of pulses) {
        p.t += p.speed * dt;
        const a = nodes[p.a];
        const b = nodes[p.b];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (p.t >= 1 || dx * dx + dy * dy > 320 * 320) {
          p.t = 0;
          if (edges.length > 0) {
            const isDiplomat = Math.random() < 0.35;
            const candidateEdges = edges.filter((e) => e.diplomat === isDiplomat);
            const pool = candidateEdges.length > 0 ? candidateEdges : edges;
            const e = pool[Math.floor(Math.random() * pool.length)];
            p.a = e.a;
            p.b = e.b;
            p.diplomat = e.diplomat;
          }
        }
      }
    }

    function bezier(px: number, py: number, cx: number, cy: number, qx: number, qy: number, t: number): [number, number] {
      const u = 1 - t;
      return [u * u * px + 2 * u * t * cx + t * t * qx, u * u * py + 2 * u * t * cy + t * t * qy];
    }

    function draw(): void {
      ctx.clearRect(0, 0, width, height);

      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        ctx.strokeStyle = e.diplomat ? limeCss : purpleCss;
        ctx.globalAlpha = e.alpha * (e.diplomat ? 0.8 : 1.0);
        ctx.lineWidth = LAYERS[e.layer].width * (e.diplomat ? 1.3 : 1.0);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(e.cx, e.cy, b.x, b.y);
        ctx.stroke();
      }

      ctx.fillStyle = limeCss;
      for (const n of nodes) {
        ctx.globalAlpha = LAYERS[n.layer].alpha;
        ctx.beginPath();
        ctx.arc(n.x, n.y, LAYERS[n.layer].radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = limeCss;
      for (const p of pulses) {
        const a = nodes[p.a];
        const b = nodes[p.b];
        const [cx, cy] = controlFor(a.x, a.y, b.x, b.y, p.a + p.b);
        const [x, y] = bezier(a.x, a.y, cx, cy, b.x, b.y, p.t);
        ctx.globalAlpha = p.diplomat ? 1.0 : 0.9;
        ctx.beginPath();
        ctx.arc(x, y, p.diplomat ? 2.2 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function frame(now: number): void {
      rafId = requestAnimationFrame(frame);
      const elapsed = now - last;
      if (elapsed < FRAME_MS) return;
      last = now - (elapsed % FRAME_MS);
      step(Math.min(elapsed, 100) / 16.7);
      draw();
    }

    function start(): void {
      if (running || reduced.matches) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stop(): void {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function resize(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = surface.clientWidth;
      height = surface.clientHeight;
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced.matches) draw();
    }

    const onReducedChange = (): void => {
      if (reduced.matches) {
        stop();
        draw();
      } else {
        start();
      }
    };
    reduced.addEventListener('change', onReducedChange);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0 }
    );
    io.observe(surface);

    window.addEventListener('resize', resize);

    resize();
    if (!reduced.matches) start();
    else draw();

    return () => {
      stop();
      io.disconnect();
      reduced.removeEventListener('change', onReducedChange);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas bind:this={canvas} class="swarm-canvas" aria-hidden="true"></canvas>

<style>
  .swarm-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    pointer-events: none;
  }
</style>