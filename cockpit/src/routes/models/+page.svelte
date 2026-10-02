<!--
1. Relative path: cockpit/src/routes/models/+page.svelte
2. Description: The Models page view, hosting the drag-and-drop ingestion zone and HF request flow.
3. Expects: Svelte 5 runes for layout and component integration.
4. Provides: A dedicated UI surface for managing heavy AI payloads with gated approval.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import ModelDropZone from '$lib/components/ModelDropZone.svelte';
  import ModelApprovalModal from '$lib/components/ModelApprovalModal.svelte';
  import { Button } from '$lib/components/ui';

  let showApprovalModal = $state(false);
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold text-fuchsia-400">Model Distribution</h1>
  <p class="text-slate-400">Ingest heavy AI payloads directly into the swarm's local cache. Files are streamed, chunked, and Merkle-verified without consuming browser memory.</p>
  
  <div class="action-buttons">
    <Button variant="primary" icon="cloud_download" onclick={() => showApprovalModal = true}>
      Request from HuggingFace
    </Button>
  </div>

  <ModelDropZone />
</div>

<ModelApprovalModal
  open={showApprovalModal}
  onclose={() => showApprovalModal = false}
/>

<style>
  @layer components {
    .action-buttons {
      display: flex;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }
  }
</style>