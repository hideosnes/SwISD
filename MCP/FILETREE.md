# FILETREE.md — SwISD Structural Map

> **Canonical source of truth for all SwISD file paths, roles, and expectations.**
> Every file in the repo MUST carry a header comment block stating its own
> path, description, expectations, and provisions (see GUIDE.md Section 6).
> This document is the map; the headers are the territory.
> When they disagree, THIS document wins and the code must be corrected.

---

## Monorepo Architecture

SwISD is a **monorepo** with strict build-boundary separation:

- **`src/`** — Headless core engine. Pure Node.js, zero UI dependencies. Builds to `dist/`. Published as the canonical npm library.
- **`cockpit/`** — Conductor Cockpit. SvelteKit BFF + SPA dashboard. Imports the core via `$core` alias. Builds to `cockpit/dist/`.
- **`site/`** — SwISD marketing / documentation site. Static SvelteKit. Zero imports from `src/` or `cockpit/`.
- **`supervisor/`** — Pinned OTA supervisor. Zero application logic, zero network access.

The root `tsconfig.json` is locked to `src/` only. Each application (`cockpit/`, `site/`) maintains its own `tsconfig.json`, `svelte.config.js`, and `vite.config.ts` with appropriate path aliases. The core is never polluted by application-specific build tooling.

---

## Canonical File Map

### `src/` — Core Engine (headless, pure Node.js)

```
src/
├── index.ts                     # Main entry point. Starts observation plane, admin server, mDNS discovery.
├── types.ts                     # Shared core domain types: PeerRole, LoadScore, TaskState, etc.
├── utils.ts                     # Shared utility helpers: port parsing, token generation, etc.
├── errors.ts                    # Centralized error texts and SwISDError hierarchy.
│
├── admin/                       # Headless legacy admin dashboard (JSON + HTML served from core).
│   ├── index.ts                 # Barrel export for admin modules.
│   ├── server.ts                # Token-guarded HTTP admin server with CORS policy.
│   ├── html.ts                  # Self-contained legacy dashboard HTML shell.
│   └── styles.css               # Legacy admin CSS (dark theme, monospace).
│
├── network/                     # Node-to-node communication layer.
│   ├── index.ts                 # Barrel export for network modules.
│   ├── discovery.ts             # mDNS/Bonjour service advertisement and listener.
│   └── libp2p.ts                # libp2p node construction, protocol registry, and transport wiring.
│
├── peer/                        # Peer trust management.
│   ├── index.ts                 # Barrel export for peer modules.
│   └── trust.ts                 # TrustRegistry: pending/trusted/rejected state machine + public key registry.
│
├── tasks/                       # Task lifecycle, preemption, and capability negotiation.
│   ├── index.ts                 # Barrel export for task modules.
│   ├── capabilities.ts          # ExecutorSignature branded type, capability probing, and negotiation.
│   ├── fragmentation.ts         # Task fragmentation and reassembly logic.
│   └── lifecycle.ts             # TaskState transitions, preemption, and retry policies.
│
├── crdt/                        # CRDT engine and domain CRDT definitions.
│   ├── index.ts                 # Barrel export for CRDT modules.
│   ├── engine.ts                # CausalClock, CrdtEvent, CrdtEngine base class.
│   ├── membership.ts            # ObservedRemoveSet for peer membership.
│   ├── capabilities.ts          # GCounter/LWWRegistry for capability declarations.
│   ├── reputation.ts            # SlidingWindowAverage for peer reputation scoring.
│   ├── taskHistory.ts           # MultiValueRegister for task completion records.
│   └── vectorIndex.ts           # VectorClockMap for vector index synchronization.
│
├── gossip/                      # Gossip protocol for CRDT delta propagation.
│   ├── index.ts                 # Barrel export for gossip modules.
│   ├── codec.ts                 # Deterministic encode/decode for gossip payloads.
│   ├── engine.ts                # GossipEngine: peer selection, push/pull cycles, deduplication.
│   └── protocol.ts              # Protocol message types and wire format definitions.
│
├── observability/               # Telemetry, events, snapshots, and replay.
│   ├── index.ts                 # Barrel export for observability modules.
│   ├── eventBus.ts              # Bounded-ring event bus with cursor tracking.
│   ├── schema.ts                # Strict schema types: SwarmSnapshot, ObservabilitySource, DeviceType, ModalityCode.
│   ├── snapshot.ts              # buildSwarmSnapshot() — immutable snapshot builder.
│   ├── devSource.ts             # createDevObservabilitySource() — live source backed by real services.
│   ├── scenarioEngine.ts        # createScenarioEngine() — replay source driven by SCENARIOS fixtures.
│   ├── scenarios.ts             # SCENARIOS fixture library + Channel/Keyframe types.
│   └── replayStore.ts           # ReplayStore — bounded JSONL file-backed event ring with replay cursors.
│
├── delivery/                    # OTA delivery, versioning, and heartbeat.
│   ├── index.ts                 # Barrel export for delivery modules.
│   ├── installer.ts             # Install/extract/verify pipeline for OTA app packages.
│   ├── identity.ts              # IdentityManager — persistent peer identity surviving releases.
│   ├── supervisorContract.ts    # Supervisor status file schema and validation.
│   ├── heartbeat.ts             # HeartbeatWriter — periodic liveness file writer.
│   └── watchdog.ts              # Watchdog — health check and revert orchestration.
│
├── models/                      # Model distribution and approval pipeline.
│   ├── index.ts                 # Barrel export for model modules.
│   ├── registry.ts              # ModelRegistry — model metadata catalog and approval gate.
│   ├── approval.ts              # ApprovalGate — operator approval workflow for new models.
│   ├── downloader.ts            # ModelDownloader — HTTP/S3 model fetching with progress tracking.
│   └── manager.ts               # ModelManager — load/unload lifecycle and memory accounting.
│
├── ownership/                   # ⏳ planned — The Sovereignty Layer (keystone, bonding, succession)
│   ├── index.ts                 # Barrel export
│   ├── anchor.ts                # Worker-side bond anchor, whitelist cache & command verification
│   ├── keystone.ts              # Keystone role: ledger custody, enrollment, whitelist revisions, backup emission
│   ├── schema.ts                # OwnershipLedger, ConductorDevice, NodePolicy, succession event types
│   └── succession.ts            # Succession ceremony, revision monotonicity, recovery phrase fallback
│
└── crypto/                      # Cryptographic primitives (Ed25519, HMAC, SHA-256).
    ├── index.ts                 # Barrel export for crypto modules.
    ├── ed25519.ts               # Ed25519 key generation, signing, verification.
    ├── hmac.ts                  # HMAC-SHA256 keyed fragment integrity.
    └── sha256.ts                # SHA-256 hashing utilities.
```

