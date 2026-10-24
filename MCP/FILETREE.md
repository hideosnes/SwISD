# FILETREE.md — SwISD Structural Map

> **Canonical source of truth for all SwISD file paths, roles, and expectations.**
> Every file in the repo MUST carry a header comment block stating its own
> path, description, expectations, provisions, and legal integration (see GUIDE.md Section 6).
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

```text
src/
├── index.ts                     # Main entry point. Starts observation plane, admin server, mDNS discovery.
├── types.ts                     # Shared core domain types: PeerRole, LoadScore, TaskState, etc.
├── utils.ts                     # Shared utility helpers: port parsing, token generation, etc.
├── errors.ts                    # Centralized error texts and SwISDError hierarchy.
│
├── admin/                       # Headless admin API server (JSON served from core).
│   ├── index.ts                 # Barrel export for admin modules.
│   └── server.ts                # Token-guarded HTTP admin server with CORS policy.
│
├── config/                      # Provisioning schema validation and loader.
│   ├── index.ts                 # Barrel export for config modules.
│   ├── loader.ts                # Loads and validates USB provision or env fallback.
│   ├── schema.ts                # Strict ProvisionConfig types and runtime guards.
│   └── credentials.ts           # CredentialManager for secure storage and validation of external API tokens.
│
├── crdt/                        # CRDT engine and domain CRDT definitions.
│   ├── index.ts                 # Barrel export for CRDT modules.
│   ├── merkle.ts                # Merkle-DAG hashing and integrity amplification.
│   ├── reputation.ts            # Reputation scoring and read-time decay projection.
│   ├── reputationLog.ts         # Append-only G-Set of signed reputation events.
│   └── structures.ts            # OR-Set, LWW-Register, G-Set, OR-Map, ModelRegistryCRDT.
│
├── crypto/                      # Cryptographic primitives (Ed25519, HMAC, Argon2, Hex).
│   ├── index.ts                 # Barrel export for crypto modules.
│   ├── argon2.ts                # Argon2id KDF for Sovereignty Layer secrets.
│   ├── ed25519.ts               # Ed25519 key generation, signing, verification.
│   ├── hex.ts                   # Hex serialization for Data Purity.
│   └── hmac.ts                  # HMAC-SHA256 keyed fragment integrity.
│
├── delivery/                    # OTA delivery, versioning, and heartbeat.
│   ├── index.ts                 # Barrel export for delivery modules.
│   ├── heartbeat.ts             # HeartbeatWriter — periodic liveness file writer.
│   ├── identity.ts              # IdentityManager — persistent peer identity surviving releases.
│   ├── installer.ts             # Install/extract/verify pipeline for OTA app packages.
│   ├── localSupervisor.ts       # Local supervisor communication and status parsing.
│   ├── mockReleaseGenerator.ts  # Dev tool for generating signed mock releases.
│   ├── schema.ts                # Delivery and update manifest schemas.
│   ├── updater.ts               # Update orchestration and stagger logic.
│   ├── verifier.ts              # SHA-256 + Ed25519 signature verification pipeline.
│   └── watchdog.ts              # Watchdog — health check and revert orchestration.
│
├── executor/                    # Capability-aware execution framework.
│   ├── index.ts                 # Barrel export for executor modules.
│   └── registry.ts              # ExecutorRegistry and CapabilityManifest routing.
│
├── models/                      # Model distribution and approval pipeline.
│   ├── index.ts                 # Barrel export for model modules.
│   ├── approval.ts              # ApprovalGate — operator approval workflow for new models.
│   ├── downloader.ts            # ModelDownloader — HTTP/S3 model fetching with progress tracking and CredentialManager injection.
│   ├── huggingface.ts           # HuggingFace API metadata pre-fetch and ingress (token-injected).
│   ├── ingest.ts                # Polymorphic ingestion, chunking, and Merkle verification.
│   ├── manager.ts               # ModelManager — RAII lifecycle, promise deduplication, active-task protection, and storage watermarks.
│   ├── registry.ts              # ModelRegistry — model metadata catalog.
│   └── schema.ts                # ModelManifest and chunk map schemas.
│
├── network/                     # Node-to-node communication layer.
│   ├── router/                  # Gossip and egress routing.
│   │   ├── egressTunnel.ts      # Direct libp2p stream protocol for targeted results.
│   │   ├── gossipRouter.ts      # Capability-aware gossip validation and routing.
│   │   └── index.ts             # Barrel export for router modules.
│   ├── bloom.ts                 # Probabilistic TTL via Bloom Filters (loop prevention).
│   ├── discovery.ts             # mDNS/Bonjour service advertisement and listener.
│   ├── health.ts                # PeerHealthMonitor via libp2p ping + load score.
│   ├── index.ts                 # Barrel export for network modules.
│   └── libp2p.ts                # libp2p node construction, protocol registry, and transport wiring.
│
├── observability/               # Telemetry, events, snapshots, and replay.
│   ├── index.ts                 # Barrel export for observability modules.
│   ├── devSource.ts             # createDevObservabilitySource() — live source backed by real services.
│   ├── eventBus.ts              # Bounded-ring event bus with cursor tracking.
│   ├── scenarioEngine.ts        # createScenarioEngine() — replay source driven by SCENARIOS fixtures.
│   ├── scenarios.ts             # SCENARIOS fixture library + Channel/Keyframe types.
│   ├── schema.ts                # Strict schema types: SwarmSnapshot, ObservabilitySource, DeviceType.
│   └── snapshot.ts              # buildSwarmSnapshot() — immutable snapshot builder.
│
├── ownership/                   # The Sovereignty Layer (keystone, bonding, succession).
│   ├── index.ts                 # Barrel export for ownership modules.
│   ├── anchor.ts                # Worker-side bond anchor, whitelist cache & command verification.
│   ├── keystone.ts              # Keystone role: ledger custody, enrollment, whitelist revisions.
│   ├── ownership.ts             # Core ownership state and ledger parsing.
│   ├── recoveryRateLimiter.ts   # Restart-proof rate limiting for recovery phrase attempts.
│   ├── schema.ts                # OwnershipLedger, ConductorDevice, NodePolicy, succession events.
│   └── succession.ts            # Succession ceremony, revision monotonicity, recovery fallback.
│
├── peer/                        # Peer trust management.
│   ├── index.ts                 # Barrel export for peer modules.
│   └── trust.ts                 # TrustRegistry: pending/trusted/rejected state machine.
│
├── performance/                 # Edge backpressure and load monitoring.
│   ├── index.ts                 # Barrel export for performance modules.
│   ├── load.ts                  # Load scoring and token bucket throttling.
│   └── monitor.ts               # LoadMonitor — system resource tracking.
│
├── provision/                   # Out-of-box provisioning and setup portal.
│   ├── index.ts                 # Barrel export for provision modules.
│   ├── apply.ts                 # Idempotent USB provisioning agent (nmcli).
│   ├── portal.ts                # HTTP server for the captive portal setup wizard.
│   ├── schema.ts                # Strict wire DTOs for the portal join request/result.
│   └── wizardPage.ts            # Self-contained HTML/CSS/JS template for the captive portal.
│
├── storage/                     # Storage capacity and watermarks.
│   ├── index.ts                 # Barrel export for storage modules.
│   └── capacity.ts              # Storage accounting and watermark enforcement.
│
└── tasks/                       # Task lifecycle, preemption, and fragmentation.
    ├── index.ts                 # Barrel export for task modules.
    ├── capabilities.ts          # ExecutorSignature branded type and capability probing.
    ├── ingestion.ts             # Task ingestion and polymorphic chunking.
    ├── lifecycle.ts             # TaskState transitions, preemption, and retry policies.
    └── locator.ts               # Task fragment locator and reassembly logic.
```

