// 1. Relative path: cockpit/src/lib/theme.svelte.ts
// 2. Description: Shared reactive theme store for the cockpit (single client-side source of truth).
// 3. Expects: [data-theme] applied pre-paint by app.html; persistence via localStorage keys 'swisd-theme' and 'swisd-theme-dark'.
// 4. Provides: Reactive current theme and regime, plus set/flipRegime/adopt operations shared by the shell toggle and the settings route.

import { isThemeId, regimeOf, type Regime, type ThemeId } from './theme';

const STORAGE_THEME = 'swisd-theme';
const STORAGE_DARK = 'swisd-theme-dark';

let active = $state<ThemeId>('midnight');

function persist(next: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_THEME, next);
    if (regimeOf(next) === 'dark') localStorage.setItem(STORAGE_DARK, next);
  } catch {
    /* Storage unavailable (private mode) — regime stays session-only. */
  }
}

function apply(next: ThemeId): void {
  active = next;
  document.documentElement.dataset.theme = next;
  persist(next);
}

export const themeStore = {
  get current(): ThemeId {
    return active;
  },

  get regime(): Regime {
    return regimeOf(active);
  },

  set(next: ThemeId): void {
    if (next !== active) apply(next);
  },

  flipRegime(next: Regime): void {
    if (next === regimeOf(active)) return;

    if (next === 'light') {
      apply('daylight');
      return;
    }

    let target: ThemeId = 'midnight';
    try {
      const stored = localStorage.getItem(STORAGE_DARK);
      if (isThemeId(stored) && regimeOf(stored) === 'dark') target = stored;
    } catch {
      /* Storage unavailable — fall back to the default dark regime. */
    }
    apply(target);
  },

  adopt(): void {
    const initial = document.documentElement.dataset.theme;
    if (isThemeId(initial)) active = initial;
  }
};