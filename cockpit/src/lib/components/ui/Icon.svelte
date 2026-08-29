<!-- 1. Relative path: cockpit/src/lib/components/ui/Icon.svelte
     2. Description: Material Symbols icon wrapper with configurable optical settings.
     3. Expects: Icon name and optional weight/fill/grade/size props.
     4. Provides: A typed, theme-aware icon component. -->

<script lang="ts">
  interface Props {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    fill?: 0 | 1;
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
    grade?: -25 | 0 | 200;
    opticalSize?: 20 | 24 | 40 | 48;
    class?: string;
  }

  let {
    name,
    size = 'md',
    fill = 0,
    weight = 400,
    grade = 0,
    opticalSize = 24,
    class: className = '',
  }: Props = $props();

  const sizeClass = $derived(size === 'sm' ? 'mi--sm' : size === 'lg' ? 'mi--lg' : '');
  const style = $derived(`font-variation-settings: 'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`);
</script>

<span
  class="mi {sizeClass} {className}"
  style={style}
  aria-hidden="true"
>{name}</span>