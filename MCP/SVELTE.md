<!--
1. Relative path: SVELTE.md
2. Description: Strict accessibility, Svelte 5 runes, CSS architecture, and component standards for the SwISD Conductor Cockpit.
3. Expects: Svelte 5 compiler, TailwindCSS v4, strict TypeScript, and developer adherence to zero-compromise a11y and architectural rules.
4. Provides: A canonical reference for building accessible, type-safe, and performant Svelte components without bypassing compiler warnings or violating the Single-Source Doctrine.
-->
Svelte 5 & Accessibility Standards
This document defines the strict accessibility, CSS architecture, and component rules enforced across the Svelte 5 library. The Svelte 5 compiler treats accessibility warnings as errors. We do not use `svelte-ignore` directives to bypass these rules.

1. Svelte 5 Runes & Snippets Enforcement
We are building on Svelte 5. Legacy patterns are strictly forbidden.
- **No `export let`:** Use `$props()` for all component inputs. Destructure explicitly and type strictly.
- **No `<slot>`:** Use `{#snippet}` for composable, type-safe component children. Snippets provide explicit typing for fallbacks and parameters, whereas `<slot>` is a type-unsafe black box.
- **Reactivity:** Use `$state()` for mutable component state, `$derived()` for computed values, and `$effect()` for side-effects (like DOM measurements or external subscriptions). Do not mutate `$state` objects in a way that breaks reference equality if not intended.

2. Form Controls and Labels
Every `<label>` must be explicitly associated with its control using matching `for` and `id` attributes.
If a component accepts an optional `id` prop, it must generate a unique fallback ID to guarantee the association when the consumer omits it. Generate this ID once during component initialization to prevent it from changing on every render, which breaks screen reader tracking and causes hydration mismatches.

```svelte
<script lang="ts">
  let { id, label }: { id?: string; label: string } = $props();
  // Use a stable generated ID to prevent hydration mismatches
  const generatedId = `input-${Math.random().toString(36).slice(2, 9)}`;
  const finalId = $derived(id ?? generatedId);
</script>
<label for={finalId}>{label}</label>
<input id={finalId} type="text" />
```

3. Design System Composition (No UI Element Stands Alone)
- Feature/route components MUST import primitives from `$lib/components/ui` (via the barrel).
- Feature components MUST NOT contain raw hex colors, font families, or magic spacing numbers. All visual values resolve to CSS custom properties defined in `layout.css` and the regime files in `lib/themes/`.
- If you catch yourself writing a one-off styled element, STOP and promote it to a `components/ui` primitive first. Reuse is mandatory.
- Primitives are themed, not styled: a primitive reads tokens, it never hardcodes them.
- Composing primitives: pass variants via typed `$props()`. Do not reach into a primitive's internals to override its visuals.

4. CSS Architecture & The Cascade Layer Doctrine
- All custom CSS in `layout.css` MUST live in `@layer base` (element styles like `body`, `::selection`, `::-webkit-scrollbar`) or `@layer components` (helper classes like `.mi`, `.mono`, `.fill-accent`).
- **The Cascade Layer Doctrine:** Unlayered element/selector styles are strictly forbidden. In the CSS cascade, unlayered author CSS mathematically beats `@layer utilities`, silently murdering every Tailwind utility (like `p-6`, `mx-auto`, `text-xs`) on the page.
- **No Redundant Resets:** The universal reset (`* { margin: 0; padding: 0 }`) is delegated entirely to Tailwind's preflight (which lives safely in `@layer base`). We never redeclare it unlayered.
- **Borders as Theme Opinions:** Borders are `transparent` by default in `layout.css`. Visual separation is achieved via surface mass (`--bg` vs `--surface`), not hairlines. If a future regime requires borders (e.g. Cyberdeck), they are turned on by updating the `--border` token in the regime file, not by editing primitives.

5. Multi-Theme Regimes (Theme Folder Doctrine)
The cockpit supports N theme regimes, switched via a single attribute: `[data-theme='<id>']` on the `<html>` element.

- **Theme Folder:** One file per regime in `cockpit/src/lib/themes/<id>.css`, registered in the folder's CSS barrel (`index.css`), which `layout.css` imports in a single step. Runtime fetching of theme CSS is forbidden (offline resilience).
- **File Contract:** A theme file may declare ONLY custom properties and `color-scheme` on `:root` (default regime only) or bare `[data-theme='<id>']` selectors (all other regimes). Never element styles — the Cascade Layer Doctrine travels with the folder.
- **Scoped Previews:** Because non-default regimes use bare `[data-theme='<id>']` selectors (not anchored to `:root`), the `/settings` gallery can place the attribute on a preview card and scope tokens to that subtree — no hardcoded hex in feature code.
- **Typed Registry:** `lib/theme.ts` (`THEMES`, `THEME_IDS`, `isThemeId`, `regimeOf`) is the UI source of truth and MUST stay in sync with the themes folder. Adding a regime means: new CSS file + new barrel line + new registry entry + new `app.html` whitelist entry.
- **Default Regime:** `midnight` owns the bare `:root` selector as the no-JS / pre-hydration fallback.
- **Persistence:**
  - Active regime persisted under `swisd-theme` in `localStorage`.
  - Last dark regime persisted under `swisd-theme-dark` so the shell's quick-flip restores it when flipping back from light.
  - `app.html` whitelists known ids and migrates legacy `dark`/`light` values before first paint (zero flash).
