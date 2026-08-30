<!--
1. Relative path: SVELTE.md
2. Description: Strict accessibility, Svelte 5 runes, CSS architecture, and component standards for the SwISD Conductor Cockpit.
3. Expects: Svelte 5 compiler, TailwindCSS v4, strict TypeScript, and developer adherence to zero-compromise a11y and architectural rules.
4. Provides: A canonical reference for building accessible, type-safe, and performant Svelte components without bypassing compiler warnings or violating the Single-Source Doctrine.
-->

# Svelte 5 & Accessibility Standards

This document defines the strict accessibility, CSS architecture, and component rules enforced across the Svelte 5 library. The Svelte 5 compiler treats accessibility warnings as errors. We do not use `svelte-ignore` directives to bypass these rules. 

## 1. Svelte 5 Runes & Snippets Enforcement
We are building on Svelte 5. Legacy patterns are strictly forbidden.
- **No `export let`**: Use `$props()` for all component inputs. Destructure explicitly and type strictly.
- **No `<slot>`**: Use `{#snippet}` for composable, type-safe component children. Snippets provide explicit typing for fallbacks and parameters, whereas `<slot>` is a type-unsafe black box.
- **Reactivity**: Use `$state()` for mutable component state, `$derived()` for computed values, and `$effect()` for side-effects (like DOM measurements or external subscriptions). Do not mutate `$state` objects in a way that breaks reference equality if not intended.

## 2. Form Controls and Labels
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

## 3. Design System Composition (No UI Element Stands Alone)

- Feature/route components MUST import primitives from `$lib/components/ui` (via the barrel).
- Feature components MUST NOT contain raw hex colors, font families, or magic spacing numbers. All visual values resolve to CSS custom properties defined in `layout.css`.
- If you catch yourself writing a one-off styled element, STOP and promote it to a `components/ui` primitive first. Reuse is mandatory.
- Primitives are themed, not styled: a primitive reads tokens, it never hardcodes them.
- Composing primitives: pass variants via typed `$props()`. Do not reach into a primitive's internals to override its visuals.

## 4. CSS Architecture & The Cascade Layer Doctrine

All custom CSS in `layout.css` MUST live in `@layer base` (element styles like `body`, `::selection`, `::-webkit-scrollbar`) or `@layer components` (helper classes like `.mi`, `.mono`, `.fill-accent`). 

- **The Cascade Layer Doctrine:** Unlayered element/selector styles are strictly forbidden. In the CSS cascade, unlayered author CSS mathematically beats `@layer utilities`, silently murdering every Tailwind utility (like `p-6`, `mx-auto`, `text-xs`) on the page. 
- **No Redundant Resets:** The universal reset (`* { margin: 0; padding: 0 }`) is delegated entirely to Tailwind's preflight (which lives safely in `@layer base`). We never redeclare it unlayered.
- **Borders as Theme Opinions:** Borders are `transparent` by default in `layout.css`. Visual separation is achieved via surface mass (`--bg` vs `--surface`), not hairlines. If a future theme requires borders, they are turned on by updating the `--border` token, not by editing primitives.

## 5. Dual-Regime Theming (Light/Dark)

The cockpit supports dual regimes switched via a single attribute: `[data-theme='light']` on the `<html>` element.

- **Persistence:** The active regime is persisted in `localStorage` under the key `swisd-theme`.
- **Zero-Flash Bootstrap:** A pre-hydration script in `app.html` applies the attribute before first paint to prevent flash-of-wrong-regime.
- **Token Projection:** `layout.css` uses `:root` for the default (dark) regime and `:root[data-theme='light']` for the light regime. Tailwind's `@theme inline` projection maps utilities (e.g., `bg-surface`) to `var(--surface)`. 
- **Primitive Ignorance:** Primitives never check the active regime. They only consume tokens, which automatically resolve to the active regime's values.

## 6. The `tailwind-merge` / `cn()` Prohibition

We do not use `tailwind-merge` or the `cn()` utility. 

While `tailwind-merge` resolves string conflicts in JavaScript, it invites raw Tailwind overrides (e.g., `bg-slate-900`, `p-8`) from route components into primitives. This violates the Single-Source Doctrine by fracturing the theme and creating a second source of visual truth. 

If a primitive needs visual variance, expose a strictly typed `$props()` variant (e.g., `density`, `variant`, `size`), not a raw `class` override. Use Svelte's native `class:` directive or `$derived()` for internal conditional styling.