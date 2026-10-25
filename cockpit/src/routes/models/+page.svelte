<!--
1. Relative path: cockpit/src/routes/models/+page.svelte
2. Description: The Models page view, hosting the model ingestion and library management.
3. Expects: Svelte 5 runes for layout and component integration.
4. Provides: A dedicated UI surface for managing heavy AI payloads with gated approval and live telemetry.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import ModelApprovalModal from '$lib/components/ModelApprovalModal.svelte';
  import ModelUploadModal from '$lib/components/ModelUploadModal.svelte';
  import ModelLibrary from '$lib/components/ModelLibrary.svelte';
  import { Button } from '$lib/components/ui';

  let showApprovalModal = $state(false);
  let showUploadModal = $state(false);
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col gap-2">
    <h1 class="text-3xl font-bold text-text-1">Model Distribution</h1>
    <p class="text-sm text-text-2 max-w-prose">
      Ingest heavy AI payloads directly into the swarm's local cache. Files are streamed, chunked, and Merkle-verified without consuming browser memory.
    </p>
  </div>
  
  <!-- Section 1: Simple left/right layout -->
  <div class="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm">
    <div class="flex items-center gap-3">
      <Button variant="primary" icon="cloud_download" onclick={() => showApprovalModal = true}>
        Fetch from HuggingFace
      </Button>
      <Button variant="secondary" icon="upload_file" onclick={() => showUploadModal = true}>
        Upload Local
      </Button>
    </div>
    <div class="text-sm text-text-3">
      Manage local models and active ingestions.
    </div>
  </div>

  <!-- Section 2: Full width, list of available models -->
  <ModelLibrary />
</div>

<ModelApprovalModal
  open={showApprovalModal}
  onclose={() => showApprovalModal = false}
/>

<ModelUploadModal
  open={showUploadModal}
  onclose={() => showUploadModal = false}
/>