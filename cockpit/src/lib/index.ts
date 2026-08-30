// 1. Relative path: cockpit/src/lib/index.ts
// 2. Description: Barrel export for the cockpit's shared lib modules (theme registry + reactive theme store).
// 3. Expects: Sibling modules theme.ts (typed registry) and theme.svelte.ts (shared reactive store).
// 4. Provides: The single one-step import surface for all `$lib` consumers. No deep imports, ever.

export { THEMES, THEME_IDS, regimeOf, isThemeId } from './theme';
export type { ThemeId, ThemeDescriptor, Regime } from './theme';
export { themeStore } from './theme.svelte';