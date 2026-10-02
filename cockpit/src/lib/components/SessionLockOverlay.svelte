<!--
1. Relative path: cockpit/src/lib/components/SessionLockOverlay.svelte
2. Description: Full-screen overlay for the UI-only session lock.
3. Expects: Lock state and unlock callback.
4. Provides: A themed, accessible lock screen.
-->
<script lang="ts">
  import { TextField, Button } from '$lib/components/ui/index.js';
  
  interface Props {
    locked: boolean;
    hasPassword: boolean;
    onunlock: () => void;
  }
  
  let { locked, hasPassword, onunlock }: Props = $props();
  
  let phrase = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  
  async function handleUnlock() {
    if (!phrase) return;
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock', phrase })
      });
      if (!res.ok) throw new Error('Invalid password');
      onunlock();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unlock failed';
    } finally {
      loading = false;
    }
  }
</script>

{#if locked}
  <div class="lock-overlay" role="alertdialog" aria-modal="true" aria-labelledby="lock-title" tabindex="-1">
    <div class="lock-content">
      <h2 id="lock-title" class="text-2xl font-bold mb-4" style="color: var(--accent);">Cockpit Locked</h2>
      <p class="mb-6 text-text-2">Enter your session password to regain access.</p>
      <TextField label="Session Password" type="password" bind:value={phrase} />
      {#if error}
        <p class="mt-2 text-sm" style="color: var(--danger);">{error}</p>
      {/if}
      <div class="mt-6 flex justify-end">
        <Button variant="primary" onclick={handleUnlock} disabled={loading || !phrase}>
          {loading ? 'Verifying...' : 'Unlock'}
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  @layer components {
    .lock-overlay {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
    }
    .lock-content {
      width: min(400px, 100%);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--r-sm);
      padding: var(--space-xl);
      box-shadow: var(--shadow-modal, 0 0 40px rgba(0, 0, 0, 0.3));
    }
  }
</style>