<!--
1. Relative path: cockpit/src/lib/components/ui/Badge.svelte
2. Description: Compact numeric counter chip for buttons and panel headers.
3. Expects: A non-negative count.
4. Provides: A token-themed, aria-hidden counter badge that renders nothing at zero.
-->
<script lang="ts">
  interface Props {
    count: number;
  }

  let { count }: Props = $props();

  const display = $derived(count > 99 ? '99+' : String(count));
</script>

{#if count > 0}
  <span class="badge" aria-hidden="true">{display}</span>
{/if}

<style>
  @layer components {
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.3rem;
      border-radius: var(--r-sm);
      background: var(--accent);
      color: var(--bg);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
    }
  }
</style>