### `cockpit/` — Conductor Cockpit (SvelteKit BFF + SPA)

```text
cockpit/
├── package.json                 # Cockpit package manifest. Depends on ../../src via $core alias.
├── tsconfig.json                # TypeScript config. Extends root strictness. Adds $core and $lib aliases.
├── svelte.config.js             # SvelteKit config. Adapter-node for production builds.
├── vite.config.ts               # Vite config. $core alias resolution, dev server port.
├── vite.config.js               # Legacy Vite config (cleanup pending).
├── src/
│   ├── app.html                 # SPA HTML shell. Meta tags, font preload, zero-flash theme bootstrap.
│   ├── app.d.ts                 # Global type declarations for App.Locals.
│   ├── hooks.server.ts          # SvelteKit server hooks. Initializes core services, injects into locals.
│   │
│   ├── lib/                     # Client-side shared library.
│   │   ├── index.ts             # Barrel export for lib modules.
│   │   ├── themes/              # Theme regime files.
│   │   │   ├── index.css        # Theme regime imports. Bundles all regime CSS.
│   │   │   ├── cyberdeck.css    # Cyberdeck regime (legacy).
│   │   │   ├── daylight.css     # Lavender Daylight regime.
│   │   │   ├── midnight.css     # Midnight Violet regime (default).
│   │   │   └── ultraviolet.css  # Ultraviolet regime.
│   │   │
│   │   ├── theme.ts             # Theme regime typed registry (THEMES, THEME_IDS).
│   │   ├── theme.svelte.ts      # Shared reactive theme store.
│   │   ├── pins.svelte.ts       # Shared reactive pin store (max 8, FIFO eviction).
│   │   ├── peerOverrides.svelte.ts # Local peer display name/role overrides.
│   │   │
│   │   ├── adapters/            # Domain-to-primitive adapter layer.
│   │   │   ├── index.ts         # Barrel export for adapters.
│   │   │   ├── keystone.ts      # Keystone state to StatusPill vocabulary.
│   │   │   ├── load.ts          # loadToStatus(): LoadScore -> StatusPill vocabulary.
│   │   │   └── trust.ts         # trustToStatus(): TrustState -> StatusPill vocabulary.
│   │   │
│   │   ├── components/          # Feature components. Compose primitives, never raw HTML.
│   │   │   ├── datavis/         # Data visualization layer.
│   │   │   │   ├── topology/    # Topology visualization subsystem.
│   │   │   │   │   ├── GhostNode.svelte        # Limbo orbit ghost node.
│   │   │   │   │   ├── ModalityLegend.svelte   # Capability legend.
│   │   │   │   │   ├── SwarmNode.svelte        # Individual peer node with bezel encoding.
│   │   │   │   │   ├── TopologyAnatomyBench.svelte # Layout math benchmarking.
│   │   │   │   │   ├── TopologyCanvas.svelte   # SVG orbital map container.
│   │   │   │   │   ├── TrustRing.svelte        # Trust orbit rings.
│   │   │   │   │   ├── index.ts                # Barrel export.
│   │   │   │   │   └── layout.ts               # Radial/orbital layout engine (D3 scaleLinear).
│   │   │   │   ├── index.ts     # Barrel export for datavis.
│   │   │   │   └── types.ts     # Domain types: DeviceType, ModalityCode, PeerNode.
│   │   │   │
│   │   │   ├── ui/              # Primitive component library. Single-source visual atoms.
│   │   │   │   ├── index.ts       # Barrel export for all UI primitives.
│   │   │   │   ├── Badge.svelte   # Count indicator, caps at 99+.
│   │   │   │   ├── Button.svelte  # Button primitive. Variants: primary, secondary, ghost, danger.
│   │   │   │   ├── Card.svelte    # Surface container with title, body, footer slots.
│   │   │   │   ├── ContextMenu.svelte # Right-click action menu.
│   │   │   │   ├── Drawer.svelte  # Slide-in panel (used by CommandQueue).
│   │   │   │   ├── EmptyState.svelte # Placeholder for empty data.
│   │   │   │   ├── Icon.svelte    # SVG sprite-based, size variants.
│   │   │   │   ├── Modal.svelte   # Overlay dialog with backdrop and focus trap.
│   │   │   │   ├── PageShell.svelte # Layout wrapper with header/footer.
│   │   │   │   ├── Panel.svelte   # Section container with title.
│   │   │   │   ├── ProgressBar.svelte # Linear progress indicator.
│   │   │   │   ├── ProgressRing.svelte # Circular progress indicator.
│   │   │   │   ├── Stat.svelte    # Key-value display with label.
│   │   │   │   ├── StatusPill.svelte # live/idle/warn/error semantic colors.
│   │   │   │   ├── SwarmPulse.svelte # Animated liveness indicator.
│   │   │   │   ├── Tabs.svelte    # WAI-ARIA compliant tab bar.
│   │   │   │   ├── TextField.svelte # Labeled input with validation.
│   │   │   │   └── ThemeToggle.svelte # Regime switcher with preview.
│   │   │   │
│   │   │   ├── CommandQueue.svelte      # Pending trust/operator actions drawer.
│   │   │   ├── DiscoveryPanel.svelte    # mDNS discovery UI panel.
│   │   │   ├── EngineRoomView.svelte    # Engine Room tab: load, delivery, events.
│   │   │   ├── FoundingModal.svelte     # Keystone founding ceremony & recovery phrase.
│   │   │   ├── KeystoneLossBanner.svelte # Sovereignty Layer: keystone-loss observability.
│   │   │   ├── ModelApprovalModal.svelte # Tier 1 model download approval gate.
│   │   │   ├── ModelDropZone.svelte     # Drag-and-drop .gguf ingestion.
│   │   │   ├── NodeDetailModal.svelte   # Deep-dive peer telemetry modal.
│   │   │   ├── PendingTrustPanel.svelte # Transitional trust UI (pending incineration).
│   │   │   ├── RecoveryPhraseDisplay.svelte # 12-word phrase one-time display.
│   │   │   ├── ReplayControlModal.svelte # Scenario replay transport controls.
│   │   │   ├── SessionLockOverlay.svelte # Argon2id-hashed UI session lock.
│   │   │   ├── StageView.svelte         # Stage tab: masonry grid of peer cards.
│   │   │   ├── SwarmSidebar.svelte      # Sidebar with pins and event log.
│   │   │   └── UpdateApprovalModal.svelte # OTA update approval gate.
│   │   │
│   │   └── server/              # Server-only modules. Never imported by client.
│   │       ├── index.ts         # Barrel export for server modules.
│   │       ├── conductorIdentity.ts # Per-device Ed25519 identity & enrollment.
│   │       ├── discovery.ts     # Server-side mDNS listener. Reactive map of discovered nodes.
│   │       ├── sessionLock.ts   # Session lock state and Argon2id verification.
│   │       └── topology.ts      # SwarmTopologyDTO builder. Pure function, no side effects.
│   │
│   └── routes/                  # SvelteKit file-based routing.
│       ├── +layout.svelte       # Root layout component. Shell, nav, sidebar.
│       ├── layout.css           # Global CSS. Imports regime files, defines tokens.
│       ├── +page.svelte         # Home page. Dashboard with topology, telemetry, panels.
│       │
│       ├── api/                 # BFF API routes. All responses are strictly typed.
│       │   ├── credentials/
│       │   │   └── huggingface/
│       │   │       └── +server.ts # GET/POST /api/credentials/huggingface — Validate and persist HF token.
│       │   ├── discovery/
│       │   │   └── +server.ts   # GET /api/discovery — Discovered nodes from mDNS.
│       │   ├── models/
│       │   │   ├── approve/
│       │   │   │   └── +server.ts # POST /api/models/approve — Approve model download.
│       │   │   ├── ingest/
│       │   │   │   └── +server.ts # POST /api/models/ingest — Drag-and-drop ingestion.
│       │   │   ├── library/
│       │   │   │   └── +server.ts # GET /api/models/library — Local model catalog.
│       │   │   ├── request/
│       │   │   │   └── +server.ts # POST /api/models/request — Request HF model metadata.
│       │   │   └── status/
│       │   │       └── +server.ts # GET /api/models/status — SSE download progress.
│       │   ├── ownership/
│       │   │   ├── enroll/
│       │   │   │   └── +server.ts # POST /api/ownership/enroll — Conductor enrollment.
│       │   │   ├── found/
│       │   │   │   └── +server.ts # POST /api/ownership/found — Swarm founding.
│       │   │   └── status/
│       │   │       └── +server.ts # GET /api/ownership/status — Keystone & ledger status.
│       │   ├── peers/
│       │   │   ├── [peerId]/
│       │   │   │   └── ping/
│       │   │   │       └── +server.ts # POST /api/peers/[peerId]/ping — Manual health check.
│       │   │   └── +server.ts   # GET/POST /api/peers — List peers, trust/reject.
│       │   ├── scenario/
│       │   │   └── +server.ts   # GET/POST /api/scenario — Replay activation gate.
│       │   ├── session/
│       │   │   ├── status/
│       │   │   │   └── +server.ts # GET /api/session/status — Lock state.
│       │   │   └── +server.ts   # POST /api/session — Lock/unlock/set password.
│       │   ├── snapshot/
│       │   │   └── +server.ts   # GET /api/snapshot — Current SwarmSnapshot.
│       │   ├── system/
│       │   │   ├── hostname/
│       │   │   │   └── +server.ts # POST /api/system/hostname — Update node hostname.
│       │   │   └── update/
│       │   │       └── +server.ts # POST /api/system/update — Trigger OTA update.
│       │   └── topology/
│       │       └── +server.ts   # GET /api/topology — SwarmTopologyDTO.
│       │
│       ├── design/
│       │   └── +page.svelte     # Design page. Theme gallery, regime controls, component preview.
│       ├── dev/
│       │   └── replay/
│       │       └── +page.svelte # Scenario replay control deck.
│       ├── models/
│       │   └── +page.svelte     # Models page. Catalog, approval, download status.
│       └── settings/
│           └── +page.svelte     # Settings page. Per-device theme persistence, display options, and secure credential management.
```