### `cockpit/` — Conductor Cockpit (SvelteKit BFF + SPA)

```
cockpit/
├── package.json                 # Cockpit package manifest. Depends on ../../src via $core alias.
├── tsconfig.json                # TypeScript config. Extends root strictness. Adds $core and $lib aliases.
├── svelte.config.js             # SvelteKit config. Adapter-node for production builds.
├── vite.config.ts               # Vite config. $core alias resolution, dev server port.
├── src/
│   ├── app.html                 # SPA HTML shell. Meta tags, font preload, root div.
│   ├── app.d.ts                 # Global type declarations for App.Locals.
│   ├── hooks.server.ts          # SvelteKit server hooks. Initializes core services, injects into locals.
│   │
│   ├── lib/                     # Client-side shared library.
│   │   ├── index.ts             # Barrel export for lib modules.
│   │   ├── themes/              # Theme regime files.
│   │   │   ├── index.css        # Theme regime imports. Bundles all regime CSS.
│   │   │   ├── ghost.css        # Ghost regime: spectral, ethereal palette.
│   │   │   ├── ember.css        # Ember regime: warm, fire-inspired palette.
│   │   │   ├── void.css         # Void regime: dark, high-contrast palette.
│   │   │   ├── bloom.css        # Bloom regime: soft, floral palette.
│   │   │   ├── circuit.css      # Circuit regime: electric, tech-inspired palette.
│   │   │   └── aurora.css       # Aurora regime: northern lights palette.
│   │   │
│   │   ├── theme.ts             # Theme regime state store. Persists to localStorage.
│   │   │
│   │   ├── adapters/            # Domain-to-primitive adapter layer.
│   │   │   ├── index.ts         # Barrel export for adapters.
│   │   │   ├── trust.ts         # trustToStatus(): TrustState -> StatusPill vocabulary.
│   │   │   └── load.ts          # loadToStatus(): LoadScore -> StatusPill vocabulary.
│   │   │
│   │   ├── components/          # Feature components. Compose primitives, never raw HTML.
│   │   │   ├── DiscoveryPanel.svelte       # ⏳ planned — mDNS discovery UI panel
│   │   │   ├── SwarmSidebar.svelte         # ⏳ planned — Sidebar with peer list, event feed, topology summary
│   │   │   ├── CommandQueue.svelte         # ⏳ planned — Pending trust actions with approve/reject
│   │   │   ├── ReplayControlModal.svelte   # ⏳ planned — Scenario replay controls
│   │   │   ├── StageView.svelte            # ⏳ planned — Stage tab content: topology + task flow
│   │   │   ├── EngineRoomView.svelte       # ⏳ planned — Engine Room tab content: load, delivery, events
│   │   │   ├── KeystoneLossBanner.svelte   # ⏳ planned — Sovereignty Layer: keystone-loss observability banner
│   │   │   └── ui/                # Primitive component library. Single-source visual atoms.
│   │   │       ├── index.ts       # Barrel export for all UI primitives.
│   │   │       ├── Icon.svelte    # Icon primitive. SVG sprite-based, size variants.
│   │   │       ├── Badge.svelte   # Badge primitive. Count indicator, color variants.
│   │   │       ├── Button.svelte  # Button primitive. Variants: primary, secondary, ghost, danger.
│   │   │       ├── Card.svelte    # Card primitive. Surface container with title, body, footer slots.
│   │   │       ├── StatusPill.svelte # StatusPill primitive. live/idle/warn/error semantic colors.
│   │   │       ├── SwarmPulse.svelte # SwarmPulse primitive. Animated liveness indicator.
│   │   │       ├── ProgressRing.svelte # ProgressRing primitive. Circular progress indicator.
│   │   │       ├── ProgressBar.svelte # ProgressBar primitive. Linear progress indicator.
│   │   │       ├── Modal.svelte   # Modal primitive. Overlay dialog with backdrop.
│   │   │       ├── Drawer.svelte  # Drawer primitive. Slide-in panel.
│   │   │       ├── TextField.svelte # TextField primitive. Labeled input with validation.
│   │   │       ├── Stat.svelte    # Stat primitive. Key-value display with label.
│   │   │       ├── EmptyState.svelte # EmptyState primitive. Placeholder for empty data.
│   │   │       ├── PageShell.svelte # PageShell primitive. Layout wrapper with header/footer.
│   │   │       ├── Panel.svelte   # Panel primitive. Section container with title.
│   │   │       ├── ThemeToggle.svelte # ThemeToggle primitive. Regime switcher with preview.
│   │   │       ├── Tabs.svelte    # Tabs primitive. Tab bar with content switching.
│   │   │       └── ContextMenu.svelte # ContextMenu primitive. Right-click action menu.
│   │   │
│   │   ├── server/              # Server-only modules. Never imported by client.
│   │   │   ├── index.ts         # Barrel export for server modules.
│   │   │   ├── discovery.ts     # Server-side mDNS listener. Reactive map of discovered nodes.
│   │   │   └── topology.ts      # SwarmTopologyDTO builder. Pure function, no side effects.
│   │   │
│   │   ├── datavis/             # Data visualization layer.
│   │   │   ├── index.ts         # Barrel export for datavis modules.
│   │   │   ├── types.ts         # Domain types: DeviceType, ModalityCode, PeerNode, TopologyEdge.
│   │   │   └── topology/        # Topology visualization subsystem.
│   │   │       ├── index.ts     # Barrel export for topology modules.
│   │   │       ├── TopologyCanvas.svelte # TopologyCanvas — SVG orbital map container.
│   │   │       ├── SwarmNode.svelte      # SwarmNode — Individual peer node with icon, modality, status.
│   │   │       ├── EdgeLayer.svelte      # EdgeLayer — SVG lines connecting peers.
│   │   │       └── layout.ts             # Radial/orbital layout engine. Pure function.
│   │   │
│   │   └── assets/              # Static assets.
│   │       └── icons/           # SVG device-type icons. One per DeviceType value.
│   │           ├── device-raspi.svg    # Raspberry Pi icon.
│   │           ├── device-arduino.svg  # Arduino icon.
│   │           ├── device-android.svg  # Android icon.
│   │           ├── device-ios.svg      # iOS icon.
│   │           ├── device-windows.svg  # Windows icon.
│   │           ├── device-linux.svg    # Linux icon.
│   │           ├── device-apple.svg    # Apple icon.
│   │           └── device-unknown.svg  # Unknown device icon.
│   │
│   └── routes/                  # SvelteKit file-based routing.
│       ├── +layout.ts           # Root layout. Theme hydration, global styles.
│       ├── +layout.svelte       # Root layout component. Shell, nav, sidebar.
│       ├── layout.css           # Global CSS. Imports regime files, defines tokens.
│       ├── +page.svelte         # Home page. Dashboard with topology, telemetry, panels.
│       ├── +error.svelte        # Error page. Themed error display.
│       │
│       ├── api/                 # BFF API routes. All responses are strictly typed.
│       │   ├── peers/
│       │   │   └── +server.ts   # GET /api/peers — List peers. POST /api/peers — Trust/reject.
│       │   ├── snapshot/
│       │   │   └── +server.ts   # GET /api/snapshot — Current SwarmSnapshot.
│       │   ├── topology/
│       │   │   └── +server.ts   # GET /api/topology — SwarmTopologyDTO.
│       │   ├── discovery/
│       │   │   └── +server.ts   # GET /api/discovery — Discovered nodes from mDNS.
│       │   ├── models/
│       │   │   └── +server.ts   # GET /api/models — Model catalog. POST — approve/reject.
│       │   └── replay/
│       │       └── +server.ts   # GET /api/replay — Scenario list. POST — start/stop replay.
│       │
│       ├── models/
│       │   └── +page.svelte     # Models page. Catalog, approval, download status.
│       │
│       ├── design/
│       │   └── +page.svelte     # Design page. Theme gallery, regime controls, component preview.
│       │
│       └── settings/
│           └── +page.svelte     # Settings page. Per-device theme persistence, display options.
```

