<!--
1. Relative path: cockpit/src/lib/components/ModelLibrary.svelte
2. Description: Displays a list of locally available models and active downloads with real-time SSE progress, using expandable cards.
3. Expects: None.
4. Provides: A unified view of model distribution states with inline edit mode and safe deletion.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import { Button, StatusPill, ProgressBar, Modal } from '$lib/components/ui';

  interface LibraryModel {
    readonly modelId: string;
    readonly repoId: string;
    displayName?: string;
    readonly pipelineTag?: string | null;
    readonly tags?: ReadonlyArray<string>;
    readonly requiredCapability: string;
    readonly totalSizeBytes: number;
    readonly createdAt: number;
    readonly healthStatus: 'verified' | 'missing_chunks' | 'not_found';
  }

  interface DownloadProgress {
    readonly modelId: string;
    readonly bytesDownloaded: number;
    readonly totalBytes: number;
    readonly throughputBytesPerSec: number;
    readonly status: 'downloading' | 'chunking' | 'completed' | 'failed';
    readonly error?: string;
  }

  let library = $state<LibraryModel[]>([]);
  let activeDownloads = $state<Map<string, DownloadProgress>>(new Map());
  let eventSource = $state<EventSource | null>(null);
  let expandedModelId = $state<string | null>(null);

  let editName = $state('');

  let showDeleteModal = $state(false);
  let modelToDelete = $state<LibraryModel | null>(null);
  let deleteError = $state<string | null>(null);

  async function fetchLibrary() {
    try {
      const res = await fetch('/api/models/library');
      if (res.ok) {
        const data = await res.json();
        library = data.models || [];
      }
    } catch (err) {
      console.error('Failed to fetch model library', err);
    }
  }

  function connectSSE() {
    if (eventSource) return;
    eventSource = new EventSource('/api/models/status');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as DownloadProgress | { status: string };
      if ('modelId' in data) {
        if (data.status === 'completed' || data.status === 'failed') {
          activeDownloads.delete(data.modelId);
          fetchLibrary();
        } else {
          activeDownloads.set(data.modelId, data);
        }
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource?.close();
      eventSource = null;
    };
  }

  $effect(() => {
    fetchLibrary();
    connectSSE();
    return () => {
      eventSource?.close();
    };
  });

  function startEdit(model: LibraryModel) {
    expandedModelId = model.modelId;
    editName = model.displayName || model.repoId;
  }

  function cancelEdit() {
    expandedModelId = null;
    editName = '';
  }

  async function saveEdit(model: LibraryModel) {
    try {
      const res = await fetch('/api/models/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: model.modelId, displayName: editName.trim() || undefined })
      });
      if (res.ok) {
        library = library.map(m => 
          m.modelId === model.modelId 
            ? { ...m, displayName: editName.trim() || undefined }
            : m
        );
        cancelEdit();
      } else {
        console.error('Failed to rename model');
      }
    } catch (err) {
      console.error('Failed to rename model', err);
    }
  }

  function requestDelete(model: LibraryModel) {
    modelToDelete = model;
    deleteError = null;
    showDeleteModal = true;
  }

  function cancelDelete() {
    showDeleteModal = false;
    modelToDelete = null;
    deleteError = null;
  }

  async function confirmDelete() {
    // Capture to a local const to guarantee non-null narrowing across the await boundary
    const target = modelToDelete;
    if (!target) return;
    
    deleteError = null;
    try {
      const res = await fetch(`/api/models/${target.modelId}`, { method: 'DELETE' });
      if (res.ok) {
        library = library.filter(m => m.modelId !== target.modelId);
        cancelDelete();
      } else {
        const errData = await res.json().catch(() => ({}));
        deleteError = errData.message || 'Failed to delete model';
      }
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Failed to delete model';
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatThroughput = (bytesPerSec: number): string => {
    return `${formatSize(bytesPerSec)}/s`;
  };

  const calculateProgress = (download: DownloadProgress): number => {
    if (download.totalBytes <= 0) return 0;
    return Math.min(100, (download.bytesDownloaded / download.totalBytes) * 100);
  };

  const formatProgressLabel = (download: DownloadProgress): string => {
    if (download.totalBytes <= 0) return '...';
    return `${Math.round((download.bytesDownloaded / download.totalBytes) * 100)}%`;
  };

  const getHealthStatus = (health: string): { label: string; status: 'live' | 'warn' | 'accent' | 'idle' } => {
    if (health === 'verified') return { label: 'Verified', status: 'live' };
    if (health === 'missing_chunks') return { label: 'Missing Chunks', status: 'warn' };
    return { label: 'Not Found', status: 'idle' };
  };
</script>

<div class="flex flex-col gap-4">
  {#if activeDownloads.size > 0}
    <div class="flex flex-col gap-3">
      <h3 class="text-xs font-semibold uppercase tracking-widest text-text-2">Active Ingestions</h3>
      {#each Array.from(activeDownloads.values()) as download (download.modelId)}
        <div class="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-sm flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="text-sm font-semibold text-text-1 font-mono">{download.modelId}</h4>
              <p class="text-xs text-text-2 mt-1">
                {formatSize(download.bytesDownloaded)} / {download.totalBytes > 0 ? formatSize(download.totalBytes) : 'Unknown'} 
                <span class="text-[var(--accent)]">({formatThroughput(download.throughputBytesPerSec)})</span>
              </p>
            </div>
            <StatusPill status="warn" label={download.status === 'chunking' ? 'Chunking' : 'Downloading'} />
          </div>
          
          <div class="flex items-center gap-3">
            <ProgressBar class="flex-1" value={calculateProgress(download)} />
            <span class="text-xs font-mono text-text-2 w-10 text-right tabular-nums">
              {formatProgressLabel(download)}
            </span>
          </div>

          {#if download.error}
            <p class="text-xs text-[var(--danger)]">{download.error}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="flex flex-col gap-3">
    <h3 class="text-xs font-semibold uppercase tracking-widest text-text-2">Available Locally</h3>
    
    {#if library.length === 0 && activeDownloads.size === 0}
      <div class="p-8 text-center text-text-2 border border-dashed border-[var(--border)] rounded-sm">
        <p class="text-sm">No models found. Fetch a model from HuggingFace or upload a local file.</p>
      </div>
    {:else}
      {#each library as model (model.modelId)}
        {@const health = getHealthStatus(model.healthStatus)}
        <div class="border border-[var(--border)] rounded-sm bg-[var(--bg)] overflow-hidden transition-colors">
          <button 
            class="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors text-left"
            onclick={() => expandedModelId === model.modelId ? cancelEdit() : startEdit(model)}
            aria-expanded={expandedModelId === model.modelId}
          >
            <div class="flex items-center gap-3 min-w-0">
              <h4 class="text-sm font-semibold text-text-1 font-mono truncate">
                {model.displayName || model.repoId}
              </h4>
              {#if model.displayName}
                <span class="text-xs text-text-3 font-mono truncate">({model.repoId})</span>
              {/if}
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <StatusPill status={health.status} label={health.label} />
              <svg 
                class="w-4 h-4 text-text-3 transition-transform duration-200 {expandedModelId === model.modelId ? 'rotate-180' : ''}" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {#if expandedModelId === model.modelId}
            <div class="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label for="edit-name-{model.modelId}" class="text-[11px] font-semibold uppercase tracking-widest text-text-2">Display Name</label>
                <div class="flex items-center gap-2">
                  <input 
                    id="edit-name-{model.modelId}"
                    type="text" 
                    bind:value={editName} 
                    class="flex-1 px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-xs text-text-1 focus:outline-none focus:border-[var(--accent)] font-mono"
                    placeholder={model.repoId}
                    onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') saveEdit(model); if (e.key === 'Escape') cancelEdit(); }}
                  />
                  <Button variant="primary" size="sm" onclick={() => saveEdit(model)}>Save</Button>
                  <Button variant="ghost" size="sm" onclick={cancelEdit}>Cancel</Button>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xs">
                  <p class="text-[10px] uppercase text-text-3">Size</p>
                  <p class="text-sm font-mono text-text-1">{formatSize(model.totalSizeBytes)}</p>
                </div>
                <div class="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xs">
                  <p class="text-[10px] uppercase text-text-3">Capability</p>
                  <p class="text-sm font-mono text-text-1 capitalize">{model.requiredCapability}</p>
                </div>
                <div class="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xs col-span-2 md:col-span-2">
                  <p class="text-[10px] uppercase text-text-3">Modalities & Tags</p>
                  <div class="flex flex-wrap gap-2 mt-1">
                    {#if model.pipelineTag}
                      <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-[var(--surface-2)] text-text-2 border border-[var(--border)]">
                        {model.pipelineTag}
                      </span>
                    {/if}
                    {#each (model.tags || []).slice(0, 5) as tag (tag)}
                      <span class="text-[10px] px-1.5 py-0.5 rounded-xs bg-[var(--surface-2)] text-text-3 border border-[var(--border)]">
                        {tag}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button variant="danger" size="sm" icon="delete" onclick={() => requestDelete(model)}>Delete Model</Button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<Modal open={showDeleteModal} onclose={cancelDelete} title="Confirm Deletion">
  <div class="flex flex-col gap-3">
    <p class="text-sm text-text-2">
      Are you sure you want to delete <span class="font-mono text-text-1 font-semibold">{modelToDelete?.displayName || modelToDelete?.repoId}</span>? 
      This will permanently remove the model files from disk and cannot be undone.
    </p>
    {#if deleteError}
      <p class="text-xs text-[var(--danger)] p-3 bg-[rgba(255,59,78,0.1)] border border-[var(--danger)] rounded-sm" role="alert">
        {deleteError}
      </p>
    {/if}
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={cancelDelete}>Cancel</Button>
    <Button variant="danger" icon="delete" onclick={confirmDelete}>Delete Permanently</Button>
  {/snippet}
</Modal>