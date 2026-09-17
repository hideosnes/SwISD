<!--
1. Relative path: site/src/lib/components/ui/CodeBlock.svelte
2. Description: Formalized code block primitive with macOS-style window dots and filename.
3. Expects: Svelte 5 runes, strict TypeScript, snippet children.
4. Provides: A type-safe, accessible code container enforcing consistent syntax highlighting structure.
")
-->
<script lang="ts">
  let {
    filename = 'example.ts' as string,
    children
  }: {
    filename?: string;
    children: import('svelte').Snippet;
  } = $props();
</script>

<div class="rounded-xl overflow-hidden border border-(--border) bg-(--bg)">
  <div class="flex items-center gap-2 px-4 py-3 bg-(--surface) border-b border-(--border)">
    <span class="w-3 h-3 rounded-full bg-red-500"></span>
    <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
    <span class="w-3 h-3 rounded-full bg-green-500"></span>
    <span class="font-mono text-xs text-(--text-muted) ml-2">{filename}</span>
  </div>
  <div class="p-6 overflow-x-auto">
    {@render children()}
  </div>
</div>