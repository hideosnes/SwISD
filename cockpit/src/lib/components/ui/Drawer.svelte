<!-- 1. Relative path: cockpit/src/lib/components/ui/Drawer.svelte
     2. Description: Right-edge slide-in drawer for notifications/actions.
     3. Expects: Open state and content snippet.
     4. Provides: A themed drawer that slides in from the right. -->

<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    children: import('svelte').Snippet;
  }

  let { open, title, onclose, children }: Props = $props();
</script>

{#if open}
  <div 
    class="drawer-backdrop" 
    role="button"
    tabindex="-1"
    aria-label="Close drawer"
    onclick={onclose}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onclose(); }}
  ></div>
{/if}

<aside class="drawer" class:open>
  <div class="drawer-head">
    <h3>{title}</h3>
    <button class="btn btn--ghost btn--icon" onclick={onclose} aria-label="Close drawer">
      <Icon name="close" size="sm" />
    </button>
  </div>
  <div class="drawer-body">
    {@render children()}
  </div>
</aside>

<style>
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(5,6,10,.4);
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(380px, 90vw);
    z-index: 91;
    background: var(--surface);
    border-left: 1px solid var(--border);
    box-shadow: -8px 0 24px rgba(0,0,0,.4);
    transform: translateX(100%);
    transition: transform var(--duration-normal) var(--ease);
    display: flex;
    flex-direction: column;
  }

  .drawer.open {
    transform: translateX(0);
  }

  .drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border);
  }

  .drawer-head h3 {
    font-size: 15px;
    font-weight: 700;
  }

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
  }

  .btn--icon {
    padding: 8px;
  }
</style>