### `site/` — Marketing / Documentation Site

```text
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
│   │   │   └── ...              # (Imports from cockpit/src/lib/themes per Single-Source Doctrine)
│   │   │
│   │   └── components/          # Marketing components & Primitives.
│   │       ├── index.ts         # Barrel export.
│   │       ├── ui/              # Marketing-specific primitives (FilterChip, CaseCard, MultiSelect, SegmentedControl).
│   │       ├── Hero.svelte      # Hero section.
│   │       ├── Architecture.svelte # Architecture diagram (OrbitExplainer).
│   │       └── ...              # Landing page sections, Timeline, Modal.
│   │
│   └── routes/                  # SvelteKit file-based routing.
│       ├── +layout.svelte       # Root layout component (TopNav, Footer).
│       ├── +page.svelte         # Home page.
│       ├── case-studies/
│       │   └── +page.svelte     # Filterable/sortable Case Studies archive.
│       ├── design/
│       │   └── +page.svelte     # Visual Contract & primitive gallery.
│       └── research/            # ⏳ planned — Whitepapers Hub.
```

### `supervisor/` — OTA Supervisor (pinned, immutable)

```text
supervisor/
├── index.ts                     # Supervisor entry point. Heartbeat, watchdog, install orchestration.
├── installer.ts                 # Package extraction, checksum verification, rollback.
├── watchdog.ts                  # Health check loop. Triggers revert on watchdog timeout.
├── contract.ts                  # Supervisor-to-app contract. Shared status file schema.
└── package.json                 # Supervisor package manifest. Zero runtime dependencies.
```

