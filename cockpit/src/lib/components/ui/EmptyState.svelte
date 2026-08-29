<!-- 1. Relative path: cockpit/src/lib/components/ui/EmptyState.svelte
     2. Description: Empty state placeholder for lists/grids.
     3. Expects: Icon name, title, description, and optional action snippet.
     4. Provides: A themed empty state with icon and call-to-action. -->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    icon: string;
    title: string;
    description?: string;
    action?: Snippet;
  }

  let { icon, title, description, action }: Props = $props();
</script>

<div class="empty-state">
  <Icon name={icon} size="lg" />
  <h4>{title}</h4>
  {#if description}
    <p>{description}</p>
  {/if}
  {#if action}
    <div class="empty-actions">
      {@render action()}
    </div>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl);
    text-align: center;
    color: var(--text-3);
    gap: var(--space-md);
  }

  .empty-state :global(.mi) {
    font-size: 48px;
    color: var(--text-3);
    opacity: 0.5;
  }

  .empty-state h4 {
    color: var(--text-2);
    font-weight: 600;
  }

  .empty-state p {
    font-size: 13px;
    max-width: 300px;
  }

  .empty-actions {
    margin-top: var(--space-sm);
  }
</style>