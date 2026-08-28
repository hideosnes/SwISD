<!--
1. Relative path: cockpit/src/lib/components/ModelDropZone.svelte
2. Description: An accessible Svelte 5 reactive component that handles drag-and-drop and click-to-upload model ingestion, streaming the file directly to the BFF to prevent browser memory bloat.
3. Expects: Svelte 5 runes for local state management and drag/drop/click events.
4. Provides: A visual, keyboard-accessible drop zone with real-time upload progress, screen-reader announcements, and final manifest display.
-->
<script lang="ts">
  import type { ModelManifest } from '$core/models/index.js';
  
  let isDragging = $state(false);
  let isUploading = $state(false);
  let progress = $state(0);
  let manifest = $state<ModelManifest | null>(null);
  let error = $state<string | null>(null);
  
  // Svelte 5 bind:this to reference the hidden file input
  let fileInput: HTMLInputElement | null = $state(null);

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function onDragLeave() {
    isDragging = false;
  }

  async function processFile(file: File) {
    if (!file.name.endsWith('.gguf') && !file.name.endsWith('.bin')) {
      error = 'Only .gguf or .bin model files are supported.';
      return;
    }

    error = null;
    isUploading = true;
    progress = 0;
    manifest = null;

    try {
      const stream = file.stream();
      let uploadedBytes = 0;
      
      const trackingStream = new ReadableStream<Uint8Array>({
        async start(controller: ReadableStreamDefaultController<Uint8Array>) {
          const reader = stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              uploadedBytes += value.byteLength;
              progress = (uploadedBytes / file.size) * 100;
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }
        }
      });

      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Model-Name': file.name,
        },
        body: trackingStream,
        duplex: 'half',
      } as RequestInit & { duplex: string };

      const res = await fetch('/api/models/ingest', fetchOptions);

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      
      manifest = await res.json() as ModelManifest;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown upload error';
    } finally {
      isUploading = false;
      // Reset file input so the same file can be selected again if needed
      if (fileInput) fileInput.value = '';
    }
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) {
      await processFile(file);
    }
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      void processFile(file);
    }
  }

  // Keyboard accessibility: Allow Enter or Space to trigger the file input
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput?.click();
    }
  }
</script>

<div 
  class="relative border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-900 {isDragging ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-700 bg-slate-900'}"
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
  onclick={() => fileInput?.click()}
  onkeydown={onKeydown}
  role="button"
  tabindex="0"
  aria-label="Drag and drop or click to upload a model file"
>
  <!-- Hidden, accessible file input -->
  <input 
    type="file" 
    id="file-upload" 
    class="sr-only" 
    accept=".gguf,.bin" 
    onchange={handleFileSelect} 
    bind:this={fileInput}
  />

  {#if isUploading}
    <div class="space-y-4" aria-live="polite">
      <p class="text-lg font-semibold text-slate-200">Streaming to Conductor...</p>
      <div class="w-full bg-slate-800 rounded-full h-4 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
        <div class="bg-fuchsia-500 h-full transition-all duration-200" style="width: {progress}%"></div>
      </div>
      <p class="text-sm text-slate-400">{progress.toFixed(1)}% uploaded</p>
    </div>
  {:else if manifest}
    <div class="space-y-2" aria-live="polite">
      <p class="text-lg font-semibold text-green-400">Model Ingested Successfully!</p>
      <p class="text-sm text-slate-400">ID: <span class="font-mono text-cyan-400">{manifest.modelId}</span></p>
      <p class="text-sm text-slate-400">Chunks: {manifest.totalChunks} | Root: <span class="font-mono text-xs">{manifest.merkleRoot.slice(0, 16)}...</span></p>
      <button 
        type="button"
        onclick={(e) => { e.stopPropagation(); manifest = null; progress = 0; if (fileInput) fileInput.value = ''; }} 
        class="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
      >
        Ingest Another
      </button>
    </div>
  {:else}
    <div class="space-y-2">
      <p class="text-xl font-semibold text-slate-300">Drag & Drop Model</p>
      <p class="text-sm text-slate-500">Drop a .gguf or .bin file here, or click to browse.</p>
    </div>
  {/if}

  {#if error}
    <p class="mt-4 text-sm text-red-400" role="alert">{error}</p>
  {/if}
</div>

<style>
  /* Utility to visually hide the input but keep it accessible to screen readers and keyboard navigation */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>