### `site/` — Marketing / Documentation Site

```
site/
├── package.json                 # Site package manifest. Zero dependencies on src/ or cockpit/.
├── tsconfig.json                # TypeScript config. Standalone strictness.
├── svelte.config.js             # SvelteKit config. Adapter-static for static hosting.
├── vite.config.ts               # Vite config.
├── src/
│   ├── app.html                 # SPA HTML shell. SEO meta tags, font preload.
│   ├── app.d.ts                 # Global type declarations.
│   │
│   ├── lib/                     # Client-side shared library.
│   │   ├── index.ts             # Barrel export for lib modules.
│   │   ├── themes/              # Theme regime files. Mirrors cockpit/ themes.
│   │   │   ├── index.css        # Theme regime imports.
│   │   │   ├── ghost.css        # Ghost regime.
│   │   │   ├── ember.css        # Ember regime.
│   │   │   ├── void.css         # Void regime.
│   │   │   ├── bloom.css        # Bloom regime.
│   │   │   ├── circuit.css      # Circuit regime.
│   │   │   └── aurora.css       # Aurora regime.
│   │   │
│   │   ├── theme.ts             # Theme regime state store.
│   │   │
│   │   └── components/          # Marketing components.
│   │       ├── index.ts         # Barrel export.
│   │       ├── Hero.svelte      # Hero section.
│   │       ├── FeatureGrid.svelte # Feature grid.
│   │       ├── Architecture.svelte # Architecture diagram.
│   │       ├── Pricing.svelte   # Pricing table.
│   │       └── Footer.svelte    # Footer.
│   │
│   └── routes/                  # SvelteKit file-based routing.
│       ├── +layout.ts           # Root layout.
│       ├── +layout.svelte       # Root layout component.
│       ├── layout.css           # Global CSS.
│       ├── +page.svelte         # Home page.
│       ├── +error.svelte        # Error page.
│       │
│       ├── docs/
│       │   └── +page.svelte     # Documentation page.
│       │
│       ├── about/
│       │   └── +page.svelte     # About page.
│       │
│       └── contact/
│           └── +page.svelte     # Contact page.
```

