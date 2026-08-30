// 1. Relative path: cockpit/src/lib/pins.svelte.ts
// 2. Description: Shared reactive pin store for the Conductor Cockpit. Persists operator-pinned peer IDs per device so prolonged control survives reloads.
// 3. Expects: Browser localStorage at runtime (guarded for SSR); peer ID strings only.
// 4. Provides: Reactive pinned peer ID list with toggle, query, and clear operations.

const STORAGE_KEY = 'swisd-pins';
const MAX_PINS = 8;

function readStoredPins(): ReadonlyArray<string> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

let pins = $state<string[]>([...readStoredPins()]);

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch {
    // Storage blocked or full. Pins survive in-memory for this session; the cockpit never crashes over cosmetics.
  }
}

export function getPinnedPeerIds(): ReadonlyArray<string> {
  return pins;
}

export function isPinned(peerId: string): boolean {
  return pins.includes(peerId);
}

export function togglePin(peerId: string): void {
  if (peerId.length === 0) return;
  if (pins.includes(peerId)) {
    pins = pins.filter((id) => id !== peerId);
  } else {
    const next = [...pins, peerId];
    // FIFO eviction at the cap: the oldest pin yields to the newest.
    pins = next.length > MAX_PINS ? next.slice(next.length - MAX_PINS) : next;
  }
  persist();
}

export function clearPins(): void {
  pins = [];
  persist();
}