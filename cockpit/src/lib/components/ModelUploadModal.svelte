<!--
1. Relative path: cockpit/src/lib/components/ModelUploadModal.svelte
2. Description: Modal dialog for uploading local model files.
3. Expects: Open state, onclose callback.
4. Provides: A gated upload flow using the existing ModelDropZone.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import { Modal, Button } from '$lib/components/ui';
  import ModelDropZone from './ModelDropZone.svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();
</script>

<Modal {open} {onclose} title="Upload Local Model">
  <div class="flex flex-col gap-4">
    <p class="text-sm text-text-2">
      Drag and drop a .gguf model file, or click to browse. The file will be streamed, chunked, and Merkle-verified without consuming browser memory.
    </p>
    <ModelDropZone />
  </div>
  
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Close</Button>
  {/snippet}
</Modal>
