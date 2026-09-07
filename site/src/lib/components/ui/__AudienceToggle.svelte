<!--
1. Relative path: site/src/lib/components/ui/AudienceToggle.svelte
2. Description: Segmented control selecting the active audience side (Developers / Executives).
3. Expects: Current side and a change callback.
4. Provides: Accessible, color-adaptive audience decision control.
-->
<script lang="ts">
  import type { SplitSide } from './__SplitSection.svelte';

  let { side, onChange }: { side: SplitSide; onChange: (side: SplitSide) => void } = $props();
</script>

<div class="inline-flex rounded-full border-2 border-current p-1 gap-1" role="group" aria-label="Choose your audience view">
  <button
    type="button"
    class="px-4 py-2 rounded-full text-sm font-semibold transition-all {side === 'left' ? 'bg-current/20 underline' : 'opacity-60 hover:opacity-100'}"
    aria-pressed={side === 'left'}
    onclick={() => onChange('left')}
  >
    Developers
  </button>
  <button
    type="button"
    class="px-4 py-2 rounded-full text-sm font-semibold transition-all {side === 'right' ? 'bg-current/20 underline' : 'opacity-60 hover:opacity-100'}"
    aria-pressed={side === 'right'}
    onclick={() => onChange('right')}
  >
    Executives
  </button>
</div>