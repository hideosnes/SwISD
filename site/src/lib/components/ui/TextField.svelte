<!--
1. Relative path: site/src/lib/components/ui/TextField.svelte
2. Description: Accessible text input primitive with pill geometry.
3. Expects: Svelte 5 runes, strict TypeScript, explicit label association.
4. Provides: A type-safe, accessible input component with stable ID generation, deep blue resting state, and lime focus ring.
-->
<script lang="ts">
  let {
    id,
    label,
    type = 'text' as 'text' | 'email' | 'password',
    placeholder = '' as string,
    required = false as boolean,
    value = '' as string,
    onchange
  }: {
    id?: string;
    label: string;
    type?: 'text' | 'email' | 'password';
    placeholder?: string;
    required?: boolean;
    value?: string;
    onchange?: (e: Event) => void;
  } = $props();

  const generatedId = `input-${Math.random().toString(36).slice(2, 9)}`;
  const finalId = $derived(id ?? generatedId);
</script>

<div class="text-field w-full">
  <label for={finalId} class="block font-mono text-sm text-(--text-muted) mb-2">{label}</label>
  <input
    id={finalId}
    {type}
    {placeholder}
    {required}
    bind:value
    onchange={onchange}
    class="w-full px-6 py-3 min-h-[48px] rounded-full bg-(--surface) border border-(--border) text-(--text) placeholder-(--text-muted) focus:outline-none focus:border-(--color-lime) focus:ring-2 focus:ring-(--color-lime)/20 transition-all"
  />
</div>