- **Shared Reactive Store:** `lib/theme.svelte.ts` exports `themeStore`, the single client-side source of truth consumed by both `ThemeToggle` (shell quick-flip) and `/settings` (gallery). Never duplicate theme state in feature components.
- **Primitive Ignorance:** Primitives never check the active regime. They consume tokens, which resolve to the active regime's values via `@theme inline`.

6. The `tailwind-merge` / `cn()` Prohibition
We do not use `tailwind-merge` or the `cn()` utility.
While `tailwind-merge` resolves string conflicts in JavaScript, it invites raw Tailwind overrides (e.g., `bg-slate-900`, `p-8`) from route components into primitives. This violates the Single-Source Doctrine by fracturing the theme and creating a second source of visual truth.
If a primitive needs visual variance, expose a strictly typed `$props()` variant (e.g., `density`, `variant`, `size`), not a raw `class` override. Use Svelte's native `class:` directive or `$derived()` for internal conditional styling.

7. Strict Accessibility (a11y) & Interactive Elements
Svelte's a11y compiler warnings are treated as build-failing errors. We never use `<!-- svelte-ignore -->` directives to silence them. If the compiler complains, the code is wrong.

- **Static Element Interactions (`a11y_no_static_element_interactions`):** Non-interactive elements (`<div>`, `<span>`, `<section>`, and SVG elements like `<g>`, `<rect>`, `<circle>`) MUST NOT have click handlers without an explicit ARIA `role` (e.g., `role="button"`). If an element is clickable, it should semantically be a `<button>`. For SVG datavis nodes where `<button>` is invalid, you must explicitly declare `role="button"`.
- **Keyboard Parity (`a11y_click_events_have_key_events`):** Any visible element with an `onclick` handler MUST have a corresponding `onkeydown` handler that triggers the same action on `Enter` and `Space` keys. Mouse-only interactions are strictly forbidden.
- **Dialog Focus Management:** Elements with `role="dialog"` or `role="alertdialog"` MUST include `tabindex="-1"` to support programmatic focus trapping and management. They must not rely on default browser focus behavior.
- **SVG Accessibility:** SVG elements used as interactive nodes (like the topology map) are invisible to screen readers by default. They require explicit `role`, `tabindex="0"`, descriptive `aria-label`s, and keyboard event handlers.

8. Client-Side Performance & Scroll Orchestration
To maintain blistering performance as component counts grow, we enforce localized DOM observation over global queries.

- **The Scroll Engine Doctrine:** Scroll-triggered animations and progressive disclosure MUST use the centralized scroll orchestration engine in `site/src/lib/scroll/` rather than global `document.querySelectorAll` inside `onMount`.
  - **Why:** Global queries force the browser to scan the entire DOM tree on mount, causing performance thrashing and potential memory leaks if cleanup is missed. The scroll engine attaches observers directly to specific DOM nodes, ensuring automatic, localized cleanup when elements unmount.
  - **Implementation:** See `site/src/lib/scroll/engine.ts` and the barrel export at `site/src/lib/scroll/index.ts`.
- **Negative Case (When NOT to use scroll orchestration):**
  - Do NOT use scroll-triggered reveals for layout-critical visibility logic (e.g., hiding/showing content based on user toggles). It is strictly for *progressive enhancement* of scroll-based entrance animations.
  - Do NOT use it for elements that must be immediately visible upon initial paint without any animation delay, as the observer threshold might cause a perceptible "pop-in" effect on slow devices.
  - Do NOT use it if the element is already inside a container that is being animated; animate the parent instead to reduce observer overhead.

9. Form Control Patterns & Contracts
Strict contracts for form controls to ensure type safety and accessibility.

- **MultiSelect Contract:** The `MultiSelect` primitive binds to a `string[]` array via `$bindable<string[]>([])`. Options are strictly typed as `readonly string[]`. The trigger displays up to 2 selected items before collapsing to a `+X` badge. CSS truncation (`truncate` class) is mandatory to prevent layout jumps; the `+X` count is isolated in a `shrink-0` element so it is never consumed by the ellipsis.
- **SegmentedControl Variants:** The `SegmentedControl` primitive supports two variants:
  - `variant="default"`: `h-12` pill shape with lime border accent (for primary navigation).
  - `variant="compact"`: `h-10` box shape with `rounded-xl` and `border-(--border)` to match `MultiSelect` and `TextField` footprints (for filter/sort controls).
- **FilterChip:** Accessible toggle chip with `aria-pressed` state. Used for single-value filters where a dropdown would be overkill.

10. Filter & Sort Patterns (Case Studies Doctrine)
The Case Studies archive established a reusable filter/sort pattern that must be replicated across all archive routes.

- **Multi-value filters:** Use `MultiSelect` with a `string[]` state. Derive the filtered set via `$derived` comparing against the selected array.
- **Single-value filters:** Use `FilterChip` components in a flex-wrap layout.
- **Sort controls:** Use `SegmentedControl` with `variant="compact"`. Sort is a mutually-exclusive, exactly-one-active control — never use a multi-select for sort.
- **Always-mounted status line:** The "Showing X of Y projects" line and "Clear filters" button must be permanently mounted in the DOM. When no filters are active, the clear button is rendered with `invisible` class to reserve layout space and prevent vertical jumps.
- **Deterministic sort fallback:** When sorting by year, always include an alphabetical fallback (`a.title.localeCompare(b.title)`) to prevent grid jitter when multiple projects share a release year.
- **Clear filters resets all state:** Including sort mode back to the locked spec default (e.g., `'alpha'` for A–Z).