<!--
1. Relative path: cockpit/src/lib/components/RecoveryPhraseDisplay.svelte
2. Description: One-time display modal for the 128-bit swarm recovery phrase.
3. Expects: Open state, the hex-encoded phrase, and a close callback.
4. Provides: A loud, accessible, un-screenshotable warning and display.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->
<script lang="ts">
  import { Modal, Button } from '$lib/components/ui/index.js';
  
  interface Props {
    open: boolean;
    phrase: string;
    onclose: () => void;
  }
  
  let { open, phrase, onclose }: Props = $props();
</script>

<Modal {open} {onclose} title="Swarm Founded — Save Recovery Phrase">
  <div class="space-y-4">
    <p class="font-bold uppercase text-xs tracking-wider" style="color: var(--warn);">Critical Security Warning</p>
    <p class="text-text-2">
      This 128-bit recovery phrase is the <strong class="text-text-1">only</strong> way to recover your swarm if the Keystone node dies. 
      It will <strong class="text-text-1">never</strong> be shown again.
    </p>
    <div 
      class="mono p-4 rounded border text-text-1 break-all text-sm select-all"
      style="background: var(--bg); border-color: var(--border-strong);"
    >
      {phrase}
    </div>
    <p class="text-xs" style="color: var(--text-3);">
      Store it offline. Write it on paper. Do not screenshot. Do not email it.
    </p>
  </div>
  {#snippet footer()}
    <Button variant="primary" onclick={onclose}>I have secured the phrase</Button>
  {/snippet}
</Modal>