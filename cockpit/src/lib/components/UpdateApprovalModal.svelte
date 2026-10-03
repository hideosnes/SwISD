<!--
1. Relative path: cockpit/src/lib/components/UpdateApprovalModal.svelte
2. Description: Approval modal for triggering OTA updates on swarm nodes.
3. Expects: Open state, target description, and confirm/cancel callbacks.
4. Provides: A themed, accessible modal warning the operator about the update action.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->
<script lang="ts">
  import { Modal, Button } from '$lib/components/ui/index.js';

  interface Props {
    open: boolean;
    targetDescription: string;
    isUpdating: boolean;
    onconfirm: () => void;
    oncancel: () => void;
  }

  let { open, targetDescription, isUpdating, onconfirm, oncancel }: Props = $props();
</script>

<Modal {open} onclose={oncancel} title="Confirm Swarm Update">
  <div class="space-y-4">
    <p class="text-sm text-text-2">
      You are about to trigger a cryptographically verified OTA update for:
    </p>
    <div class="rounded-sm border border-border bg-bg p-3 font-mono text-sm text-text-1">
      {targetDescription}
    </div>
    <p class="text-xs text-text-3">
      Nodes will download the latest release, verify SHA-256 and Ed25519 signatures, and atomically swap to the new version. The node will restart automatically upon success.
    </p>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={oncancel} disabled={isUpdating}>
      Cancel
    </Button>
    <Button variant="danger" onclick={onconfirm} disabled={isUpdating}>
      {isUpdating ? 'Updating...' : 'Confirm Update'}
    </Button>
  {/snippet}
</Modal>