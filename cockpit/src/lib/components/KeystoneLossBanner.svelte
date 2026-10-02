<!--
1. Relative path: cockpit/src/lib/components/KeystoneLossBanner.svelte
2. Description: Shell banner for keystone-loss observability.
3. Expects: Keystone state booleans.
4. Provides: A loud, accessible warning when the control plane is frozen.
-->
<script lang="ts">
  import { Icon } from '$lib/components/ui/index.js';
  
  interface Props {
    isBonded: boolean;
    isWhitelisted: boolean;
    isKeystone: boolean;
  }
  
  let { isBonded, isWhitelisted, isKeystone }: Props = $props();
  
  // "Lost" means we are bonded, but we are NOT the keystone, and we are NOT whitelisted (or keystone is dead)
  // For now, we show it if we are bonded but not whitelisted (rogue) or if we detect keystone loss via health monitor (TODO: wire health monitor)
  const isLost = $derived(isBonded && !isKeystone && !isWhitelisted);
</script>

{#if isLost}
  <div class="keystone-banner" role="alert" aria-live="assertive">
    <Icon name="error" size="lg" />
    <div class="keystone-text">
      <strong>Keystone Lost — Control Plane Frozen</strong>
      <p>Execution continues, but enrollment and policy mutations are blocked. Restore the keystone or use your recovery phrase.</p>
    </div>
  </div>
{/if}

<style>
  @layer components {
    .keystone-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-xl);
      background: rgba(255, 59, 78, 0.12);
      border-bottom: 1px solid var(--danger);
      color: var(--danger);
    }
    .keystone-text p {
      font-size: var(--text-xs);
      color: var(--text-2);
      margin-top: 2px;
    }
  }
</style>