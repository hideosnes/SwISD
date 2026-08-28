<!--
1. Relative path: SVELTE.md
2. Description: Strict accessibility, Svelte 5 runes, and component architecture standards for the SwISD Conductor Cockpit.
3. Expects: Svelte 5 compiler, strict TypeScript, and developer adherence to zero-compromise a11y and architectural rules.
4. Provides: A canonical reference for building accessible, type-safe, and performant Svelte components without bypassing compiler warnings.
-->

# Svelte 5 & Accessibility Standards

This document defines the strict accessibility and architectural rules enforced across the Svelte 5 component library. The Svelte 5 compiler treats accessibility warnings as errors. We do not use `svelte-ignore` directives to bypass these rules. 

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