<!--
1. Relative path: cockpit/src/routes/+layout.svelte
2. Description: The global UI shell for the Conductor Cockpit.
3. Expects: Svelte 5 snippet rendering for child routes.
4. Provides: A consistent, dark-themed layout with a sidebar and top bar for the swarm dashboard.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import './layout.css'
  
  let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex">
  <aside class="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
    <h1 class="text-2xl font-bold text-fuchsia-400 mb-8">SwISD</h1>
    <nav class="flex flex-col gap-2">
      <a href="/" class="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Dashboard</a>
      <a href="/models" class="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Models</a>
      <a href="/setup" class="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Setup</a>
    </nav>
  </aside>
  
  <main class="flex-1 flex flex-col">
    <header class="h-16 border-b border-slate-800 flex items-center px-8">
      <h2 class="text-xl font-semibold text-slate-300">Conductor Cockpit</h2>
    </header>
    
    <div class="flex-1 p-8 overflow-auto">
      {@render children()}
    </div>
  </main>
</div>