### `supervisor/` — OTA Supervisor (pinned, immutable)

```
supervisor/
├── index.ts                     # Supervisor entry point. Heartbeat, watchdog, install orchestration.
├── installer.ts                 # Package extraction, checksum verification, rollback.
├── watchdog.ts                  # Health check loop. Triggers revert on watchdog timeout.
├── contract.ts                  # Supervisor-to-app contract. Shared status file schema.
└── package.json                 # Supervisor package manifest. Zero runtime dependencies.
```

### Root configuration files

```
tsconfig.json                    # Root TypeScript config. Locked to src/ only.
package.json                     # Root package manifest. Workspaces, scripts, dev dependencies.
.gitignore                       # Git ignore rules.
README.md                        # Project overview and quickstart.
GUIDE.md                         # Architecture guide. Canonical behavioral rules.
CRDT.md                          # CRDT technical reference. Canonical CRDT definitions.
FILETREE.md                      # This document. Canonical file map.
BACKLOG.md                       # Feature backlog. Current development state.
```

---

## Build Boundary Rules

1. **`src/`** MUST NOT import from `cockpit/`, `site/`, or `supervisor/`.
2. **`cockpit/`** MUST NOT import from `site/` or `supervisor/`. It MAY import from `src/` via `$core`.
3. **`site/`** MUST NOT import from `src/`, `cockpit/`, or `supervisor/`.
4. **`supervisor/`** MUST NOT import from `src/`, `cockpit/`, or `site/`.
5. All barrels (`index.ts`) MUST re-export every module in their directory.
6. All files MUST carry the four-line header comment block (path, description, expects, provides).
7. All `.svelte` files MUST use `<!-- -->` comments for the header block.
8. All imports MUST use explicit `.js` extensions for ESM compatibility.
9. All imports MUST use path aliases (`$core`, `$lib`) — never relative paths crossing build boundaries.
10. No `any` types anywhere. Strict mode is non-negotiable.

