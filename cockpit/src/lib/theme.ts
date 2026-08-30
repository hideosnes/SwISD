// 1. Relative path: cockpit/src/lib/theme.ts
// 2. Description: Typed registry of cockpit theme regimes; the UI source of truth for theme switching.
// 3. Expects: To stay in sync with cockpit/src/lib/themes/*.css (build-level contract).
// 4. Provides: ThemeId union, theme descriptors, regime lookup, and a runtime type guard. No `any`, ever.

export const THEME_IDS = ['midnight', 'daylight', 'cyberdeck', 'ultraviolet'] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export type Regime = 'dark' | 'light';

export interface ThemeDescriptor {
  readonly id: ThemeId;
  readonly label: string;
  readonly regime: Regime;
}

export const THEMES: readonly ThemeDescriptor[] = [
  { id: 'midnight', label: 'Midnight Violet', regime: 'dark' },
  { id: 'daylight', label: 'Lavender Daylight', regime: 'light' },
  { id: 'cyberdeck', label: 'Cyberdeck', regime: 'dark' },
  { id: 'ultraviolet', label: 'Ultraviolet', regime: 'dark' }
];

export function regimeOf(id: ThemeId): Regime {
  const found = THEMES.find((entry) => entry.id === id);
  return found ? found.regime : 'dark';
}

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}