### Root configuration files

```text
tsconfig.json                    # Root TypeScript config. Locked to src/ only.
package.json                     # Root package manifest. Workspaces, scripts, dev dependencies.
.gitignore                       # Git ignore rules.
README.md                        # Project overview and quickstart.
GUIDE.md                         # Architecture guide. Canonical behavioral rules.
CRDT.md                          # CRDT technical reference. Canonical CRDT definitions.
SVELTE.md                        # Svelte 5, a11y, and CSS architecture canon.
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
6. All files MUST carry the **six-point** header comment block (path, description, expects, provides, SPDX, Copyright).
7. All `.svelte` files MUST use `<!-- -->` comments for the header block.
8. All imports MUST use explicit `.js` extensions for ESM compatibility.
9. All imports MUST use path aliases (`$core`, `$lib`) — never relative paths crossing build boundaries.
10. No `any` types anywhere. Strict mode is non-negotiable.

---

## Header Comment Block Format

Every file MUST begin with a six-point comment block:

**TypeScript / JavaScript files:**

```typescript
// 1. Relative path: src/network/discovery.ts
// 2. Description: mDNS service advertisement and peer discovery listener.
// 3. Expects: A configured Bonjour instance and a TrustRegistry reference.
// 4. Provides: startCockpitDiscovery() and getDiscoveredNodes() functions.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH
```

**Svelte files:**

```svelte
<!--
1. Relative path: cockpit/src/lib/components/ui/Button.svelte
2. Description: Themed button primitive with variants and accessibility passthrough.
3. Expects: Variant, optional icon, aria-label, and click handler.
4. Provides: A type-safe, accessible button component.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
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
1. **Build-time checks**: The CI pipeline validates that all files carry 6-point header blocks.
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