---

## Header Comment Block Format

Every file MUST begin with a four-line comment block:

**TypeScript / JavaScript files:**

```typescript
// 1. Relative path: src/network/discovery.ts
// 2. Description: mDNS service advertisement and peer discovery listener.
// 3. Expects: A configured Bonjour instance and a TrustRegistry reference.
// 4. Provides: startCockpitDiscovery() and getDiscoveredNodes() functions.
```

**Svelte files:**

```svelte
<!--
1. Relative path: cockpit/src/lib/components/ui/Button.svelte
2. Description: Themed button primitive with variants and accessibility passthrough.
3. Expects: Variant, optional icon, aria-label, and click handler.
4. Provides: A type-safe, accessible button component.
-->
```

---

## Path Alias Configuration

**`cockpit/vite.config.ts`:**

```typescript
resolve: {
  alias: {
    '$core': path.resolve(__dirname, '../src'),
    '$lib': path.resolve(__dirname, 'src/lib'),
  }
}
```

**`cockpit/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "$core/*": ["../src/*"],
      "$lib/*": ["./src/lib/*"]
    }
  }
}
```

**`site/vite.config.ts`:**

```typescript
resolve: {
  alias: {
    '$lib': path.resolve(__dirname, 'src/lib'),
  }
}
```

**`site/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "$lib/*": ["./src/lib/*"]
    }
  }
}
```

---

## Enforcement

This document is enforced by:
1. **Build-time checks**: The CI pipeline validates that all files carry header blocks.
2. **Import linting**: The CI pipeline validates that no cross-boundary imports exist.
3. **Type checking**: `tsc --noEmit` is run on every build. Strict mode catches `any` and missing types.
4. **Manual review**: The operator reviews all changes against this document before merging.

Files marked ⏳ planned are locked backlog decisions that do not yet exist on disk.
When implemented, their headers MUST match this document's description exactly.

---

## Quick Reference

| Question | Answer |
|---|---|
| Where does a new core module go? | `src/<domain>/<module>.ts` with barrel export in `src/<domain>/index.ts` |
| Where does a new UI primitive go? | `cockpit/src/lib/components/ui/<Name>.svelte` with barrel export |
| Where does a new adapter go? | `cockpit/src/lib/adapters/<name>.ts` with barrel export |
| Where does a new API route go? | `cockpit/src/routes/api/<resource>/+server.ts` |
| Where does a new page go? | `cockpit/src/routes/<path>/+page.svelte` |
| Where does a new theme regime go? | `cockpit/src/lib/themes/<name>.css` + import in `index.css` |
| Where does a new icon go? | `cockpit/src/lib/assets/icons/device-<type>.svg` |
| Where does a new scenario go? | `src/observability/scenarios.ts` SCENARIOS array |
| Where does a new error code go? | `src/errors.ts` SwISDErrorCode union |
| Where does a new device type go? | `src/observability/schema.ts` DeviceType union |