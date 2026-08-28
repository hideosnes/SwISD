<!--
1. Relative path: cockpit/src/routes/models/+page.svelte
2. Description: The Models page view, hosting the drag-and-drop ingestion zone.
3. Expects: Svelte 5 runes for layout and component integration.
4. Provides: A dedicated UI surface for managing heavy AI payloads.
-->
<script lang="ts">
  import ModelDropZone from '$lib/components/ModelDropZone.svelte';
</script>

<div class="space-y-6">
  <h1 class="text-3xl font-bold text-fuchsia-400">Model Distribution</h1>
  <p class="text-slate-400">Ingest heavy AI payloads directly into the swarm's local cache. Files are streamed, chunked, and Merkle-verified without consuming browser memory.</p>
  
  <ModelDropZone />
</div>