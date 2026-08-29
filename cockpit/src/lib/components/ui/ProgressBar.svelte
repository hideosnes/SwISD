<!--
1. Relative path: cockpit/src/lib/components/ui/ProgressBar.svelte
2. Description: Linear progress indicator primitive.
3. Expects: Progress value (0-100) and standard HTML attributes (like aria-label).
4. Provides: A strictly typed, accessible linear progress bar.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = {
    value: number;
    class?: string;
  } & HTMLAttributes<HTMLDivElement>;

  let { value, class: className, ...rest }: Props = $props();
</script>

<div
  class="h-2 w-full overflow-hidden rounded-[var(--r-full)] bg-[var(--surface-3)] {className ?? ''}"
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={value}
  {...rest}
>
  <div
    class="h-full bg-[var(--accent)] transition-all duration-[var(--duration-normal)] ease-[var(--ease)]"
    style="width: {Math.max(0, Math.min(100, value))}%;"
  ></div>
</div>