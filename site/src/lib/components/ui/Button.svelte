<!--
1. Relative path: site/src/lib/components/ui/Button.svelte
2. Description: Primary and secondary button primitive with strict, uniform pill sizing and anchored neon glow.
3. Expects: Svelte 5 runes, strict TypeScript, variant prop, optional href for link rendering, and optional class for layout utilities.
4. Provides: A type-safe, accessible button/link component with exact equal heights, dark text on primary, and a downward-shifted hover glow.
-->
<script lang="ts">
  type ButtonVariant = 'primary' | 'secondary';
  
  let {
    variant = 'primary' as ButtonVariant,
    disabled = false as boolean,
    href = undefined as string | undefined,
    target = undefined as string | undefined,
    rel = undefined as string | undefined,
    onclick,
    type = 'button' as 'button' | 'submit' | 'reset',
    class: className = '' as string,
    children
  }: {
    variant?: ButtonVariant;
    disabled?: boolean;
    href?: string;
    target?: string;
    rel?: string;
    onclick?: (e: MouseEvent) => void;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    children: import('svelte').Snippet;
  } = $props();

  // Strict h-12 (48px) guarantees identical heights regardless of internal padding variations.
  const baseClasses = "inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full font-mono text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Shadow shifted down (Y: 12px) and softened (spread: -6px) to anchor the button.
  const variantClasses = $derived(
    variant === 'primary' 
      ? "bg-(--color-lime) text-gray-900 border border-transparent hover:shadow-[0_12px_24px_-6px_var(--color-lime)] hover:scale-[1.02] active:scale-[0.98] disabled:hover:shadow-none disabled:hover:scale-100" 
      : "bg-transparent border border-(--border) text-(--text) hover:bg-(--surface) hover:border-(--color-lime)"
  );

  const finalClass = $derived(`${baseClasses} ${variantClasses} ${className}`.trim());
</script>

{#if href}
  <a
    {href}
    {target}
    {rel}
    class={finalClass}
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
    onclick={onclick}
  >
    {@render children()}
  </a>
{:else}
  <button
    type={type}
    class={finalClass}
    {disabled}
    onclick={onclick}
  >
    {@render children()}
  </button>
{/if}