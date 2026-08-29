<!-- 1. Relative path: cockpit/src/lib/components/ui/Button.svelte
     2. Description: Themed button primitive with variants and accessibility passthrough.
     3. Expects: Variant, optional icon, aria-label, and click handler.
     4. Provides: A type-safe, accessible button component. -->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type Size = 'sm' | 'md' | 'lg';

  interface Props {
    variant?: Variant;
    size?: Size;
    icon?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: () => void;
    'aria-label'?: string;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    icon,
    disabled = false,
    type = 'button',
    onclick,
    'aria-label': ariaLabel,
    children,
  }: Props = $props();

  const classes = $derived(`btn btn--${variant} btn--${size}`);
</script>

<button
  class={classes}
  {type}
  {disabled}
  aria-label={ariaLabel}
  onclick={onclick}
>
  {#if icon}
    <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    padding: 11px 18px;
    border-radius: var(--r-sm);
    border: 1px solid transparent;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1;
    color: var(--text-1);
    transition: all var(--duration-fast) var(--ease);
    user-select: none;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn--sm {
    padding: 7px 12px;
    font-size: 11px;
  }

  .btn--lg {
    padding: 14px 24px;
    font-size: 13px;
  }

  .btn--primary {
    background: var(--accent);
    color: var(--on-accent);
  }

  .btn--primary:hover:not(:disabled) {
    box-shadow: 0 0 18px rgba(255,45,149,.5);
  }

  .btn--secondary {
    background: transparent;
    border-color: var(--accent-2);
    color: var(--accent-2);
  }

  .btn--secondary:hover:not(:disabled) {
    background: rgba(0,255,200,.1);
    box-shadow: 0 0 16px rgba(0,255,200,.35);
  }

  .btn--ghost {
    background: transparent;
    color: var(--accent);
  }

  .btn--ghost:hover:not(:disabled) {
    background: var(--surface-2);
  }

  .btn--danger {
    background: transparent;
    border-color: var(--danger);
    color: var(--danger);
  }

  .btn--danger:hover:not(:disabled) {
    background: rgba(255,59,78,.12);
    box-shadow: 0 0 16px rgba(255,59,78,.4);
  }
</style>