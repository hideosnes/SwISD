<!--
1. Relative path: cockpit/src/lib/components/FoundingModal.svelte
2. Description: Modal for the Swarm Founding Ceremony.
3. Expects: Open state and close/found callbacks.
4. Provides: A themed, accessible modal for establishing the Keystone.
-->
<script lang="ts">
  import { Modal, TextField, Button } from '$lib/components/ui/index.js';
  
  interface Props {
    open: boolean;
    onclose: () => void;
    onfound: (phrase: string) => void;
  }
  
  let { open, onclose, onfound }: Props = $props();
  
  let swarmName = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  
  async function handleFound() {
    if (!swarmName.trim()) return;
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/ownership/found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swarmName: swarmName.trim() })
      });
      if (!res.ok) throw new Error('Founding failed');
      const data = await res.json() as { recoveryPhrase: string };
      onfound(data.recoveryPhrase);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<Modal {open} onclose={onclose} title="Found Swarm">
  <p class="mb-4">Establish this device as the Keystone and generate the Ownership Ledger. You will be shown a 128-bit recovery phrase exactly once.</p>
  <TextField label="Swarm Name" bind:value={swarmName} placeholder="e.g. Homahuki Prime" />
  {#if error}
    <p class="mt-2 text-sm" style="color: var(--danger);">{error}</p>
  {/if}
  
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Cancel</Button>
    <Button variant="primary" onclick={handleFound} disabled={loading || !swarmName.trim()}>
      {loading ? 'Founding...' : 'Found Swarm'}
    </Button>
  {/snippet}
</Modal>