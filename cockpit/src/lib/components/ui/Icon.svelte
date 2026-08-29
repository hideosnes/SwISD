<!--
1. Relative path: cockpit/src/lib/components/ui/Icon.svelte
2. Description: Material Symbols Rounded icon primitive.
3. Expects: Icon glyph name, optional visual axis values, and standard HTML attributes.
4. Provides: A strictly typed, accessible Material Symbols wrapper.
-->

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    fill?: 0 | 1;
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
    class?: string;
  } & HTMLAttributes<HTMLSpanElement>;

  let {
    name,
    size = 'md',
    fill = 0,
    weight = 400,
    class: className,
    ...rest
  }: Props = $props();

  const sizeClass = $derived(
    size === 'sm' ? 'mi--sm' : size === 'lg' ? 'mi--lg' : ''
  );
</script>

<span
  class="mi {sizeClass} {className ?? ''}"
  style="font-variation-settings: 'FILL' {fill}, 'wght' {weight}, 'GRAD' 0, 'opsz' 24;"
  {...rest}
>
  {name}
</span>